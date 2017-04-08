import { CUSTOM_NAME, DEFAULT_NAME, getDefaultName, getName, getCatch, setDefaultName, setName, shouldNotBeCalled } from './modules/library'
import { store } from './store'

test('sync actions without params', () => {
  store.dispatch(setDefaultName())
  expect(store.getState().library.name).toBe(DEFAULT_NAME)
})

test('sync actions with params', () => {
  const actionCreator = store.dispatch(setName({ name: CUSTOM_NAME }))
  expect(store.getState().library.name).toBe(CUSTOM_NAME)
  expect(actionCreator.payload.name).toBe(CUSTOM_NAME)
})

test('async actions without params', () =>
  store.dispatch(getDefaultName())
    .then(value => {
      expect(value).toBe('Lisa')
      expect(store.getState().library.name).toBe(value)
      expect(store.getState().library.userId).toBe(25)
      expect(store.getState().library.loading).toBeFalsy()
    }))

test('async actions with params', () =>
  store.dispatch(getName({ corp: ['D', 'i', 'm', 'o', 'n'] }))
    .then(value => {
      expect(value).toBe('Dimon')
      expect(store.getState().library.name).toBe(value)
      expect(store.getState().library.corp.length === 5).toBeTruthy()
      expect(store.getState().library.loading).toBeFalsy()
    }))

test('async catch', () =>
  store.dispatch(getCatch())
    .then((value: Error) => {
      expect(value instanceof Error).toBeTruthy()
      expect(store.getState().library.name).toBe('[Rejected]')
    }))

test('async should not be called', () =>
  store.dispatch(shouldNotBeCalled())
    .then(() => {
      expect(store.getState().library.const).toBe('INIT')
    }))