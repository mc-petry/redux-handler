import { InternalAction, Action, InternalHandler } from './types'
import { Dispatch } from 'redux'
import { MiddlewareOptions } from './middleware'
import { HandlerChain } from './handler-chain'

export interface AsyncOperatorOnHandlerBaseEvent<TStore> {
  readonly handler: InternalHandler<TStore>
  readonly chain: HandlerChain<TStore>
}

export interface AsyncOperatorOnInitEvent<TStore> extends AsyncOperatorOnHandlerBaseEvent<TStore> {
}

export interface AsyncOperatorOnActionCreatingEvent<TStore> extends AsyncOperatorOnHandlerBaseEvent<TStore> {
  /**
   * Base action. You must extends it on your own.
   */
  readonly action: InternalAction
}

interface AsyncOperatorOnMiddlewareBaseEvent<TRootStore> {
  readonly dispatch: Dispatch<Action>
  readonly options: MiddlewareOptions
  readonly getState: () => TRootStore
}

export interface AsyncOperatorOnBeforeNextEvent<TRootStore, TAction extends InternalAction = InternalAction> extends AsyncOperatorOnMiddlewareBaseEvent<TRootStore> {
  readonly action: TAction
  readonly defaultPrevented: boolean

  preventDefault(): void
}

export interface AsyncOperatorOnNextEvent<TRootStore, TAction extends InternalAction = InternalAction> extends AsyncOperatorOnMiddlewareBaseEvent<TRootStore> {
  /**
   * You can replace returns `action` in middleware
   */
  readonly action: TAction
}
export type InitHook<TStore> = (e: AsyncOperatorOnInitEvent<TStore>) => void
export type ActionHook<TStore, A extends InternalAction = InternalAction> = (e: AsyncOperatorOnActionCreatingEvent<TStore>) => A
export type BeforeNextHook<TRootStore> = (e: AsyncOperatorOnBeforeNextEvent<TRootStore>) => void | any
export type AfterNextHook<TRootStore> = (e: AsyncOperatorOnNextEvent<TRootStore>) => void | any

export interface AsyncOperator<TRootStore = any, TStore = any, TArgs = any, TPayload = any, TResult = any, TAction = any, TNextAction = any> {
  hooks: {
    /**
     * Occurs on action creating.
     * Here you must register your handlers
     */
    init?: InitHook<TStore>

    /**
     * Only single operator in pipeline must return action
     */
    action?: ActionHook<TStore>

    /**
     * Occurs before next action will be dispatched
     * @returns Return value to prevent next hook logic
     */
    beforeNext?: BeforeNextHook<TRootStore>

    /**
     * Occurs after `next(action)` passed
     * @returns New action if needed
     */
    afterNext?: AfterNextHook<TRootStore>
  }
}