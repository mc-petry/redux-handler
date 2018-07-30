import { ActionHandler, Lifecycle } from '../types'

export class HandlerChain<TStore> {
  readonly asyncActionHandlers: { [key: string]: ActionHandler<TStore>[] } = {
    [Lifecycle.Pending]: [],
    [Lifecycle.Fulfilled]: [],
    [Lifecycle.Rejected]: [],
    [Lifecycle.Completed]: []
  }
}