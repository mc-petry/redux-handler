import { createStore, combineReducers, applyMiddleware, Reducer } from 'redux'
import { handlerMiddleware } from '../'
import { ILibraryStore, library } from './modules/library'

export interface IStore {
  library: ILibraryStore
}

const reducers: {[P in keyof IStore]: Reducer<IStore[P]> } = {
  library
}

export const store = createStore(combineReducers<IStore>(reducers), applyMiddleware(handlerMiddleware))