import { store } from './store'
import { baseSyncWithArgs, baseSync } from './modules/sync-a'

const getStateA = () => store.getState().syncA
const getStateB = () => store.getState().syncB

describe('sync', () => {
  it('base', () => {
    store.dispatch(baseSync())
    store.dispatch(baseSyncWithArgs({ data: 'yellow' }))

    const state = getStateA()

    expect(state.prop).toBe('green')
    expect(state.propArg).toBe('yellow')

    const stateB = getStateB()
    expect(stateB.handle).toBe('yellow')
  })
})