import { Lifecycle, Action, META_SYM, InternalAction, ARGS_SYM } from '../types'
import { mergeMap, finalize } from 'rxjs/operators'
import { errorHandler } from '../internal/error-handler'
import { HOperator, BeforeNextHook } from '../api'
import { Subject, Observable } from 'rxjs'
import { mutateInternalAction, payloadIsAction } from '../internal/utils'
import { PendingAction } from './pending'
import { FulfilledAction } from './fulfilled'
import { RejectedAction } from './rejected'
import { CompletedAction } from './completed'
import { HandlerPlugin, PluginOnNextHookEvent } from '../plugin-api'

declare module 'redux' {
  interface Dispatch<A extends Action = AnyAction> {
    (action: RxAction): Promise<any>
  }
}

interface RxInjects<TRootStore> {
  /**
   * Gets the global redux state.
   */
  getState: () => TRootStore

  /**
   * Gets the root stream.
   */
  action$: Observable<Action>

  /**
   * Gets the action type.
   */
  type: string
}

type RxFn<RS = any, S = any, A = any, T = any> = (args: A, injects: RxInjects<RS>) => Observable<T>

/**
 * Needs to have explicit rx interface to
 * support intellisense inside redux dispatch.
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

class RxPlugin implements HandlerPlugin {
  /**
   * Root stream. All actions passed though it.
   * Applies after first usage of rx operator.
   */
  readonly action$ = new Subject<Action>()

  onNext(e: PluginOnNextHookEvent) {
    this.action$.next(e.action)
  }
}

// tslint:disable-next-line:no-empty
const EMPTY_FN = () => { }

const beforeNext: BeforeNextHook<any> = ({ dispatch, action, options, getState, defaultPrevented }) => {
  const meta = action[META_SYM]
  const rxmeta = (action as Partial<RxInternalAction>)[RX_SYM]

  if (
    !rxmeta ||
    meta.state !== Lifecycle.INIT
  )
    return

  if (defaultPrevented)
    return Promise.resolve()

  const args = action[ARGS_SYM]

  if (meta.async.pending)
    dispatch(mutateInternalAction<PendingAction>(action, Lifecycle.Pending, { args }))

  // #region Find RxPlugin

  let plugin = options.plugins.find(x => x instanceof RxPlugin) as RxPlugin

  if (!plugin) {
    // Explicitly register plugin
    plugin = new RxPlugin()
    options.plugins.push(plugin)
  }

  // #endregion

  const obs = rxmeta.fn(args, { getState, action$: plugin.action$, type: action.type })
    .pipe(
      mergeMap((actionOrPayload: Action) => {
        if (actionOrPayload === undefined)
          throw new TypeError(`Action ${action.type} does not return a stream.`)

        const payloads: any[] = []

        if (payloadIsAction(actionOrPayload)) {
          dispatch(actionOrPayload)
        }
        else {
          payloads.push(actionOrPayload)
        }

        return payloads
      }),

      finalize(() => {
        if (meta.async.completed)
          dispatch(mutateInternalAction<CompletedAction>(action, Lifecycle.Completed, { args }))
      })
    )

  obs.subscribe(
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

  return obs.toPromise()
    .catch(EMPTY_FN)
}

/**
 * Handles rxjs observable.
 */
export function rx<RS, S, A, T>(fn: RxFn<RS, S, A, T>): HOperator<RS, S, A, T, T, any, RxAction> {
  return ({
    hooks: {
      modifyAction: e => {
        const action: RxInternalAction = {
          ...e.action,
          rx: true,
          [RX_SYM]: { fn }
        }

        return action
      },
      beforeNext
    }
  })
}