import { createStore, applyMiddleware } from 'redux'
import { handlerMiddleware, combineHandlers } from '../'
import { RxStoreA, rxHandler } from './modules/rx-a'
import { RxStoreB, rxHandler2 } from './modules/rx-b'
import { SyncAStore, syncAHandler } from './modules/sync-a'
import { SyncBStore, syncBHandler } from './modules/sync-b'
import { PromiseStore, promiseHandler } from './modules/promise'
import { ThunkStore, thunkHandler } from './modules/thunk'

export interface RootStore {
  rxA: RxStoreA
  rxB: RxStoreB
  syncA: SyncAStore
  syncB: SyncBStore
  promise: PromiseStore
  thunk: ThunkStore
}

const handlers = combineHandlers<RootStore>({
  rxA: rxHandler,
  rxB: rxHandler2,
  syncA: syncAHandler,
  syncB: syncBHandler,
  promise: promiseHandler,
  thunk: thunkHandler
})

export const store = createStore(handlers.buildReducer(), applyMiddleware(handlerMiddleware()))