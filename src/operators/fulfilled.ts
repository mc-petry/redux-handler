import { ActionHandler, Lifecycle, Action } from '../types'
import { HOperator } from '../api'

export interface FulfilledAction<A = any, T = any> extends Action {
  args: A
  payload: Exclude<T, Action>
}

/**
 * Occurs on async method succeeds
 */
export function fulfilled<RS, S, TArgs, T, A>(hr: ActionHandler<S, FulfilledAction<TArgs, T>>): HOperator<RS, S, TArgs, T, T, A, A> {
  return ({
    hooks: {
      init: ({ chain }) => {
        chain.asyncActionHandlers[Lifecycle.Fulfilled].push(hr)
      }
    }
  })
}