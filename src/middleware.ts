import { Dispatch, Middleware, MiddlewareAPI } from 'redux'
import { InternalAction, Action, META_SYM } from './types'
import { HOperatorOnAfterNextEvent, HOperatorOnBeforeNextEvent } from './api'
import { HandlerPlugin, PluginOnNextHookEvent } from './plugin-api'

export interface ErrorHandlerInjects {
  /**
   * Gets the action type.
   */
  type: string
}

export interface MiddlewareOptions {
  /**
   * Allows to return a new action to dispatch in store.
   */
  errorHandler?: (error: any, injects: ErrorHandlerInjects) => Action | void
  plugins: HandlerPlugin[]
}

type Mutable<T> = { -readonly [P in keyof T]: T[P] }

export const handlerMiddleware: (options?: Partial<MiddlewareOptions>) => Middleware =
  (options = {}) => {
    if (!options.plugins)
      options.plugins = []

    return <D extends Dispatch, S>({ dispatch, getState }: MiddlewareAPI<D, S>) =>
      (next: Dispatch<Action>) =>
        (action: InternalAction<any>) => {
          const meta = action[META_SYM]

          // #region Handle operators before next hooks

          if (meta && meta.operators) {
            const eventArgs: Mutable<HOperatorOnBeforeNextEvent<S, any>> = {
              action,
              dispatch,
              getState,
              options: options as MiddlewareOptions,
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

          // #region Handle plugin on next hook


          for (const plugin of options.plugins!) {
            const e: PluginOnNextHookEvent<Action> = { action }

            if (plugin.onNext)
              plugin.onNext(e)
          }

          // #endregion

          // #region Handle operators after next hooks

          if (meta && meta.operators) {
            const eventArgs: Mutable<HOperatorOnAfterNextEvent<S>> = {
              action,
              dispatch,
              getState,
              options: options as MiddlewareOptions
            }

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
  }