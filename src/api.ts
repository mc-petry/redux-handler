import { InternalAction, Action, InternalHandler, ActionCreator } from './types'
import { Dispatch } from 'redux'
import { MiddlewareOptions } from './middleware'
import { HandlerChain } from './internal/handler-chain'

export interface HOperatorOnCustomActionEvent {
  type: string
  handler: InternalHandler
  operators: HOperator[]
}

export interface HOperatorOnHandlerBaseEvent<TStore> {
  readonly handler: InternalHandler<TStore>
  readonly chain: HandlerChain<TStore>
}

export interface HOperatorOnInitEvent<TStore> extends HOperatorOnHandlerBaseEvent<TStore> {
}

export interface HOperatorOnActionCreatingEvent<TStore> extends HOperatorOnHandlerBaseEvent<TStore> {
  /**
   * Base action. You must extends it on your own.
   */
  readonly action: InternalAction<{}>
}

interface HOperatorOnMiddlewareBaseEvent<TRootStore> {
  readonly dispatch: Dispatch<Action>
  readonly options: MiddlewareOptions
  readonly getState: () => TRootStore
}

export interface HOperatorOnBeforeNextEvent<TRootStore, TAction> extends HOperatorOnMiddlewareBaseEvent<TRootStore> {
  readonly action: TAction
  readonly defaultPrevented: boolean

  preventDefault(): void
}

export interface HOperatorOnAfterNextEvent<TRootStore, TAction = InternalAction<{}>> extends HOperatorOnMiddlewareBaseEvent<TRootStore> {
  /**
   * Allows to override returning `action` in middleware.
   */
  readonly action: TAction
}
export type CustomActionHook<A> = (e: HOperatorOnCustomActionEvent) => ActionCreator<A>
export type InitHook<TStore> = (e: HOperatorOnInitEvent<TStore>) => void
export type ModifyActionHook<TStore, TAction = InternalAction<{}>> = (e: HOperatorOnActionCreatingEvent<TStore>) => TAction
export type BeforeNextHook<TRootStore, TAction = InternalAction<{}>> = (e: HOperatorOnBeforeNextEvent<TRootStore, TAction>) => void | any
export type AfterNextHook<TRootStore> = (e: HOperatorOnAfterNextEvent<TRootStore>) => void | any

export interface HOperator<TRootStore = any, TStore = any, TArgs = any, TPayload = any, TResult = any, TAction = any, TNextAction = any> {
  hooks: {
    /**
     * Occurs before async action creates
     */
    customAction?: CustomActionHook<TArgs>

    /**
     * Occurs on async action creating.
     * Here you must register your handlers.
     */
    init?: InitHook<TStore>

    /**
     * Only single operator in pipeline must modify.
     */
    modifyAction?: ModifyActionHook<TStore>

    /**
     * Occurs before next action will be dispatched.
     * @returns Return value to prevent next hook logic.
     */
    beforeNext?: BeforeNextHook<TRootStore>

    /**
     * Occurs after `next(action)` passed.
     * @returns New action if needed.
     */
    afterNext?: AfterNextHook<TRootStore>
  }
}