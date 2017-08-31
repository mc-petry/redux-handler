// tslint:disable:unified-signatures

import { Action, Reducer, AnyAction } from 'redux'
import { Observable } from 'rxjs'

declare module 'redux' {
  interface Dispatch<S> {
    // tslint:disable-next-line:callable-types
    <T, P extends PromiseLike<T>, A>(action: PromiseAction<T, A>): P
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
  promise?: (args?: A) => PromiseLike<T>
}

export enum Lifecycle {
  Pending,
  Fulfilled,
  Rejected
}

export interface ActionSystem extends ArgsAction<any> {
  promise?: PromiseFn
  __state: Lifecycle
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
  epics: ((action$: Observable<any>) => any)[]
  actionHandlers: { [id: string]: ActionHandler<any, any> }
}

export type PromiseFn<A = any, T = any> = (args: A) => PromiseLike<T>
export type ObservableFn<A = any, T = any> = (action$: Observable<A>) => Observable<T>

export interface HandlerChainObservable<TState, TArgs, TAction> {
  call<TPayload>(observable$: ObservableFn<TArgs, TPayload>): HandlerChainInterface<TState, TArgs, TPayload, TAction>
}

export interface HandlerChainPromise<TState, TArgs, TAction> {
  call<TPayload>(fn: PromiseFn<TArgs, TPayload>): HandlerChainInterface<TState, TArgs, TPayload, TAction>
}

export interface HandlerChainInterface<TState, TArgs = any, TPayload = any, TAction = Action> {
  pending(handler: ActionHandler<TState, ArgsAction<TArgs>>): HandlerChainInterface<TState, TArgs, TPayload, TAction>
  fulfilled(handler: ActionHandler<TState, { payload: TPayload } & ArgsAction<TArgs>>): HandlerChainInterface<TState, TArgs, TPayload, TAction>
  rejected(handler: ActionHandler<TState, { payload: Error } & ArgsAction<TArgs>>): HandlerChainInterface<TState, TArgs, TPayload, TAction>
  finally(handler: ActionHandler<TState, ArgsAction<TArgs>>): HandlerChainInterface<TState, TArgs, TPayload, TAction>
  build(): TAction & Action & ActionType
}

enum HandlerType {
  Promise,
  Observable
}

class HandlerChain<TState, TArgs, TResult, TAction> implements HandlerChainInterface<TState, TArgs, TResult, TAction> {
  private _isBuilt: boolean
  private _promiseAction: PromiseFn<TArgs, any>
  private _pending: ActionHandler<any, any>[] = []
  private _fulfilled: ActionHandler<any, any>[] = []
  private _rejected: ActionHandler<any, any>[] = []

  constructor(private _handler: HandlerData, public type: string, public hType: HandlerType) {
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
      }

      return state
    }
  }

  call<P>(observableOrPromise: PromiseFn<TArgs, P> | ObservableFn<TArgs, P>): HandlerChainInterface<TState, TArgs, P, TAction> {

    if (this.hType === HandlerType.Observable) {
      let args: TArgs
      const observablePending = (action$: Observable<ActionSystem>) =>
        (observableOrPromise as ObservableFn<TArgs, P>)(
          action$.filter(action => action.type === this.type && action.__state === Lifecycle.Pending)
            .map(x => {
              args = x.args
              return x.args
            })
        )
          .map(payload => ({ type: this.type, __state: Lifecycle.Fulfilled, payload, args }))
          .catch(error => Observable.of({ type: this.type, ___state: Lifecycle.Rejected, payload: error, error: true }))

      this._handler.epics.push(observablePending)
    }
    else if (this.hType === HandlerType.Promise) {
      this._promiseAction = observableOrPromise as PromiseFn<TArgs, P>
    }

    return this as any
  }

  pending(handler: ActionHandler<TState, ArgsAction<TArgs>>): HandlerChainInterface<TState, TArgs, TResult, TAction> {
    this._pending.push(handler)
    return this
  }

  fulfilled(handler: ActionHandler<TState, { payload: TResult } & ArgsAction<TArgs>>): HandlerChainInterface<TState, TArgs, TResult, TAction> {
    this._fulfilled.push(handler)
    return this
  }

  rejected(handler: ActionHandler<TState, { payload: Error } & ArgsAction<TArgs>>): HandlerChainInterface<TState, TArgs, TResult, TAction> {
    this._rejected.push(handler)
    return this
  }

  finally(handler: ActionHandler<TState, ArgsAction<TArgs>>): HandlerChainInterface<TState, TArgs, TResult, TAction> {
    this._fulfilled.push(handler)
    this._rejected.push(handler)
    return this
  }

  build(): TAction & ActionType {
    if (process.env.NODE_ENV !== 'production')
      if (this._isBuilt)
        throw new Error(`Chain already built. Check type "${this.type}"`)

    this._isBuilt = true

    // tslint:disable-next-line:no-object-literal-type-assertion
    const action = (args?: any) => ({
      type: this.type,
      args,
      promise: this._promiseAction,
      __state: Lifecycle.Pending
    } as ActionSystem);

    (action as any as ActionType).type = this.type

    return action as any
  }
}

