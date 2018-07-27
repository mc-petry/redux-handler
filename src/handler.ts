import { Lifecycle, ActionHandler, Action, InternalAction, InternalHandler, ArgsAction, META_SYM, ARGS_SYM } from './types'
import { AsyncOperator, AsyncOperatorOnInitEvent, AsyncOperatorOnActionCreatingEvent } from './api'
import { Reducer } from 'redux'
import { HandlerChain } from './handler-chain'
import { prefixGenerator, actionTypeGenerator } from './internal/generators'

const callHandlers = <TState>(handlers: ActionHandler<TState, Action>[], state: TState, action: Action) => {
  for (const h of handlers)
    state = h(state, action)

  return state
}

const FACTORY_SYM = Symbol('factory')

const enum FactoryType {
  Sync = 1,
  Pipe = 2
}

interface Factory {
  /**
   * Action type
   */
  TYPE: string

  [FACTORY_SYM]: {
    type: FactoryType
  }
}

type ActionCreatorWithoutArgs<TAction, TPayload> = (() => TAction) & Factory
type ActionCreatorWithArgs<TAction, TPayload, TArgs> = ((args: TArgs) => TAction) & Factory

/**
 * We needs explicit Action Creator types to infer TArgs & TPayload
 */
type ActionCreator<TArgs, TAction extends Action = Action, TPayload = any> = TArgs extends undefined
  // ? (<T = TPayload>() => TAction)
  ? ActionCreatorWithoutArgs<TAction, TPayload>
  // : (<T = TPayload, A = TArgs>(args: A) => TAction)
  : ActionCreatorWithArgs<TAction, TPayload, TArgs>

interface HandlerClass<S, RS> extends InternalHandler<S> {
  /**
   * Handle existing action creator
   */
  handle<T, A, TA extends Action>(
    a: ActionCreatorWithArgs<TA, T, A> | ActionCreatorWithoutArgs<TA, T>,
    ...ops: AsyncOperator<RS, S, A, T, T>[]
  ): void

