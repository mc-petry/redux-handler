import { Lifecycle, Action, META_SYM, InternalAction, ARGS_SYM } from '../types'
import { errorHandler } from '../internal/error-handler'
import { HOperator, BeforeNextHook } from '../api'
import { mutateInternalAction, payloadIsAction } from '../internal/utils'
import { PendingAction } from './pending'
import { FulfilledAction } from './fulfilled'
import { RejectedAction } from './rejected'
import { CompletedAction } from './completed'

declare module 'redux' {
  interface Dispatch<A extends Action = AnyAction> {
    <T>(action: PromiseAction<T>): PromiseLike<T>
  }
}

interface PromiseInjects<TRootStore> {
  /**
   * Gets global redux state.
   */
  getState: () => TRootStore

  /**
   * Gets the action type.
   */
  type: string
}

type PromiseFn<RS = any, S = any, A = any, T = any> = (args: A, injects: PromiseInjects<RS>) => PromiseLike<T>

/**
 * Needs to have explicit promise interface to
 * support intellisense inside redux dispatch.
 */
export interface PromiseAction<T> extends Action {
  promise: true
}

const PROMISE_SYM = Symbol('promise')
const PROMISE_PUT = Symbol('put')

interface PromisePut {
  [PROMISE_PUT]: (Action | any)[]
}

interface PromiseInternalAction extends InternalAction, PromiseAction<any> {
  [PROMISE_SYM]: {
    fn: PromiseFn
  }
}

function isPromisePut(payload: any): payload is PromisePut {
  return payload && (payload as PromisePut)[PROMISE_PUT] != null
}

const beforeNext: BeforeNextHook<any, InternalAction> = ({ dispatch, action, options, getState, defaultPrevented }) => {
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
      output => {
        const payloads = []

        if (isPromisePut(output)) {
          for (const actionOrPayload of output[PROMISE_PUT]) {
            if (payloadIsAction(actionOrPayload)) {
              dispatch(actionOrPayload)
            }
            else {
              payloads.push(actionOrPayload)
            }
          }
        }
        else {
          payloads.push(output)
        }

        for (const payload of payloads) {
          if (meta.async.fulfilled)
            dispatch(mutateInternalAction<FulfilledAction>(action, Lifecycle.Fulfilled, { args, payload }))
        }

        if (meta.async.completed)
          dispatch(mutateInternalAction<CompletedAction>(action, Lifecycle.Completed, { args }))

        return payloads
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
 * Handles promise.
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

/**
 * Allows to dispatch actions after promise resolved.
 * Other data will be passed.
 */
promise.put = <T>(data: T[]): Exclude<T, Action> => {
  const obj: PromisePut = {
    [PROMISE_PUT]: data
  }

  return obj as any
}