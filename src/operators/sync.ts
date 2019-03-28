import { Action, ActionHandler, SyncAction, ActionCreator } from '../types'
import { HOperator } from '../api'

/**
 * Handles standard action handler.
 */
export function sync<RS, S, A, T>(fn: ActionHandler<S, Action & { args: A }>): HOperator<RS, S, A, T, T, any, Action> {
  return {
    hooks: {
      customAction: ({ handler, type }) => {
        handler.actionHandlers[type] = fn as ActionHandler<S, Action>
        const factory = (args => ({ type, args })) as ActionCreator<A, SyncAction>
        factory.TYPE = type
        return factory
      }
    }
  }
}