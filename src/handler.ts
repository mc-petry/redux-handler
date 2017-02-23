import { Action, Reducer } from 'redux'

declare module 'redux' {
  export interface Dispatch<S> {
    <T, P extends PromiseLike<T>, M>(action: IAsyncAction<T, M>): P
  }
}

export interface IAction {
  type: string
}

export interface ISyncAction<T> extends IAction {
  type: string
  payload: T
}

export interface IAsyncAction<T, M> extends IAction {
  args?: any
  promise?: (args?: any) => PromiseLike<T>
  meta?: M
}

export enum Lifecycle {
  Pending,
  Fulfilled,
  Rejected
}

export interface IAsyncActionLifecycle<T, M, TStore> extends IAsyncAction<T, M> {
  __state: Lifecycle
  __shouldCall?: (state: TStore) => boolean
}

export type ActionHandler<S, A> = (state: S, action: A) => S

export interface IMetaAction<M> extends IAction {
  meta?: M
}

export interface IOptions<TStore, S, R, M> {
  pending?: ActionHandler<S, { promise: PromiseLike<R> } & IMetaAction<M>>
  then?: ActionHandler<S, { payload: R } & IMetaAction<M>>
  catch?: ActionHandler<S, { payload: Error } & IMetaAction<M>>
  finally?: ActionHandler<S, { payload: R | Error } & IMetaAction<M>>

  meta?: M
  shouldCall?: (state: TStore) => boolean
}

export interface IHandlerOptions {
  prefix?: string
}

export class Handler<TStore, TState> {
  private readonly _initialState: TState
  private readonly _actionHandlers: { [id: string]: ActionHandler<TState, any> } = {}
  private readonly _options: IHandlerOptions

  constructor(initialState: TState, options: IHandlerOptions = {}) {
    this._initialState = initialState
    this._options = options
  }

  sync(type: string, handler: ActionHandler<TState, IAction>): () => IAction
  sync<T>(type: string, handler: ActionHandler<TState, ISyncAction<T>>): (args: T) => ISyncAction<T>
  sync(type: string, handler: ActionHandler<TState, any>) {
    this._actionHandlers[this.getActionType(type)] = handler
    return (payload?: any) => ({ type, payload })
  }

  async<T, P extends PromiseLike<T>, M>(type: string, promise: () => P & PromiseLike<T>, options: IOptions<TStore, TState, T, M>): () => IAsyncAction<T, M>
  async<T, P extends PromiseLike<T>, M, A>(type: string, promise: (args: A) => P & PromiseLike<T>, options: IOptions<TStore, TState, T, M>): (args: A) => IAsyncAction<T, M>
  async<T, M>(type: string, promise: (args?: any) => PromiseLike<T>, options: IOptions<TStore, TState, T, M>) {
    this._actionHandlers[this.getActionType(type)] = (state, action: IAsyncActionLifecycle<T, M, TStore>) => {
      switch (action.__state) {
        case Lifecycle.Pending:
          state = this.callHandlers([options.pending], state, action)
          break

        case Lifecycle.Fulfilled:
          delete action.promise
          state = this.callHandlers([options.then, options.finally], state, action)
          break

        case Lifecycle.Rejected:
          delete action.promise
          state = this.callHandlers([options.catch, options.finally], state, action)
          break
      }

      return state
    }
    return (args?: any): IAsyncActionLifecycle<T, M, TStore> => ({
      type,
      promise,
      args,
      meta: options.meta,
      __state: Lifecycle.Pending,
      __shouldCall: options.shouldCall
    })
  }

  toReducer(): Reducer<TState> {
    return (state = this._initialState, action: Action) =>
      this._actionHandlers[this.getActionType(action.type)]
        ? this._actionHandlers[this.getActionType(action.type)](state, action)
        : state
  }

  private callHandlers<TState>(handlers: (ActionHandler<TState, Action> | undefined)[], state: TState, action: Action) {
    for (const handler of handlers)
      if (handler)
        state = handler(state, action)

    return state
  }

  private getActionType(type: string) {
    if (this._options.prefix)
      type = `${this._options.prefix}/${type}`

    return type
  }
}