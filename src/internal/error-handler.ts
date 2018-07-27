import { MiddlewareOptions } from '../middleware'
import { InternalAction, Action } from '../types'
import { Dispatch } from 'redux'

export const errorHandler = ({ options, error, action, dispatch }: {
  options: MiddlewareOptions | undefined
  dispatch: Dispatch<Action>
  action: InternalAction
  error: any
}) => {
  if (options && options.errorHandler) {
    if (options && options.errorHandler) {
      const errorAction = options.errorHandler(error, { type: action.type })

      if (errorAction && typeof (errorAction as Action).type === 'string')
        dispatch(errorAction as Action)
    }
  }
  else {
    // tslint:disable:no-console
    console.warn('Register `Error Handler` on middleware to handle errors')
    console.error(error)
    // tslint:enable:no-console
  }
}