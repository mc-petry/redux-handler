import { CUSTOM_NAME, DEFAULT_NAME, getDefaultName, getName, getCatch, setDefaultName, setName } from './modules/library'
import { store } from './store'

test('sync actions without params', () => {
  store.dispatch(setDefaultName())
  expect(store.getState().lib.name).toBe(DEFAULT_NAME)
  expect(store.getState().lib2.name).toBe(DEFAULT_NAME)
})

test('sync actions with params', () => {
  const actionCreator = store.dispatch(setName({ name: CUSTOM_NAME }))
  expect(store.getState().lib.name).toBe(CUSTOM_NAME)
  expect(actionCreator.payload.name).toBe(CUSTOM_NAME)
  expect(setName.type).toBe('library/SET_CUSTOM_NAME')
  expect(store.getState().lib2.name).toBe(CUSTOM_NAME)
})

test('async actions without params', () =>
  store.dispatch(getDefaultName())
    .then(value => {
      expect(value).toBe('Lisa')
      expect(store.getState().lib.name).toBe(value)
      expect(store.getState().lib.loading).toBeFalsy()
    }))

test('async actions with params', () => {
  const corp = ['D', 'i', 'm', 'o', 'n']
  return store.dispatch(getName({ corp }))
    .then(() => {
      expect(store.getState().lib.corp).toBe(corp)
      expect(store.getState().lib.name).toBe('Dimon')
      expect(store.getState().lib.corp.length === 5).toBeTruthy()
      expect(store.getState().lib.loading).toBeFalsy()
    }))
  }

test('async catch', () =>
  store.dispatch(getCatch())
    .then((value: Error) => {
      expect(value instanceof Error).toBeTruthy()
      expect(store.getState().lib.name).toBe('[Rejected]')
    }))