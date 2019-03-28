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
  state?: Lifecycle

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

export interface InternalAction<T = {}> extends Action {
  [ARGS_SYM]: any
  [META_SYM]: AsyncActionMeta & T
}

export const enum Lifecycle {
  INIT = 'init',
  Pending = 'pending',
  Fulfilled = 'fulfilled',
  Rejected = 'rejected',
  Completed = 'completed'
}

export interface InternalHandler<TStore = any> {
  readonly actionHandlers: { [id: string]: ActionHandler<TStore, Action> }
  buildReducer(): Reducer<TStore>
}

export type ActionHandler<S = {}, A = any> = (state: Readonly<S>, action: A) => S

interface Factory {
  /**
   * Gets the action type
   */
  TYPE: string
}

// TResult required to have intellisense in .on(...) method
type ActionCreatorWithoutArgs<TAction, TResult> = (() => TAction) & Factory
type ActionCreatorWithArgs<TAction, TArgs, TResult> = ((args: TArgs) => TAction) & Factory

/**
 * We needs explicit Action Creator types to infer TArgs & TPayload
 * Also we split sync and async action creators to have full intellisence
 */
// Use tuple type because of https://github.com/Microsoft/TypeScript/issues/25960
export type ActionCreator<TArgs, TAction extends Action = Action, TResult = {}> = [TArgs] extends [undefined]
  ? ActionCreatorWithoutArgs<TAction, TResult>
  : ActionCreatorWithArgs<TAction, TArgs, TResult>