import { createStore, applyMiddleware } from 'redux'
import { handlerMiddleware, combineHandlers } from '../'
import { RxStoreA, rxHandler } from './modules/rx'
import { RxStoreB, rxHandler2 } from './modules/rx2'
import { SyncStore, syncHandler } from './modules/sync'

export interface RootStore {
  rxA: RxStoreA
  rxB: RxStoreB
  sync: SyncStore
}

const reducer = combineHandlers<RootStore>({
  rxA: rxHandler,
  rxB: rxHandler2,
  sync: syncHandler
})
  .buildReducer()

export const store = createStore(reducer, applyMiddleware(handlerMiddleware()))