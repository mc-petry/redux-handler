import { Action as ReduxAction, Reducer } from 'redux'
import { HOperator } from './api'

export const ARGS_SYM = Symbol('args')
export const META_SYM = Symbol('meta')

export interface Action extends ReduxAction<string> { }

export interface SyncAction<T = any> extends Action {
  args: T
}

interface AsyncActionMeta {
  operators: HOperator[]
  state: Lifecycle

  /**
   * Prevents unnecessary dispatch calls.
   */
  async: {
    pending: boolean
    fulfilled: boolean
    rejected: boolean
    completed: boolean
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
  Completed = 'completed'
}

export interface InternalHandler<TStore = any> {
  buildReducer(): Reducer<TStore>
}

export type ActionHandler<S = {}, A = any> = (state: Readonly<S>, action: A) => Pick<S, keyof S>