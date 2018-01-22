import { Reducer, combineReducers } from 'redux'
import { Handler } from './handler'

export interface Handlers<S> {
  children: {
    [P in keyof S]: Handler<S[P]> | Handlers<S[P]>
  }
  buildReducer<RS>(other?: {[P in keyof RS]: Reducer<RS>}): Reducer<S & RS>
}

export const combineHandlers: <S>(handlers: {[P in keyof S]: Handler<S[P]> | Handlers<S[P]>}) => Handlers<S> =
  (handlers) => ({
    children: handlers,
    buildReducer: <RS>(other?: {[P in keyof RS]: Reducer<RS> }) => {
      const reducers: { [key: string]: Reducer<any> } = other || {}

      for (const handler in handlers) {
        const h = handlers[handler]

        reducers[handler] = typeof (h as Handler<any>).buildReducer === 'function'
          ? (h as Handler<any>).buildReducer()
          : (h as Handlers<any>).buildReducer()
      }

      return combineReducers(reducers) as any
    }
  })

interface TestStore {
  store: { test?: string }
}

combineHandlers<TestStore>({
  store: new Handler<{ test?: string }>({})
})
  .buildReducer({

  })