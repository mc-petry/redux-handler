import { Action } from './types'

// ONLY FOR INTERNAL USAGE

export interface PluginOnNextHookEvent<TAction extends Action = Action> {
  action: TAction
}

export type PluginOnNextHook = (e: PluginOnNextHookEvent) => void

export interface HandlerPlugin {
  onNext?: PluginOnNextHook
}