import { Lifecycle, ActionHandler, Action, InternalAction, InternalHandler, META_SYM, ARGS_SYM, ActionCreator } from './types'
import { HOperator, HOperatorOnInitEvent, HOperatorOnActionCreatingEvent } from './api'
import { Reducer } from 'redux'
import { HandlerChain } from './internal/handler-chain'
import { prefixGenerator, actionTypeGenerator } from './internal/generators'

const callHandlers = <TState>(handlers: ActionHandler<TState, Action>[], state: TState, action: Action) => {
  for (const h of handlers)
    state = h(state, action)

  return state
}

export interface HandlerClass<S, RS> {
  /**
   * Handles an existing action creator.
   */
  on<T, A, TA extends Action>(fn: ActionCreator<A, TA, T>, ...ops: HOperator<RS, S, A, T, T>[]): void

  /**
   * Creates a new action creator.
   */
  action<TArgs = undefined>(name?: string): {
    /**
     * Creates an action without any handlers.
     */
    empty(): ActionCreator<TArgs>

    /*
     Generate `pipe` aliases:

    for (let i = 1; i < 11; i++) {
      let t: string[] = []
      let a: string[] = []
      let ops: string[] = []

      for (let j = 0; j < i + 1; j++) {
        const n = j + 1
        t.push(`T${n}`)
        a.push(`A${n}`)

        if (j !== i) {
          ops.push(`op${n}: AsyncOperator<RS, S, TArgs, T${n}, T${n + 1}, A${n}, A${n + 1}>`)
        }
      }

      console.log(`pipe<${t.join(', ')}, ${a.join(', ')} extends Action>(${ops.join(', ')}): ActionCreator<TArgs, A${i + 1}, T${i + 1}>`)
    }

    */

    /**
     * Handles the async action.
     */
    pipe<T1, T2, A1, A2 extends Action>(op1: HOperator<RS, S, TArgs, T1, T2, A1, A2>): ActionCreator<TArgs, A2, T2>
    pipe<T1, T2, T3, A1, A2, A3 extends Action>(op1: HOperator<RS, S, TArgs, T1, T2, A1, A2>, op2: HOperator<RS, S, TArgs, T2, T3, A2, A3>): ActionCreator<TArgs, A3, T3>
    pipe<T1, T2, T3, T4, A1, A2, A3, A4 extends Action>(op1: HOperator<RS, S, TArgs, T1, T2, A1, A2>, op2: HOperator<RS, S, TArgs, T2, T3, A2, A3>, op3: HOperator<RS, S, TArgs, T3, T4, A3, A4>): ActionCreator<TArgs, A4, T4>
    pipe<T1, T2, T3, T4, T5, A1, A2, A3, A4, A5 extends Action>(op1: HOperator<RS, S, TArgs, T1, T2, A1, A2>, op2: HOperator<RS, S, TArgs, T2, T3, A2, A3>, op3: HOperator<RS, S, TArgs, T3, T4, A3, A4>, op4: HOperator<RS, S, TArgs, T4, T5, A4, A5>): ActionCreator<TArgs, A5, T5>
    pipe<T1, T2, T3, T4, T5, T6, A1, A2, A3, A4, A5, A6 extends Action>(op1: HOperator<RS, S, TArgs, T1, T2, A1, A2>, op2: HOperator<RS, S, TArgs, T2, T3, A2, A3>, op3: HOperator<RS, S, TArgs, T3, T4, A3, A4>, op4: HOperator<RS, S, TArgs, T4, T5, A4, A5>, op5: HOperator<RS, S, TArgs, T5, T6, A5, A6>): ActionCreator<TArgs, A6, T6>
    pipe<T1, T2, T3, T4, T5, T6, T7, A1, A2, A3, A4, A5, A6, A7 extends Action>(op1: HOperator<RS, S, TArgs, T1, T2, A1, A2>, op2: HOperator<RS, S, TArgs, T2, T3, A2, A3>, op3: HOperator<RS, S, TArgs, T3, T4, A3, A4>, op4: HOperator<RS, S, TArgs, T4, T5, A4, A5>, op5: HOperator<RS, S, TArgs, T5, T6, A5, A6>, op6: HOperator<RS, S, TArgs, T6, T7, A6, A7>): ActionCreator<TArgs, A7, T7>
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, A1, A2, A3, A4, A5, A6, A7, A8 extends Action>(op1: HOperator<RS, S, TArgs, T1, T2, A1, A2>, op2: HOperator<RS, S, TArgs, T2, T3, A2, A3>, op3: HOperator<RS, S, TArgs, T3, T4, A3, A4>, op4: HOperator<RS, S, TArgs, T4, T5, A4, A5>, op5: HOperator<RS, S, TArgs, T5, T6, A5, A6>, op6: HOperator<RS, S, TArgs, T6, T7, A6, A7>, op7: HOperator<RS, S, TArgs, T7, T8, A7, A8>): ActionCreator<TArgs, A8, T8>
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, A1, A2, A3, A4, A5, A6, A7, A8, A9 extends Action>(op1: HOperator<RS, S, TArgs, T1, T2, A1, A2>, op2: HOperator<RS, S, TArgs, T2, T3, A2, A3>, op3: HOperator<RS, S, TArgs, T3, T4, A3, A4>, op4: HOperator<RS, S, TArgs, T4, T5, A4, A5>, op5: HOperator<RS, S, TArgs, T5, T6, A5, A6>, op6: HOperator<RS, S, TArgs, T6, T7, A6, A7>, op7: HOperator<RS, S, TArgs, T7, T8, A7, A8>, op8: HOperator<RS, S, TArgs, T8, T9, A8, A9>): ActionCreator<TArgs, A9, T9>
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10 extends Action>(op1: HOperator<RS, S, TArgs, T1, T2, A1, A2>, op2: HOperator<RS, S, TArgs, T2, T3, A2, A3>, op3: HOperator<RS, S, TArgs, T3, T4, A3, A4>, op4: HOperator<RS, S, TArgs, T4, T5, A4, A5>, op5: HOperator<RS, S, TArgs, T5, T6, A5, A6>, op6: HOperator<RS, S, TArgs, T6, T7, A6, A7>, op7: HOperator<RS, S, TArgs, T7, T8, A7, A8>, op8: HOperator<RS, S, TArgs, T8, T9, A8, A9>, op9: HOperator<RS, S, TArgs, T9, T10, A9, A10>): ActionCreator<TArgs, A10, T10>
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11 extends Action>(op1: HOperator<RS, S, TArgs, T1, T2, A1, A2>, op2: HOperator<RS, S, TArgs, T2, T3, A2, A3>, op3: HOperator<RS, S, TArgs, T3, T4, A3, A4>, op4: HOperator<RS, S, TArgs, T4, T5, A4, A5>, op5: HOperator<RS, S, TArgs, T5, T6, A5, A6>, op6: HOperator<RS, S, TArgs, T6, T7, A6, A7>, op7: HOperator<RS, S, TArgs, T7, T8, A7, A8>, op8: HOperator<RS, S, TArgs, T8, T9, A8, A9>, op9: HOperator<RS, S, TArgs, T9, T10, A9, A10>, op10: HOperator<RS, S, TArgs, T10, T11, A10, A11>): ActionCreator<TArgs, A11, T11>
  }
}

