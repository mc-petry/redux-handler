import { Handler } from '../../index'
import { setDefaultName, setName, DEFAULT_NAME, getDefaultNameChain, obsTestHandleChain } from './library'

export interface Lib2Store {
  name?: string
  testPending?: boolean
  testFulfilled?: any
  testFinally?: boolean

  obsHandlePending?: boolean
  obsHandleFulfilled?: boolean
  obsHandleFinally?: boolean
}

const handler = new Handler<Lib2Store>({}, { prefix: 'library2' })

handler.handle(setDefaultName, (s, a) => ({ ...s, name: DEFAULT_NAME }))
handler.handle(setName, (s, a) => ({ ...s, name: a.payload.name }))

handler.handle(getDefaultNameChain)
  .pending(s => ({ ...s, testPending: true }))
  .fulfilled((s, a) => ({ ...s, testFulfilled: a.payload }))
  .finally(s => ({ ...s, testFinally: true }))

handler.handle(obsTestHandleChain)
  .pending(s => ({ ...s, obsHandlePending: true }))
  .fulfilled(s => ({ ...s, obsHandleFulfilled: true }))
  .finally(s => ({ ...s, obsHandleFinally: true }))

export const lib2 = handler.buildReducer()