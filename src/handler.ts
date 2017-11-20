// tslint:disable:unified-signatures

import { Action, Reducer, AnyAction } from 'redux'
import { Observable, Subscription } from 'rxjs'

declare module 'redux' {
  interface Dispatch<S> {
    // tslint:disable-next-line:callable-types
    <T, P extends PromiseLike<T>, A>(action: PromiseAction<T, A>): P
    <T, P extends Subscription, A>(action: ObservableAction<T, A>): P
  }
}

export interface Action {
  type: string
}

export interface SyncAction<T> extends Action {
  type: string
  payload: T
}

export interface ArgsAction<A> extends Action {
  args: A
}

export interface PromiseAction<T, A> {
  promise?: PromiseFn<T, A>
}

export interface ObservableAction<T, A> {
  observable?: ObservableFn<T, A>
}

export enum Lifecycle {
  INIT = 'init',
  Pending = 'pending',
  Fulfilled = 'fulfilled',
  Rejected = 'rejected',
  Finally = 'finally'
}

export interface ActionSystem extends ArgsAction<any> {
  promise?: PromiseFn
  observable?: ObservableFn
  __state: Lifecycle
  __pending: boolean
  __fulfilled: boolean
  __rejected: boolean
  __finally: boolean
}

export type ActionHandler<S, A> = (state: S, action: A) => S

export interface HandlerOptions {
  prefix?: string
}

export interface ActionType {
  type: string
}

const callHandlers = <TState>(handlers: (ActionHandler<TState, Action> | undefined)[], state: TState, action: Action) => {
  for (const handler of handlers)
    if (handler)
      state = handler(state, action)

  return state
}

export interface HandlerData {
  actionHandlers: { [id: string]: ActionHandler<any, any> }
}

export type PromiseFn<TRootState = {}, A = any, T = any> = (args: A, injects: { getState: () => TRootState }) => PromiseLike<T>
export type ObservableFn<TRootState = {}, A = any, T = any> = (args: A, injects: { action$: Observable<Action>, getState: () => TRootState }) => Observable<T>

type BaseHandlerChain = HandlerChain<any, any, any, any, any>

export interface HandlerChainObservable<TState, TRootState, TArgs, TAction extends Action> {
  call<TPayload>(observable$: ObservableFn<TRootState, TArgs, TPayload>): HandlerChainInterface<TState, TArgs, TPayload, TAction>
}

export interface HandlerChainPromise<TState, TRootState, TArgs, TAction extends Action> {
  call<TPayload>(fn: PromiseFn<TRootState, TArgs, TPayload>): HandlerChainInterface<TState, TArgs, TPayload, TAction>
}

/**
 * Chain can be handled in any handler.
 */
export interface HandlerChainInterface<TState, TArgs = any, TPayload = any, TAction extends Action = Action> {
  pending(handler: ActionHandler<TState, ArgsAction<TArgs>>): HandlerChainInterface<TState, TArgs, TPayload, TAction>
  fulfilled(handler: ActionHandler<TState, { payload: TPayload } & ArgsAction<TArgs>>): HandlerChainInterface<TState, TArgs, TPayload, TAction>
  rejected(handler: ActionHandler<TState, { payload: Error } & ArgsAction<TArgs>>): HandlerChainInterface<TState, TArgs, TPayload, TAction>
  finally(handler: ActionHandler<TState, ArgsAction<TArgs>>): HandlerChainInterface<TState, TArgs, TPayload, TAction>

  /**
   * Creates action.
   * Chain can continue to be used in other handlers.
   */
  build(): TAction & Action
}

enum HandlerType {
  Promise,
  Observable
}

const getRootChain = (parentChain: BaseHandlerChain): BaseHandlerChain =>
  parentChain.parentChain
    ? getRootChain(parentChain.parentChain)
    : parentChain