interface HandlerOptions {
  prefix?: string | string[]
}

class Handler<TStore, TRootStore> implements HandlerClass<TStore, TRootStore>, InternalHandler<TStore> {
  private get nextActionType() {
    if (!this._typeGenerator)
      this._typeGenerator = actionTypeGenerator(this._prefix)

    return this._typeGenerator.next().value
  }

  private static readonly prefixIterator = prefixGenerator()

  readonly actionHandlers: { [id: string]: ActionHandler<TStore, Action> } = {}

  private readonly _initialState: TStore
  private readonly _prefix: string
  private _typeGenerator: IterableIterator<string> | undefined

  constructor(initialState: TStore, options: HandlerOptions) {
    this._initialState = initialState

    const prefix = options.prefix

    this._prefix = prefix
      ? `${typeof prefix === 'string' ? prefix : prefix.join('/')}`
      : Handler.prefixIterator.next().value
  }

  on<A>(fn: ActionCreator<A>, ...operators: HOperator[]) {
    this.checkType(fn.TYPE)

    for (const op of operators)
      if (op.hooks.customAction) {
        op.hooks.customAction({ handler: this, type: fn.TYPE, operators })
        return
      }

    const chain = new HandlerChain<TStore>()

    const initEventArgs: HOperatorOnInitEvent<TStore> = {
      chain,
      handler: this
    }

    for (const op of operators)
      if (op.hooks.init)
        op.hooks.init(initEventArgs)

    this.setAsyncHandlers(chain, fn.TYPE)
  }

