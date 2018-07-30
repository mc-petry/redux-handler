import { store } from './store'
import { baseSyncWithArgs, baseSync } from './modules/sync'

const getState = () => store.getState().sync

describe('sync', () => {
  it('base', () => {
    store.dispatch(baseSync())
    store.dispatch(baseSyncWithArgs({ data: 'yellow' }))

    const state = getState()

    expect(state.prop).toBe('green')
    expect(state.propArg).toBe('yellow')
  })
})