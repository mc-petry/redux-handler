import { createStore, combineReducers, applyMiddleware, Reducer } from 'redux'
import { handlerMiddleware } from '../'
import { LibraryStore, lib } from './modules/library'
import { Lib2Store, lib2 } from './modules/library2'

export interface Store {
  lib: LibraryStore
  lib2: Lib2Store
}

const reducers: {[P in keyof Store]: Reducer<Store[P]> } = {
  lib,
  lib2
}

export const store = createStore(combineReducers<Store>(reducers), applyMiddleware(handlerMiddleware()))