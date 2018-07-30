import { InternalAction, META_SYM, Lifecycle } from '../types'

/**
 * Creates a copy of internal action with
 * new Lifecycle state and additional fields
 */
export const mutateInternalAction: <T>(source: InternalAction, state: Lifecycle, action?: Pick<T, Exclude<keyof T, keyof InternalAction>>) => InternalAction & T =
  (source, state, action) =>
    ({
      type: source.type,
      ...(action as any),
      [META_SYM]: {
        ...source[META_SYM],
        state
      }
    })