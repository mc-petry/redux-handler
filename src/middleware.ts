import { Dispatch, Middleware, MiddlewareAPI } from 'redux'
import { IAsyncActionLifecycle, Lifecycle } from './handler'

export const handlerMiddleware: Middleware = <S>({ dispatch, getState }: MiddlewareAPI<S>) =>
  (next: Dispatch<S>) =>
    (action: IAsyncActionLifecycle<any, any, any, any>) =>
      typeof action.__shouldCall === 'function' && !action.__shouldCall(getState())
        ? Promise.resolve()
        : action.promise
          && typeof action.promise === 'function'
          && action.__state === Lifecycle.Pending

          ? action.promise(action.args).then(
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
              throw error
            })
          : next(action)