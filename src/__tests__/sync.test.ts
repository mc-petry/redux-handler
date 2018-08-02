import { store } from './store'
import { baseSyncWithArgs, baseSync, testUnionArgs } from './modules/sync-a'

const getStateA = () => store.getState().syncA
const getStateB = () => store.getState().syncB

describe('sync', () => {
  it('base', () => {
    store.dispatch(baseSync())
    store.dispatch(baseSyncWithArgs({ data: 'yellow' }))
    store.dispatch(testUnionArgs({ data: 'a' }))
    store.dispatch(testUnionArgs({ value: 'b' }))

    const state = getStateA()

    expect(state.prop).toBe('green')
    expect(state.propArg).toBe('yellow')
    expect(state.union).toBe('ab')

    const stateB = getStateB()
    expect(stateB.handle).toBe('yellow')
  })
})