  action<A = undefined>(name?: string): {
    empty(): ActionCreator<A>
    pipe<T>(...operators: HOperator<TRootStore, TStore, A, T>[]): ActionCreator<A>
  } {
    const type = name != null
      ? `${this._prefix}/${name}`
      : this.nextActionType

    this.checkType(type)

    return {
      empty: () => this.empty(type),
      pipe: (fn, ...ops) => this.pipe(type, fn, ...ops)
    }
  }

  buildReducer(): Reducer<TStore> {
    return (state = this._initialState, action: Action) =>
      this.actionHandlers[action.type]
        ? this.actionHandlers[action.type](state, action)
        : state
  }

  private empty<A>(type: string) {
    const factory = (() => ({ type })) as ActionCreator<A>

    factory.TYPE = type

    return factory
  }

  private pipe<A, T>(type: string, ...operators: HOperator<TRootStore, TStore, A, T>[]) {
    for (const op of operators)
      if (op.hooks.customAction) {
        return op.hooks.customAction({ handler: this, type, operators })
      }

    const chain = new HandlerChain<TStore>()

    // #region On init

    const initEventArgs: HOperatorOnInitEvent<TStore> = {
      chain,
      handler: this
    }

    for (const op of operators)
      if (op.hooks.init)
        op.hooks.init(initEventArgs)

    // #endregion

    this.setAsyncHandlers(chain, type)

    // #region On action creating

    const actionCreatorEventArgs: HOperatorOnActionCreatingEvent<TStore> = {
      chain,
      handler: this,
      action: {
        type,
        [ARGS_SYM]: null,
        [META_SYM]: {
          operators,
          state: Lifecycle.INIT,
          async: {
            pending: chain.asyncActionHandlers[Lifecycle.Pending].length > 0,
            fulfilled: chain.asyncActionHandlers[Lifecycle.Fulfilled].length > 0,
            rejected: chain.asyncActionHandlers[Lifecycle.Rejected].length > 0,
            completed: chain.asyncActionHandlers[Lifecycle.Completed].length > 0,
          }
        }
      }
    }

    const factory = ((args?: A) => {
      let internalAction: InternalAction | undefined

      for (const op of operators)
        if (op.hooks.modifyAction) {
          const res = op.hooks.modifyAction(actionCreatorEventArgs)

          if (res) {
            if (process.env.NODE_ENV !== 'production') {
              if (internalAction)
                throw new TypeError('`ModifyActionHook` returns action multiple times. Perhaps you add a few main operators. Check your pipe.')
            }

            internalAction = res as typeof internalAction
          }
        }

      if (process.env.NODE_ENV !== 'production') {
        if (!internalAction) {
          throw new TypeError('`ModifyActionHook` never returned an action. Perhaps you forgot to add the main operator. Check your pipe.')
        }
      }


      internalAction![ARGS_SYM] = args
      return internalAction
    }) as ActionCreator<A, InternalAction>

    // #endregion

    factory.TYPE = type

    return factory
  }

  private setAsyncHandlers(chain: HandlerChain<TStore>, type: string) {
    this.actionHandlers[type] = (
      (state, action: InternalAction) => {
        const hr = chain.asyncActionHandlers[action[META_SYM].state!]

        return hr
          ? callHandlers(hr, state, action)
          : state
      }
    ) as ActionHandler<TStore, Action>
  }

  private checkType(type: string) {
    if (process.env.NODE_ENV !== 'production') {
      if (this.actionHandlers[type])
        throw new TypeError(`Handler on action '${type}' registered multiple times in single reducer. Check your action name.`)
    }
  }
}

export const create = <TRootStore>() => ({
  handler: <TStore>(initialState: TStore, options: HandlerOptions = {}) =>
    new Handler<TStore, TRootStore>(initialState, options) as HandlerClass<TStore, TRootStore>
})