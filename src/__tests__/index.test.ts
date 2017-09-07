import { CUSTOM_NAME, DEFAULT_NAME, getDefaultName, getName, getCatch, setDefaultName, setName, obs, obsCancelled, obsCancel, obsMultipleActions, obsNotCatched, notCatched } from './modules/library'
import { store } from './store'
import { Observable } from 'rxjs'

describe('action', () => {
  test('parameterless', () => {
    store.dispatch(setDefaultName())
    expect(store.getState().lib.name).toBe(DEFAULT_NAME)
    expect(store.getState().lib2.name).toBe(DEFAULT_NAME)
  })

  test('with parameters', () => {
    const actionCreator = store.dispatch(setName({ name: CUSTOM_NAME }))
    expect(store.getState().lib.name).toBe(CUSTOM_NAME)
    expect(actionCreator.payload.name).toBe(CUSTOM_NAME)
    expect(setName.type).toBe('library/SET_CUSTOM_NAME')
    expect(store.getState().lib2.name).toBe(CUSTOM_NAME)
  })
})

describe('promise', () => {
  test('parameterless', () =>
    store.dispatch(getDefaultName())
      .then(value => {
        expect(value).toBe('Lisa')
        expect(store.getState().lib.name).toBe(value)
        expect(store.getState().lib.loading).toBeFalsy()
      }))

  test('with parameters', () => {
    const corp = ['D', 'i', 'm', 'o', 'n']
    return store.dispatch(getName({ corp }))
      .then(() => {
        expect(store.getState().lib.corp).toBe(corp)
        expect(store.getState().lib.name).toBe('Dimon')
        expect(store.getState().lib.corp.length === 5).toBeTruthy()
        expect(store.getState().lib.loading).toBeFalsy()
        expect(store.getState().lib.pending).toBeTruthy()
      })
  })

  test('catch', () =>
    store.dispatch(getCatch())
      .then((value: Error) => {
        expect(value instanceof Error).toBeTruthy()
        expect(store.getState().lib.name).toBe('[Rejected]')
      }))

  test('uncatched', done => {
    store.dispatch(notCatched())
      .then(undefined, (e: Error) => {
        expect(e.message).toBe('Rejected')
        done()
      })
  })
})

describe('observable', () => {
  test('simple', () => {
    new Promise(resolve => store.dispatch(obs({})).add(resolve)).then(() => {
      const state = store.getState().lib
      expect(state.obsPending).toBeTruthy()
      expect(state.obsFulfilled).toBe('John')
      expect(state.obsFinally).toBeTruthy()
    })
  })

  test('reject', () =>
    new Promise(resolve => store.dispatch(obs({ withError: true })).add(resolve)).then(() => {
      const state = store.getState().lib
      expect(state.obsRejected).toBeTruthy()
      expect(state.obsFinallyRejected).toBeTruthy()
    }))

  test('cancellation', () => {
    Observable.timer(100).subscribe(() => store.dispatch(obsCancel()))
    return new Promise(resolve => store.dispatch(obsCancelled()).add(resolve)).then(() => {
      const state = store.getState().lib
      expect(state.obsNotCancelled).not.toBeTruthy()
    })
  })

  test('multiple actions & payloads', () =>
    new Promise(resolve => store.dispatch(obsMultipleActions()).add(resolve)).then(() => {
      const state = store.getState().lib
      expect(state.multiple1).toBeTruthy()
      expect(state.multiple2).toBeTruthy()
      expect(state.multiple3).toBeTruthy()
      expect(state.multipleResult).toBe('Lodash')
    }))
})