// tslint:disable-next-line:max-classes-per-file
export class Handler<TState> {
  private readonly _initialState: TState
  private readonly _options: HandlerOptions

  private readonly _data: HandlerData = {
    actionHandlers: {},
    epics: []
  }

  constructor(initialState: TState, options: HandlerOptions = {}) {
    this._initialState = initialState
    this._options = options
  }

  /**
   * Handle action with custom action / type
   *
   * @param action Full type
   */
  handle<A extends AnyAction>(type: string, handler: ActionHandler<TState, A>): void
  handle(fn: (() => Action) & ActionType, handler: ActionHandler<TState, Action>): void
  handle<T>(fn: ((args: any) => SyncAction<T>) & ActionType, handler: ActionHandler<TState, SyncAction<T>>): void
  handle<TRefState, TArgs, TMeta, TResult, TAction>(chain: HandlerChainInterface<TRefState, TArgs, TResult, TAction>): HandlerChainInterface<TState, TArgs, TResult, TAction>
  handle(typeOrChain: string | HandlerChainInterface<TState> | ActionType, handler?: ActionHandler<TState, any>) {
    if (typeof typeOrChain === 'string') {
      this._data.actionHandlers[typeOrChain] = handler!
      return
    }
    else if (typeof (typeOrChain as HandlerChainInterface<TState>).fulfilled === 'function') {
      const chain = typeOrChain as HandlerChain<any, any, any, any>
      return new HandlerChain<any, any, any, any>(this._data, chain.type, chain.hType) as HandlerChainInterface<any, any, any, any>
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

  promise(type: string): HandlerChainPromise<TState, never, () => PromiseAction<any, {}> & Action & ActionType>
  promise<A>(type: string): HandlerChainPromise<TState, A, (args: A) => PromiseAction<any, A> & ArgsAction<A> & ActionType>
  promise(type: string): HandlerChainPromise<TState, any, any> {
    return new HandlerChain(this._data, this.getActionType(type), HandlerType.Promise)
  }

  observable(type: string): HandlerChainObservable<TState, any, () => Action & ActionType>
  observable<A>(type: string): HandlerChainObservable<TState, A, (args: A) => ArgsAction<A> & ActionType>
  observable(type: string): HandlerChainObservable<TState, any, any> {
    return new HandlerChain(this._data, this.getActionType(type), HandlerType.Observable)
  }

  buildReducer(): Reducer<TState> {
    return (state = this._initialState, action: Action) =>
      this._data.actionHandlers[action.type]
        ? this._data.actionHandlers[action.type](state, action)
        : state
  }

  buildEpic() {
    return (...args: [any, any][]) => Observable.merge(...this._data.epics.map((epic: any) => epic(...args)))
  }

  private getActionType(type: string) {
    if (this._options.prefix)
      type = `${this._options.prefix}/${type}`

    return type
  }
}