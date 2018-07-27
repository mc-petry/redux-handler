import { createStore, combineReducers, applyMiddleware, Reducer } from 'redux'
import { handlerMiddleware, combineHandlers } from '../'
import { RxStoreA, rxHandler } from './modules/rx'
import { RxStoreB, rxHandler2 } from './modules/rx2'

export interface RootStore {
  rxA: RxStoreA
  rxB: RxStoreB
}

const reducer = combineHandlers<RootStore>({
  rxA: rxHandler,
  rxB: rxHandler2
})
  .buildReducer()

export const store = createStore(reducer, applyMiddleware(handlerMiddleware()))