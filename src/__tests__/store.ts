import { createStore, applyMiddleware } from 'redux'
import { handlerMiddleware, combineHandlers } from '../'
import { RxStoreA, rxHandler } from './modules/rx-a'
import { RxStoreB, rxHandler2 } from './modules/rx-b'
import { SyncAStore, syncAHandler } from './modules/sync-a'
import { SyncBStore, syncBHandler } from './modules/sync-b'
import { PromiseStore, promiseHandler } from './modules/promise'

export interface RootStore {
  rxA: RxStoreA
  rxB: RxStoreB
  syncA: SyncAStore
  syncB: SyncBStore
  promise: PromiseStore
}

const reducer = combineHandlers<RootStore>({
  rxA: rxHandler,
  rxB: rxHandler2,
  syncA: syncAHandler,
  syncB: syncBHandler,
  promise: promiseHandler
})
  .buildReducer()

export const store = createStore(reducer, applyMiddleware(handlerMiddleware()))