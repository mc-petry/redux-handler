import { Lifecycle, META_SYM, ARGS_SYM } from '../types'
import { AsyncOperator } from '../api'

/**
 * Prevents call any operators based on state
 */
export const available = <RS, S, TArgs, T, A>(fn: (getState: () => RS, other: { args: TArgs, type: string }) => boolean):
  AsyncOperator<RS, S, TArgs, T, T, A, A> =>
  ({
    hooks: {
      beforeNext: ({ action: { [META_SYM]: meta, [ARGS_SYM]: args, type }, getState, preventDefault }) => {
        if (meta.state === Lifecycle.INIT) {
          if (!fn(getState, { args, type })) {
            preventDefault()
          }
        }

        return
      }
    }
  })