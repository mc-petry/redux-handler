import { Action } from 'redux'
import { InternalAction, META_SYM } from './types'

/**
 * Creates a new action sanitizer for __REDUX_DEVTOOLS_EXTENSION_COMPOSE__
 */
export const actionSanitizer: (action: Action) => Action =
  action => {
    const meta = (action as InternalAction)[META_SYM]

    return meta && meta.async && meta.state
      ? ({ ...action, type: `${action.type} [ ${meta.state.toUpperCase()} ]` })
      : action
  }