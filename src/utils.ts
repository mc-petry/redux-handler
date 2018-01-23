import { Action } from 'redux'
import { ActionSystem } from './handler'

/**
 * Action sanitizer for __REDUX_DEVTOOLS_EXTENSION_COMPOSE__
 */
export const actionSanitizer: (action: Action) => Action = (action: ActionSystem) =>
  action.__state
    ? ({ ...action, type: `${action.type} [ ${action.__state.toUpperCase()} ]` })
    : action