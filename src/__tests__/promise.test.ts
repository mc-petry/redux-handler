import { store } from './store'
import { setName, getDeposit } from './modules/promise'

const getState = () => store.getState().promise

describe('promise', () => {
  it('Simple', async () => {
    await store.dispatch(setName({ user: 'John' }))

    expect(getState().user)
      .toBe('John')
  })

  it('After effects', async () => {
    await store.dispatch(getDeposit({ amount: 10 }))

    const state = getState()

    expect(state.deposit).toBe(10)
    expect(state.balance).toBe(20)
    expect(state.user).toBe('system')
  })
})