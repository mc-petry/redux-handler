import { Dispatch, Middleware, MiddlewareAPI } from 'redux'
import { ActionSystem, Lifecycle, Action } from './handler'
import { Subject } from 'rxjs'

export const handlerMiddleware: Middleware = <S>({ dispatch, getState }: MiddlewareAPI<S>) => {
  const action$ = new Subject<Action>()

  const promiseInjectors = { getState: getState as any }
  const observableInjectors = { action$, getState: getState as any }

  return (next: Dispatch<S>) =>
    (action: ActionSystem) => {
      if (action.__state === Lifecycle.INIT) {
        action$.next(next(action) as any)

        if (action.__pending)
          dispatch({
            ...action,
            __state: Lifecycle.Pending
          })

        if (typeof action.promise === 'function') {
          return action.promise(action.args, promiseInjectors).then(
            payload => {
              if (action.__fulfilled)
                dispatch({
                  ...action,
                  __state: Lifecycle.Fulfilled,
                  payload
                })

              if (action.__finally)
                dispatch({
                  ...action,
                  __state: Lifecycle.Finally
                })

              return payload
            },
            error => {
              if (action.__rejected)
                dispatch({
                  ...action,
                  __state: Lifecycle.Rejected,
                  payload: error,
                  error: true
                })

              if (action.__finally)
                dispatch({
                  ...action,
                  __state: Lifecycle.Finally
                })

              if (!action.__rejected)
                throw error

              return error
            })
        }

        if (typeof action.observable === 'function') {
          const obs = action.observable(action.args, observableInjectors)
            .mergeMap((x: Action) => {
              const payloads: any[] = []

              if (x && x.type) {
                dispatch(x)
              }
              else {
                payloads.push(x)
              }

              return payloads
            })
            .finally(() => {
              if (action.__finally)
                dispatch({
                  ...action,
                  __state: Lifecycle.Finally
                })
            })
            .subscribe(payload => {
              if (action.__fulfilled)
                dispatch({
                  ...action,
                  __state: Lifecycle.Fulfilled,
                  payload
                })
            }, error => {
              if (action.__rejected)
                dispatch({
                  ...action,
                  __state: Lifecycle.Rejected,
                  payload: error,
                  error: true
                })

              if (!action.__rejected) {
                // tslint:disable-next-line:no-console
                console.error(error)
              }
            })

          return obs
        }

        throw new Error()
      }

      const result = next(action) as any
      action$.next(result)
      return result
    }
}