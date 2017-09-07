import { Dispatch, Middleware, MiddlewareAPI } from 'redux'
import { ActionSystem, Lifecycle, Action } from './handler'
import { Subject } from 'rxjs'

export const handlerMiddleware: Middleware = <S>({ dispatch }: MiddlewareAPI<S>) => {
  const action$ = new Subject<Action>()

  return (next: Dispatch<S>) =>
    (action: ActionSystem) => {
      if (action.__state === Lifecycle.Init) {
        dispatch({
          ...action,
          __state: Lifecycle.Pending
        })

        if (typeof action.promise === 'function') {
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

              if (!action.__rejected)
                throw error

              return error
            })
        }

        if (typeof action.observable === 'function') {
          const obs = action.observable(action.args, action$)
            .mergeMap((x: Action) => {
              const payloads: any[] = []

              if (x.type) {
                dispatch(x)
              }
              else {
                payloads.push(x)
              }

              return payloads
            })
            .subscribe(payload => {
              dispatch({
                ...action,
                __state: Lifecycle.Fulfilled,
                payload
              })
              return payload
            }, error => {
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

              return error
            })

          action$.next(next(action) as any)

          return obs
        }

        throw new Error()
      }

      const result = next(action) as any
      action$.next(result)
      return result
    }
}