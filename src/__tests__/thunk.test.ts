import { store } from './store'
import { getAsyncName } from './modules/thunk'
import { delay } from 'rxjs/operators'
import { of } from 'rxjs'

const getState = () => store.getState().thunk

describe('thunk', async () => {
  it('', async () => {
    store.dispatch(getAsyncName({ episode: 3 }))

    await of(delay(1)).toPromise()

    expect(getState().data).toBe('Avengers 3: Thanos')
  })
})