import { Action, ActionCreator, ARGS_SYM, META_SYM, InternalAction } from '../types'
import { HOperator } from '../api'
import { Dispatch } from 'redux'

type ThunkFn<RS = any, A = any, AT = any> = (data: { dispatch: Dispatch<Action>, getState: () => RS, args: A }) => AT

interface ThunkMeta {
  thunk: ThunkFn
}

/**
 * Handles async dispatch.
 */
export function thunk<RS, S, A, AT, T>(fn: ThunkFn<RS, A, AT>): HOperator<RS, S, A, T, T, AT, Action> {
  return {
    hooks: {
      customAction: ({ type, operators }) => {
        const factory = ((args: A) => {
          return {
            [META_SYM]: {
              operators,
              thunk: fn
            },
            [ARGS_SYM]: args,
            type
          }
        }) as ActionCreator<A, InternalAction<ThunkMeta>>

        factory.TYPE = type

        return factory
      },

      beforeNext: ({ action, defaultPrevented, dispatch, getState }) => {
        const a = action as InternalAction<ThunkMeta>

        if (typeof a[META_SYM].thunk === 'function' && !defaultPrevented) {
          return a[META_SYM].thunk({ dispatch, getState, args: action[ARGS_SYM] })
        }
      }
    }
  }
}