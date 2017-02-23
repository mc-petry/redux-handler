import { Handler } from '../../'
import { IStore } from '../store'

export const DEFAULT_NAME = 'Jesica'
export const CUSTOM_NAME = 'Veronica'

export interface ILibraryStore {
  name?: string
  userId?: number
  data?: string[]
  loading?: boolean
  const: string
}

const handler = new Handler<IStore, ILibraryStore>({ const: 'INIT' }, { prefix: 'library' })

export const setDefaultName = handler.sync('SET_DEFAULT_NAME', state => ({ ...state, name: DEFAULT_NAME }))
export const setName = handler.sync<{ name: string }>('SET_CUSTOM_NAME', (state, action) => ({ ...state, name: action.payload.name }))
export const getDefaultName = handler.async('GET_DEFAULT_NAME', () => Promise.resolve('Lisa'), {
  pending: state => ({ ...state, loading: true }),
  then: (state, a) => ({ ...state, name: a.payload, userId: a.meta.userId }),
  finally: state => ({ ...state, loading: false }),
  meta: { userId: 25 }
})

export const getName = handler.async('GET_CUSTOM_NAME', (args: { corp: string[] }) => Promise.resolve(args.corp).then(x => x.join('')), {
  pending: state => ({ ...state, loading: true }),
  then: (state, a) => ({ ...state, name: a.payload }),
  finally: state => ({ ...state, loading: false })
})

export const getCatch = handler.async('GET_ERROR', () => Promise.resolve().then<Error>(() => { throw new Error() }), {
  pending: state => ({ ...state, loading: true }),
  catch: state => ({ ...state, name: '[Rejected]' }),
  finally: state => ({ ...state, loading: false })
})

export const shouldNotBeCalled = handler.async('PREVENTED', () => Promise.resolve(), {
  then: state => ({ ...state, const: '55' }),
  shouldCall: store => store.library.const !== 'INIT'
})

export const library = handler.toReducer()