  /**
   * Creates new action creator
   */
  action<TArgs = undefined>(name?: string): {
    /**
     * Creates action without any handlers
     */
    empty(): ActionCreator<TArgs>

    /**
     * Handle sync actions
     */
    handle(handler: ActionHandler<S, Action & { args: TArgs }>): void

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
     * Handle async actions
     */
    pipe<T1, T2, A1, A2 extends Action>(op1: AsyncOperator<RS, S, TArgs, T1, T2, A1, A2>): ActionCreator<TArgs, A2, T2>
    pipe<T1, T2, T3, A1, A2, A3 extends Action>(op1: AsyncOperator<RS, S, TArgs, T1, T2, A1, A2>, op2: AsyncOperator<RS, S, TArgs, T2, T3, A2, A3>): ActionCreator<TArgs, A3, T3>
    pipe<T1, T2, T3, T4, A1, A2, A3, A4 extends Action>(op1: AsyncOperator<RS, S, TArgs, T1, T2, A1, A2>, op2: AsyncOperator<RS, S, TArgs, T2, T3, A2, A3>, op3: AsyncOperator<RS, S, TArgs, T3, T4, A3, A4>): ActionCreator<TArgs, A4, T4>
    pipe<T1, T2, T3, T4, T5, A1, A2, A3, A4, A5 extends Action>(op1: AsyncOperator<RS, S, TArgs, T1, T2, A1, A2>, op2: AsyncOperator<RS, S, TArgs, T2, T3, A2, A3>, op3: AsyncOperator<RS, S, TArgs, T3, T4, A3, A4>, op4: AsyncOperator<RS, S, TArgs, T4, T5, A4, A5>): ActionCreator<TArgs, A5, T5>
    pipe<T1, T2, T3, T4, T5, T6, A1, A2, A3, A4, A5, A6 extends Action>(op1: AsyncOperator<RS, S, TArgs, T1, T2, A1, A2>, op2: AsyncOperator<RS, S, TArgs, T2, T3, A2, A3>, op3: AsyncOperator<RS, S, TArgs, T3, T4, A3, A4>, op4: AsyncOperator<RS, S, TArgs, T4, T5, A4, A5>, op5: AsyncOperator<RS, S, TArgs, T5, T6, A5, A6>): ActionCreator<TArgs, A6, T6>
    pipe<T1, T2, T3, T4, T5, T6, T7, A1, A2, A3, A4, A5, A6, A7 extends Action>(op1: AsyncOperator<RS, S, TArgs, T1, T2, A1, A2>, op2: AsyncOperator<RS, S, TArgs, T2, T3, A2, A3>, op3: AsyncOperator<RS, S, TArgs, T3, T4, A3, A4>, op4: AsyncOperator<RS, S, TArgs, T4, T5, A4, A5>, op5: AsyncOperator<RS, S, TArgs, T5, T6, A5, A6>, op6: AsyncOperator<RS, S, TArgs, T6, T7, A6, A7>): ActionCreator<TArgs, A7, T7>
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, A1, A2, A3, A4, A5, A6, A7, A8 extends Action>(op1: AsyncOperator<RS, S, TArgs, T1, T2, A1, A2>, op2: AsyncOperator<RS, S, TArgs, T2, T3, A2, A3>, op3: AsyncOperator<RS, S, TArgs, T3, T4, A3, A4>, op4: AsyncOperator<RS, S, TArgs, T4, T5, A4, A5>, op5: AsyncOperator<RS, S, TArgs, T5, T6, A5, A6>, op6: AsyncOperator<RS, S, TArgs, T6, T7, A6, A7>, op7: AsyncOperator<RS, S, TArgs, T7, T8, A7, A8>): ActionCreator<TArgs, A8, T8>
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, A1, A2, A3, A4, A5, A6, A7, A8, A9 extends Action>(op1: AsyncOperator<RS, S, TArgs, T1, T2, A1, A2>, op2: AsyncOperator<RS, S, TArgs, T2, T3, A2, A3>, op3: AsyncOperator<RS, S, TArgs, T3, T4, A3, A4>, op4: AsyncOperator<RS, S, TArgs, T4, T5, A4, A5>, op5: AsyncOperator<RS, S, TArgs, T5, T6, A5, A6>, op6: AsyncOperator<RS, S, TArgs, T6, T7, A6, A7>, op7: AsyncOperator<RS, S, TArgs, T7, T8, A7, A8>, op8: AsyncOperator<RS, S, TArgs, T8, T9, A8, A9>): ActionCreator<TArgs, A9, T9>
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10 extends Action>(op1: AsyncOperator<RS, S, TArgs, T1, T2, A1, A2>, op2: AsyncOperator<RS, S, TArgs, T2, T3, A2, A3>, op3: AsyncOperator<RS, S, TArgs, T3, T4, A3, A4>, op4: AsyncOperator<RS, S, TArgs, T4, T5, A4, A5>, op5: AsyncOperator<RS, S, TArgs, T5, T6, A5, A6>, op6: AsyncOperator<RS, S, TArgs, T6, T7, A6, A7>, op7: AsyncOperator<RS, S, TArgs, T7, T8, A7, A8>, op8: AsyncOperator<RS, S, TArgs, T8, T9, A8, A9>, op9: AsyncOperator<RS, S, TArgs, T9, T10, A9, A10>): ActionCreator<TArgs, A10, T10>
    pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11 extends Action>(op1: AsyncOperator<RS, S, TArgs, T1, T2, A1, A2>, op2: AsyncOperator<RS, S, TArgs, T2, T3, A2, A3>, op3: AsyncOperator<RS, S, TArgs, T3, T4, A3, A4>, op4: AsyncOperator<RS, S, TArgs, T4, T5, A4, A5>, op5: AsyncOperator<RS, S, TArgs, T5, T6, A5, A6>, op6: AsyncOperator<RS, S, TArgs, T6, T7, A6, A7>, op7: AsyncOperator<RS, S, TArgs, T7, T8, A7, A8>, op8: AsyncOperator<RS, S, TArgs, T8, T9, A8, A9>, op9: AsyncOperator<RS, S, TArgs, T9, T10, A9, A10>, op10: AsyncOperator<RS, S, TArgs, T10, T11, A10, A11>): ActionCreator<TArgs, A11, T11>
  }
}

