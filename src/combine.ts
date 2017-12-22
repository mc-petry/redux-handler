import { Reducer, ReducersMapObject, combineReducers } from 'redux'
import { Handler } from './handler'

export const combineHandlers: <S>(handlers: {[P in keyof S]: Handler<S[P]>}) => Reducer<S> =
  (handlers) => {
    const reducers: ReducersMapObject = {}

    for (const handler in handlers) {
      reducers[handler] = handlers[handler].buildReducer()
    }

    return combineReducers(reducers)
  }