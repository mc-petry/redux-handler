import { Handler } from '../../'
import { Store } from '../store'

export const DEFAULT_NAME = 'Jesica'
export const CUSTOM_NAME = 'Veronica'

export interface LibraryStore {
  name?: string
  name2?: string
  data?: string[]
  loading?: boolean
  const: string
  corp: string[]
}

const handler = new Handler<LibraryStore>({ const: 'INIT', corp: null }, { prefix: 'library' })

export const setDefaultName = handler.action('SET_DEFAULT_NAME', state => ({ ...state, name: DEFAULT_NAME }))
export const setName = handler.action<{ name: string }>('SET_CUSTOM_NAME', (state, action) => ({ ...state, name: action.payload.name }))

export const getDefaultName = handler
  .promise('GET_DEFAULT_NAME')
  .call(a => Promise.resolve('Lisa'))
  .pending(state => ({ ...state, loading: true }))
  .fulfilled((state, a) => ({ ...state, name: a.payload }))
  .finally((state, a) => ({ ...state, loading: false }))
  .build()

export const getName = handler
  .promise<{ corp: string[] }>('GET_CUSTOM_NAME')
  .call(a => Promise.resolve(a.corp).then(x => ({ name: x.join('') })))
  .pending(state => ({ ...state, loading: true }))
  .fulfilled((state, a) => ({ ...state, name: a.payload.name, corp: a.args.corp }))
  .finally(state => ({ ...state, loading: false }))
  .build()

export const getCatch = handler
  .promise('GET_ERROR')
  .call(() => Promise.resolve()
    .then<Error>(() => { throw new Error() }))
  .pending(state => ({ ...state, loading: true }))
  .rejected(state => ({ ...state, name: '[Rejected]' }))
  .finally(state => ({ ...state, loading: false }))
  .build()

export const lib = handler.buildReducer()