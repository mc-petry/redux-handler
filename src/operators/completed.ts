import { ActionHandler, Lifecycle, Action } from '../types'
import { HOperator } from '../api'

export interface CompletedAction<A = any> extends Action {
  args: A
}

/**
 * Occurs after async method is completed.
 */
export function completed<RS, S, TArgs, T, A>(hr: ActionHandler<S, CompletedAction<TArgs>>): HOperator<RS, S, TArgs, T, T, A, A> {
  return ({
    hooks: {
      init: ({ chain }) => {
        chain.asyncActionHandlers[Lifecycle.Completed].push(hr)
      }
    }
  })
}