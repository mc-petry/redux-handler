import { Lifecycle, } from '../types'
import { AsyncOperator } from '../api'

/**
 * On 'pending' sets property to `true`
 * On 'finally' sets property to `false`
 */
export const loading = <S extends {}, TArgs, T, RS, A>(prop: keyof S):
  AsyncOperator<RS, S, TArgs, T, T, A, A> =>
  ({
    hooks: {
      init: ({ chain }) => {
        chain.asyncActionHandlers[Lifecycle.Pending].push((s: any) => ({ ...s, [prop]: true }))
        chain.asyncActionHandlers[Lifecycle.Finally].push((s: any) => ({ ...s, [prop]: false }))
      }
    }
  })