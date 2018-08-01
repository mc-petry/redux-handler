import { Lifecycle, Action, META_SYM, InternalAction, ARGS_SYM } from '../types'
import { errorHandler } from '../internal/error-handler'
import { HOperator, BeforeNextHook } from '../api'
import { mutateInternalAction } from '../internal/utils'
import { PendingAction } from './pending'
import { FulfilledAction } from './fulfilled'
import { RejectedAction } from './rejected'
import { CompletedAction } from './completed'

declare module 'redux' {
  interface Dispatch<A extends Action = AnyAction> {
    // tslint:disable-next-line:callable-types
    <T>(action: PromiseAction<T>): PromiseLike<T>
  }
}

interface PromiseInjects<TRootStore> {
  /**
   * Gets global redux state
   */
  getState: () => TRootStore

  /**
   * Action name
   */
  type: string
}

type PromiseFn<RS = any, S = any, A = any, T = any> = (args: A, injects: PromiseInjects<RS>) => PromiseLike<T>

/**
 * Needs to have explicit rx interface to
 * support intellisense inside redux dispatch
 */
export interface PromiseAction<T> extends Action {
  promise: true
}

const PROMISE_SYM = Symbol('rx')

interface PromiseInternalAction extends InternalAction, PromiseAction<any> {
  [PROMISE_SYM]: {
    fn: PromiseFn
  }
}

const beforeNext: BeforeNextHook<any> = ({ dispatch, action, options, getState, defaultPrevented }) => {
  const meta = action[META_SYM]
  const promiseMeta = (action as Partial<PromiseInternalAction>)[PROMISE_SYM]

  if (
    !promiseMeta ||
    meta.state !== Lifecycle.INIT
  )
    return

  if (defaultPrevented)
    return Promise.resolve()

  const args = action[ARGS_SYM]

  if (meta.async.pending)
    dispatch(mutateInternalAction<PendingAction>(action, Lifecycle.Pending, { args }))

  return promiseMeta.fn(args, { getState, type: action.type })
    .then(
      payload => {
        if (meta.async.fulfilled)
          dispatch(mutateInternalAction<FulfilledAction>(action, Lifecycle.Fulfilled, { args, payload }))

        if (meta.async.completed)
          dispatch(mutateInternalAction<CompletedAction>(action, Lifecycle.Completed, { args }))

        return payload
      },
      error => {
        if (meta.async.rejected)
          dispatch(mutateInternalAction<RejectedAction>(action, Lifecycle.Rejected, { error, args }))

        if (meta.async.completed)
          dispatch(mutateInternalAction<CompletedAction>(action, Lifecycle.Completed, { args }))

        errorHandler({ action, dispatch, error, options })
      }
    )
}

/**
 * Handle rxjs observable
 */
export function promise<RS, S, A, T>(fn: PromiseFn<RS, S, A, T>): HOperator<RS, S, A, T, T, any, PromiseAction<T>> {
  return ({
    hooks: {
      modifyAction: e => {
        const action: PromiseInternalAction = {
          ...e.action,
          promise: true,
          [PROMISE_SYM]: { fn }
        }

        return action
      },
      beforeNext
    }
  })
}