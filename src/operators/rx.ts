import { Lifecycle, Action, META_SYM, InternalAction, ARGS_SYM } from '../types'
import { mergeMap, finalize } from 'rxjs/operators'
import { errorHandler } from '../internal/error-handler'
import { AsyncOperator, BeforeNextHook, AfterNextHook } from '../api'
import { Subject, Subscription, Observable, EMPTY } from 'rxjs'
import { mutateInternalAction } from '../internal/utils'
import { PendingAction } from './pending'
import { FulfilledAction } from './fulfilled'
import { RejectedAction } from './rejected'
import { FinalizeAction } from './finalize'

declare module 'redux' {
  interface Dispatch<A extends Action = AnyAction> {
    // tslint:disable-next-line:callable-types
    (action: RxAction): Subscription
  }
}

interface RxInjects<TRootStore> {
  /**
   * Gets global redux state
   */
  getState: () => TRootStore

  /**
   * Root stream
   */
  action$: Observable<Action>

  /**
   * Action name
   */
  type: string
}

type RxFn<RS = any, S = any, A = any, T = any> = (args: A, injects: RxInjects<RS>) => Observable<T>

/**
 * Needs to have explicit rx interface to
 * support intellisense inside redux dispatch
 */
export interface RxAction extends Action {
  rx: true
}

const RX_SYM = Symbol('rx')

interface RxInternalAction extends InternalAction, RxAction {
  [RX_SYM]: {
    fn: RxFn
  }
}

/**
 * Global stream
 * Only actions with rx passed through
 */
const action$ = new Subject<Action>()

const beforeNext: BeforeNextHook<any> = ({ dispatch, action, options, getState, defaultPrevented }) => {
  const meta = action[META_SYM]
  const rxmeta = (action as Partial<RxInternalAction>)[RX_SYM]

  if (
    !rxmeta ||
    meta.state !== Lifecycle.INIT
  )
    return

  if (defaultPrevented)
    return EMPTY.subscribe()

  const args = action[ARGS_SYM]

  if (meta.async.pending)
    dispatch(mutateInternalAction<PendingAction>(action, Lifecycle.Pending, { args }))

  const subscription = rxmeta.fn(args, { getState, action$, type: action.type })
    .pipe(
      mergeMap((output: Action) => {
        if (output === undefined)
          throw new TypeError(`Action ${action.type} does not return a stream`)

        const payloads: any[] = []

        if (output && typeof output.type === 'string') {
          dispatch(output)
        }
        else {
          payloads.push(output)
        }

        return payloads
      }),

      finalize(() => {
        if (meta.async.finally)
          dispatch(mutateInternalAction<FinalizeAction>(action, Lifecycle.Finally, { args }))
      })
    )
    .subscribe(
      payload => {
        if (meta.async.fulfilled)
          dispatch(mutateInternalAction<FulfilledAction>(action, Lifecycle.Fulfilled, { payload, args }))
      },

      error => {
        if (meta.async.rejected)
          dispatch(mutateInternalAction<RejectedAction>(action, Lifecycle.Rejected, { error, args }))

        errorHandler({ action, dispatch, error, options })
      }
    )

  return subscription
}

const afterNext: AfterNextHook<any> = ({ action }) => {
  action$.next(action)
}

export const rx = <RS, S, A, T>(fn: RxFn<RS, S, A, T>): AsyncOperator<RS, S, A, T, T, any, RxAction> => ({
  hooks: {
    action: e => {
      const action: RxInternalAction = {
        ...e.action,
        rx: true,
        [RX_SYM]: { fn }
      }

      return action
    },
    beforeNext,
    afterNext
  }
})