class HandlerChain<TState, TRootState, TArgs, TResult, TAction extends Action> implements HandlerChainInterface<TState, TArgs, TResult, TAction> {
  parentChain: BaseHandlerChain
  type: string

  private _isBuilt: boolean
  private _promiseFn: PromiseFn<TRootState, TArgs, any>
  private _observableFn: ObservableFn<TRootState, TArgs, any>

  private _pendingCount: number = 0
  private _fulfilledCount: number = 0
  private _rejectedCount: number = 0
  private _finallyCount: number = 0

  private _pending: ActionHandler<any, any>[] = []
  private _fulfilled: ActionHandler<any, any>[] = []
  private _rejected: ActionHandler<any, any>[] = []
  private _finally: ActionHandler<any, any>[] = []

  constructor(private _handler: HandlerData, typeOrChain: string | BaseHandlerChain, public hType?: HandlerType) {
    if (typeof typeOrChain === 'string') {
      this.type = typeOrChain
    }
    else {
      this.parentChain = typeOrChain
      this.type = typeOrChain.type
      this.hType = typeOrChain.hType
    }

    if (process.env.NODE_ENV !== 'production')
      if (this._handler.actionHandlers[this.type])
        throw new Error(`Action "${this.type}" with the same name already exists`)

    this._handler.actionHandlers[this.type] = (state, action: ActionSystem) => {
      switch (action.__state) {
        case Lifecycle.Pending:
          state = callHandlers(this._pending, state, action)
          break

        case Lifecycle.Fulfilled:
          state = callHandlers(this._fulfilled, state, action)
          break

        case Lifecycle.Rejected:
          state = callHandlers(this._rejected, state, action)
          break

        case Lifecycle.Finally:
          state = callHandlers(this._finally, state, action)
      }

      return state
    }
  }

  call<P>(observableOrPromise: PromiseFn<TRootState, TArgs, P> | ObservableFn<TRootState, TArgs, P>): HandlerChainInterface<TState, TArgs, P, TAction> {
    if (this.hType === HandlerType.Observable) {
      this._observableFn = observableOrPromise as ObservableFn<TRootState>
    }
    else if (this.hType === HandlerType.Promise) {
      this._promiseFn = observableOrPromise as PromiseFn<TRootState, TArgs, P>
    }

    return this as any
  }

  pending(handler: ActionHandler<TState, ArgsAction<TArgs>>): HandlerChainInterface<TState, TArgs, TResult, TAction> {
    this._pending.push(handler)
    this.getBaseChain()._pendingCount++
    return this
  }

  fulfilled(handler: ActionHandler<TState, { payload: TResult } & ArgsAction<TArgs>>): HandlerChainInterface<TState, TArgs, TResult, TAction> {
    this._fulfilled.push(handler)
    this.getBaseChain()._fulfilledCount++
    return this
  }

  rejected(handler: ActionHandler<TState, { payload: Error } & ArgsAction<TArgs>>): HandlerChainInterface<TState, TArgs, TResult, TAction> {
    this._rejected.push(handler)
    this.getBaseChain()._rejectedCount++
    return this
  }

  finally(handler: ActionHandler<TState, ArgsAction<TArgs>>): HandlerChainInterface<TState, TArgs, TResult, TAction> {
    this._finally.push(handler)
    this.getBaseChain()._finallyCount++
    return this
  }

  build(): TAction & ActionType {
    if (process.env.NODE_ENV !== 'production')
      if (this._isBuilt)
        throw new Error(`Chain already built. Check type "${this.type}"`)

    this._isBuilt = true

    // tslint:disable-next-line:no-object-literal-type-assertion
    const action = (args?: any) => {
      const a: ActionSystem = {
        type: this.type,
        args,
        __state: Lifecycle.INIT,
        __pending: this._pendingCount > 0,
        __fulfilled: this._fulfilledCount > 0,
        __rejected: this._rejectedCount > 0,
        __finally: this._finallyCount > 0
      }

      if (this._promiseFn)
        a.promise = this._promiseFn
      else if (this._observableFn)
        a.observable = this._observableFn

      return a
    }

    (action as any as ActionType).type = this.type

    return action as any
  }

