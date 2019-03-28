import { Lifecycle, META_SYM, ARGS_SYM } from '../types'
import { HOperator } from '../api'

/**
 * Prevents calling async operators based on state.
 * Can be used only before main operator such `rx` or `promise`.
 */
export function available<RS, S, TArgs, T, A>(fn: (getState: () => RS, other: { args: TArgs, type: string }) => boolean): HOperator<RS, S, TArgs, T, T, A, A> {
  return ({
    hooks: {
      beforeNext: ({ action: { [META_SYM]: meta, [ARGS_SYM]: args, type }, getState, preventDefault }) => {
        if (
          (meta.state && meta.state === Lifecycle.INIT) ||
          !meta.state
        ) {
          if (!fn(getState, { args, type })) {
            preventDefault()
          }
        }

        return
      }
    }
  })
}