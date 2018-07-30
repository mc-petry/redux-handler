import { ActionHandler, Lifecycle, Action } from '../types'
import { HOperator } from '../api'

export interface RejectedAction<A = any> extends Action {
  error: any
  args: A
}

/**
 * Occurs on async method failed
 */
export const rejected = <RS, S, TArgs, T, A>(hr: ActionHandler<S, RejectedAction<TArgs>>):
  HOperator<RS, S, TArgs, T, T, A, A> =>
  ({
    hooks: {
      init: ({ chain }) => {
        chain.asyncActionHandlers[Lifecycle.Rejected].push(hr)
      }
    }
  })