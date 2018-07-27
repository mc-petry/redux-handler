import { ActionHandler, Lifecycle, Action } from '../types'
import { AsyncOperator } from '../api'

export interface FinalizeAction<A = any> extends Action {
  args: A
}

/**
 * Occurs after async method is executed
 */
export const finalize = <RS, S, TArgs, T, A>(hr: ActionHandler<S, FinalizeAction<TArgs>>):
  AsyncOperator<RS, S, TArgs, T, T, A, A> =>
  ({
    hooks: {
      init: ({ chain }) => {
        chain.asyncActionHandlers[Lifecycle.Finally].push(hr)
      }
    }
  })