import { store } from './store'
import { baseRx, preventedRx, stopRx } from './modules/rx'
import { RxAction } from '../operators/rx'
import { timer } from 'rxjs'

const testRx = (action: RxAction, fn: () => void) =>
  () => new Promise(resolve => store.dispatch(action).add(resolve))
    .then(fn)

const getState = () => store.getState().rxA
const getState2 = () => store.getState().rxB

describe('rx', () => {
  describe('operators', () => {
    it('success action', testRx(baseRx({ data: 'x' }), () => {
      const state = getState()

      expect(state.pending).toBe('x')
      expect(state.fulfilled).toBe('xy')
      expect(state.finalize).toBe('x')
      expect(state.loading).toBe(false)

      const state2 = getState2()

      expect(state2.pending2).toBe('x')
      expect(state2.fulfilled2).toBe('xy')
    }))

    it('available operator', testRx(baseRx({ data: 'y', notavailable: 'yes' }), () => {
      const state = getState()

      expect(state.pending).not.toBe('y')
      expect(state.fulfilled).not.toBe('yy')
      expect(state.finalize).not.toBe('y')
    }))

    it('failed action', testRx(baseRx({ reject: true }), () => {
      const state = getState()

      expect(state.rejected).toBe('err')
    }))

    it('prevent async operator', () => {
      timer(100).subscribe(()  => store.dispatch(stopRx()))
      return testRx(preventedRx(), () => {
        const state = getState()

        expect(state.prevent).not.toBe('data')
      })()
    })
  })
})