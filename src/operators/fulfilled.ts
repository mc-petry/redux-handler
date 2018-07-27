import { ActionHandler, Lifecycle, Action } from '../types'
import { AsyncOperator } from '../api'

export interface FulfilledAction<A = any, T = any> extends Action {
  args: A
  payload: T
}

/**
 * Occurs after async method succeeds
 */
export const fulfilled = <RS, S, TArgs, T, A>(hr: ActionHandler<S, FulfilledAction<TArgs, T>>):
  AsyncOperator<RS, S, TArgs, T, T, A, A> =>
  ({
    hooks: {
      init: ({ chain }) => {
        chain.asyncActionHandlers[Lifecycle.Fulfilled].push(hr)
      }
    }
  })