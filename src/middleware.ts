import { Dispatch, Middleware, MiddlewareAPI } from 'redux'
import { ActionSystem, Lifecycle } from './handler'

export const handlerMiddleware: Middleware = <S>({ dispatch }: MiddlewareAPI<S>) =>
  (next: Dispatch<S>) =>
    (action: ActionSystem) => {
      if (action.__state === Lifecycle.Pending) {
        if (action.promise && typeof action.promise === 'function') {
          return action.promise(action.args).then(
            payload => {
              dispatch({
                ...action,
                __state: Lifecycle.Fulfilled,
                payload
              })
              return payload
            },
            error => {
              dispatch({
                ...action,
                __state: Lifecycle.Rejected,
                payload: error,
                error: true
              })
              return error
            })
        }
      }

      return next(action)
    }