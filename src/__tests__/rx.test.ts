import { store } from './store'
import { baseRx, preventedRx, stopRx, getMilk } from './modules/rx-a'
import { timer } from 'rxjs'

const getStateA = () => store.getState().rxA
const getStateB = () => store.getState().rxB

describe('rx', () => {
  describe('operators', () => {
    it('success action', async () => {
      await store.dispatch(baseRx({ data: 'x' }))

      const state = getStateA()

      expect(state.pending).toBe('x')
      expect(state.fulfilled).toBe('xy')
      expect(state.finalize).toBe('x')
      expect(state.loading).toBe(false)

      const stateB = getStateB()

      expect(stateB.pending2).toBe('x')
      expect(stateB.fulfilled2).toBe('xy')
    })

    it('available operator', async () => {
      await store.dispatch(baseRx({ data: 'y', notavailable: 'yes' }))

      const state = getStateA()

      expect(state.pending).not.toBe('y')
      expect(state.fulfilled).not.toBe('yy')
      expect(state.finalize).not.toBe('y')
    })

    it('failed action', async () => {
      await store.dispatch(baseRx({ reject: true }))

      const state = getStateA()

      expect(state.rejected).toBe('err')
    })

    it('prevent async operator', async () => {
      timer(100).subscribe(() => store.dispatch(stopRx()))

      await store.dispatch(preventedRx())
        .then(() => {
          const state = getStateA()

          expect(state.prevent).not.toBe('data')
        })
    })

    it('dispatch action in action', async () => {
      await store.dispatch(getMilk())

      const state = getStateA()

      expect(state.milk).toBe(10)
      expect(state.yoghurt).toBe(5)
      expect(state.cheese).toBe(2)
    })

    /*
    jest.setTimeout(30000)
    it('performance', async () => {
      const nq: number[] = []
      // await new Promise(resolve => {
      for (let i = 0; i < 100000; i++) {
        await store.dispatch(getMilk())

        const m = (process as any).memoryUsage().heapUsed / 1024 / 1024
        nq.push(m)
        // console.log(`Script uses ${m} MB`)

        if (i % 1000 === 0) {
          await new Promise(r => setTimeout(r, 100))
        }
      }

      for (let i = 0; i < nq.length / 100; i++) {
        console.log(nq.slice(i * 100, i * 100 + 100))
      }
      // })
    })
    */
  })
})