import { Action as ReduxAction, Reducer } from 'redux'
import { AsyncOperator } from './api'

export const ARGS_SYM = Symbol('args')
export const META_SYM = Symbol('meta')

export interface Action extends ReduxAction<string> { }

export interface ArgsAction extends Action {
  args: any
}

interface AsyncActionMeta {
  operators: AsyncOperator[]
  state: Lifecycle

  /**
   * Prevents unnecessary dispatch calls
   */
  async: {
    pending: boolean
    fulfilled: boolean
    rejected: boolean
    finally: boolean
  }
}

export interface InternalAction extends Action {
  [ARGS_SYM]: any
  [META_SYM]: AsyncActionMeta
}

export const enum Lifecycle {
  INIT = 'init',
  Pending = 'pending',
  Fulfilled = 'fulfilled',
  Rejected = 'rejected',
  Finally = 'finally'
}

export interface InternalHandler<TStore = any> {
  buildReducer(): Reducer<TStore>
}

export type ActionHandler<S = {}, A = any> = (state: Readonly<S>, action: A) => Pick<S, keyof S>