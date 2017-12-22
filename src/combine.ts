import { Reducer, ReducersMapObject, combineReducers } from 'redux'
import { Handler } from './handler'

export interface Handlers<S> {
  children: {
    [P in keyof S]: Handler<S[P]> | Handlers<S[P]>
  }
  buildReducer(): Reducer<S>
}

export const combineHandlers: <S>(handlers: {[P in keyof S]: Handler<S[P]> | Handlers<S[P]>}) => Handlers<S> =
  (handlers) => ({
    children: handlers,
    buildReducer: () => {
      const reducers: ReducersMapObject = {}

      for (const handler in handlers) {
        const h = handlers[handler]

        reducers[handler] = typeof (h as Handler<any>).buildReducer === 'function'
          ? (h as Handler<any>).buildReducer()
          : (h as Handlers<any>).buildReducer()
      }

      return combineReducers(reducers)
    }
  })