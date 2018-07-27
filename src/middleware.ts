import { Dispatch, Middleware, MiddlewareAPI } from 'redux'
import { InternalAction, Action, META_SYM } from './types'
import { AsyncOperatorOnNextEvent, AsyncOperatorOnBeforeNextEvent } from './api'

export interface ErrorHandlerInjects {
  /**
   * Action type
   */
  type: string
}

export interface MiddlewareOptions {
  /**
   * You can return a new action to dispatch in store
   */
  errorHandler?: (error: any, injects: ErrorHandlerInjects) => Action | void
}

type Mutable<T> = { -readonly [P in keyof T]: T[P] }

export const handlerMiddleware: (options?: MiddlewareOptions) => Middleware =
  (options = {}) => <D extends Dispatch, S>({ dispatch, getState }: MiddlewareAPI<D, S>) =>
    (next: Dispatch<Action>) =>
      (action: InternalAction) => {
        const meta = action[META_SYM]

        // #region Handle before hooks

        if (meta && meta.operators) {
          const eventArgs: Mutable<AsyncOperatorOnBeforeNextEvent<S>> = {
            action,
            dispatch,
            getState,
            options,
            defaultPrevented: false,

            preventDefault: () => {
              eventArgs.defaultPrevented = true
            }
          }

          for (const op of meta.operators)
            if (op.hooks.beforeNext) {
              const res = op.hooks.beforeNext(eventArgs)

              if (res !== undefined)
                return res
            }
        }

        // #endregion

        action = next(action)

        // #region Handle after hooks

        if (meta && meta.operators) {
          const eventArgs: Mutable<AsyncOperatorOnNextEvent<S>> = { action, dispatch, getState, options }

          for (const op of meta.operators)
            if (op.hooks.afterNext) {
              const res = op.hooks.afterNext(eventArgs)

              if (res !== undefined)
                eventArgs.action = res
            }

          return eventArgs.action
        }

        // #endregion

        return action
      }