import { promise, fulfilled, sync } from '../../operators'
import { handler } from '../handler'

export interface PromiseStore {
  user?: string
  deposit?: number
  balance: number
}

export const promiseHandler = handler<PromiseStore>({
  balance: 10
})

export const setName = promiseHandler
  .action<{ user: string }>()
  .pipe(
    promise(({ user }) => Promise.resolve({ user })),
    fulfilled((s, { payload }) => ({ ...s, user: payload.user }))
  )

const setDeposit = promiseHandler
  .action<{ deposit: number }>()
  .pipe(sync((s, { args: { deposit } }) => ({ ...s, deposit })))

const updateBalance = promiseHandler
  .action<{ deposit: number }>()
  .pipe(sync((s, { args: { deposit } }) => ({ ...s, balance: s.balance + deposit })))

export const getDeposit = promiseHandler
  .action<{ amount: number }>()
  .pipe(
    promise(
      ({ amount }) => Promise.resolve({ amount })
        .then(({ amount: deposit }) =>
          promise.put([
            { user: 'system' },
            setDeposit({ deposit }),
            updateBalance({ deposit })
          ])
        )
    ),
    fulfilled((s, { payload: { user } }) => ({ ...s, user }))
  )