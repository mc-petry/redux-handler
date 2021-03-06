import { Lifecycle } from '../types'
import { HOperator } from '../api'

/**
 * Sets the property = `true` on pending.
 * Sets the property = `false` on completed.
 */
export function loading<S extends {}, TArgs, T, RS, A>(prop: keyof S): HOperator<RS, S, TArgs, T, T, A, A> {
  return ({
    hooks: {
      init: ({ chain }) => {
        chain.asyncActionHandlers[Lifecycle.Pending].push((s: any) => ({ ...s, [prop]: true }))
        chain.asyncActionHandlers[Lifecycle.Completed].push((s: any) => ({ ...s, [prop]: false }))
      }
    }
  })
}