  private getBaseChain = () =>
    this.parentChain
      ? getRootChain(this.parentChain)
      : this
}

// tslint:disable-next-line:max-classes-per-file
export class Handler<TState, TRootState = {}> {
  private readonly _initialState: TState
  private readonly _options: HandlerOptions

  private readonly _data: HandlerData = {
    actionHandlers: {}
  }

  constructor(initialState: TState, options: HandlerOptions = {}) {
    this._initialState = initialState
    this._options = options
  }

  /**
   * Handle action or chain
   */
  handle<A extends AnyAction>(type: string, handler: ActionHandler<TState, A>): void
  handle(fn: (() => Action) & ActionType, handler: ActionHandler<TState, Action>): void
  handle<T>(fn: ((args: any) => SyncAction<T>) & ActionType, handler: ActionHandler<TState, SyncAction<T>>): void
  handle<TRefState, TArgs, TMeta, TResult, TAction extends Action>(chain: HandlerChainInterface<TRefState, TArgs, TResult, TAction>): HandlerChainInterface<TState, TArgs, TResult, TAction>
  handle(typeOrChain: string | HandlerChainInterface<TState> | ActionType, handler?: ActionHandler<TState, any>) {
    if (typeof typeOrChain === 'string') {
      this._data.actionHandlers[typeOrChain] = handler!
      return
    }
    else if (typeof (typeOrChain as HandlerChainInterface<TState>).fulfilled === 'function') {
      const chain = typeOrChain as BaseHandlerChain
      return new HandlerChain<TState, TRootState, any, any, any>(this._data, chain) as HandlerChainInterface<any, any, any, any>
    }
    else {
      this._data.actionHandlers[(typeOrChain as ActionType).type] = handler!
      return
    }
  }

  action(type: string, handler: ActionHandler<TState, Action>): (() => Action) & ActionType
  action<A>(type: string, handler: ActionHandler<TState, SyncAction<A>>): ((args: A) => SyncAction<A>) & ActionType
  action(type: string, handler: ActionHandler<TState, any>) {
    const realType = this.getActionType(type)
    const action = (payload?: any) => ({ type: realType, payload })
    const modifiedAction: typeof action & ActionType = action as any

    this._data.actionHandlers[realType] = handler
    modifiedAction.type = realType

    return modifiedAction
  }

  promise(type: string): HandlerChainPromise<TState, TRootState, never, (() => PromiseAction<any, {}> & Action) & ActionType>
  promise<A extends {}>(type: string): HandlerChainPromise<TState, TRootState, A, ((args: A) => PromiseAction<any, A> & ArgsAction<A>) & ActionType>
  promise(type: string): HandlerChainPromise<TState, TRootState, any, any> {
    return new HandlerChain(this._data, this.getActionType(type), HandlerType.Promise)
  }

  /**
   * Handles items from observable stream except actions.
   * `{ type: string }` items will be skipped.
   */
  observable(type: string): HandlerChainObservable<TState, TRootState, any, (() => ObservableAction<any, {}>) & ActionType>
  observable<A extends {}>(type: string): HandlerChainObservable<TState, TRootState, A, ((args: A) => ObservableAction<any, A>) & ActionType>
  observable(type: string): HandlerChainObservable<TState, TRootState, any, any> {
    return new HandlerChain(this._data, this.getActionType(type), HandlerType.Observable)
  }

  buildReducer(): Reducer<TState> {
    return (state = this._initialState, action: Action) =>
      this._data.actionHandlers[action.type]
        ? this._data.actionHandlers[action.type](state, action)
        : state
  }

  private getActionType(type: string) {
    if (this._options.prefix)
      type = `${this._options.prefix}/${type}`

    return type
  }
}