interface HandlerOptions {
  prefix?: string | string[]
}

class Handler<TStore, TRootStore> implements HandlerClass<TStore, TRootStore> {

  private get nextActionType() {
    if (!this._typeGenerator)
      this._typeGenerator = actionTypeGenerator(this._prefix)

    return this._typeGenerator.next().value
  }
  static readonly prefixIterator = prefixGenerator()

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

  handle(fn: ActionCreator<any>, ...operators: AsyncOperator[]) {
    if (fn[FACTORY_SYM].type === FactoryType.Pipe) {
      const chain = new HandlerChain<TStore>()

      const initEventArgs: AsyncOperatorOnInitEvent<TStore> = {
        chain,
        handler: this
      }

      for (const op of operators)
        if (op.hooks.init)
          op.hooks.init(initEventArgs)

      this.actionHandlers[fn.TYPE] = (
        (state, action: InternalAction) => {
          const handler = chain.asyncActionHandlers[action[META_SYM].state]

          return handler
            ? callHandlers(handler, state, action)
            : state
        }
      ) as ActionHandler<TStore, Action>
    }
  }

  action<A = undefined>(name?: string): {
    empty(): ActionCreator<A>
    handle(handler: ActionHandler<TStore, Action & { args: A }>): ActionCreator<A>
    pipe<T>(...operators: AsyncOperator<TRootStore, TStore, A, T>[]): ActionCreator<A>
  } {
    const type = name != null
      ? `${this._prefix}/${name}`
      : this.nextActionType

    return {
      empty: () => this.empty(type),
      handle: hr => this.sync(type, hr),
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
    return (() => ({ type })) as ActionCreator<A>
  }

  private sync<A>(type: string, fn: ActionHandler<TStore, Action & { args: A }>): ActionCreator<A> {
    this.actionHandlers[type] = fn as ActionHandler<TStore, Action>

    const action: (args?: any) => ArgsAction =
      args => ({ type, args })

    return action as ActionCreator<A, ArgsAction>
  }

  private pipe<A, T>(type: string, ...operators: AsyncOperator<TRootStore, TStore, A, T>[]): ActionCreator<A, Action> {
    const chain = new HandlerChain<TStore>()

    // #region On init

    const initEventArgs: AsyncOperatorOnInitEvent<TStore> = {
      chain,
      handler: this
    }

    for (const op of operators)
      if (op.hooks.init)
        op.hooks.init(initEventArgs)

    // #endregion

    this.actionHandlers[type] = (
      (state, action: InternalAction) => {
        const handler = chain.asyncActionHandlers[action[META_SYM].state]

        const s = handler
          ? callHandlers(handler, state, action)
          : state

        return s
      }
    ) as ActionHandler<TStore, Action>

    // #region On action creating

    const actionCreatorEventArgs: AsyncOperatorOnActionCreatingEvent<TStore> = {
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
            finally: chain.asyncActionHandlers[Lifecycle.Finally].length > 0,
          }
        }
      }
    }

    const ac = ((args?: A) => {
      let internalAction: InternalAction | undefined

      for (const op of operators)
        if (op.hooks.action) {
          const res = op.hooks.action(actionCreatorEventArgs)

          if (res) {
            if (process.env.NODE_ENV !== 'production') {
              if (internalAction)
                throw new TypeError('`ActionCreator` returns action multiple times. Perhaps you add a few main operators. Check your pipe.')
            }

            internalAction = res
          }
        }

      if (!internalAction)
        throw new TypeError('`InitHook` never returned an action. Perhaps you forgot to add the main operator. Check your pipe.')


      internalAction![ARGS_SYM] = args
      return internalAction
    }) as ActionCreator<A, InternalAction>

    // #endregion

    const factory: Factory = ac as any

    factory.TYPE = type
    factory[FACTORY_SYM] = {
      type: FactoryType.Pipe
    }

    return ac
  }
}

export default <TStore, TRootStore = never>(initialState: TStore, options: HandlerOptions = {}) =>
  new Handler<TStore, TRootStore>(initialState, options) as HandlerClass<TStore, TRootStore>