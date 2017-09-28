import { Handler } from '../../'
import { Store } from '../store'
import { Observable } from 'rxjs'

export const DEFAULT_NAME = 'Jesica'
export const CUSTOM_NAME = 'Veronica'

export interface LibraryStore {
  name?: string
  name2?: string
  data?: string[]
  loading?: boolean
  const: string
  corp: string[]
  pending?: boolean

  obsPending?: boolean
  obsFulfilled?: string
  obsRejected?: boolean
  obsFinally?: boolean
  obsFinallyRejected?: boolean
  obsNotCancelled?: boolean

  multiple1?: boolean
  multiple2?: boolean
  multiple3?: boolean

  multipleResult: string
  obsEmptyPayload?: null
}

const handler = new Handler<LibraryStore>({ const: 'INIT', corp: null, multipleResult: '' }, { prefix: 'library' })

export const setDefaultName = handler.action('SET_DEFAULT_NAME', state => ({ ...state, name: DEFAULT_NAME }))
export const setName = handler.action<{ name: string }>('SET_CUSTOM_NAME', (state, action) => ({ ...state, name: action.payload.name }))

export const getDefaultNameChain = handler
  .promise('GET_DEFAULT_NAME')
  .call(a => Promise.resolve('Lisa'))
  .pending(state => ({ ...state, loading: true }))
  .fulfilled((state, a) => ({ ...state, name: a.payload }))
  .finally((state, a) => ({ ...state, loading: false }))

export const getDefaultName = getDefaultNameChain.build()

export const getName = handler
  .promise<{ corp: string[] }>('GET_CUSTOM_NAME')
  .call(a => Promise.resolve(a.corp).then(x => ({ name: x.join('') })))
  .pending(state => ({ ...state, pending: true }))
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

export const notCatched = handler
  .promise('NOT_CATCHED_PROMISE')
  .call(() => Promise.resolve('').then(() => {
    throw new Error('Rejected')
  }))
  .build()

export const obs = handler
  .observable<{ withError?: boolean }>('TEST_OBS1')
  .call((a) => {
    return Observable.of({ name: 'John' })
      .delay(10)
      .do(() => {
        if (a.withError)
          throw new Error('RxJS.Err')
      })
  })
  .pending(s => ({ ...s, obsPending: true }))
  .fulfilled((s, a) => ({ ...s, obsFulfilled: a.payload.name }))
  .rejected((s, a) => ({ ...s, obsRejected: true }))
  .finally((s, a) => {
    if (!a.args.withError)
      return ({ ...s, obsFinally: true })
    else
      return ({ ...s, obsFinallyRejected: true })
  })
  .build()

export const obsCancel = handler.action('TEST_OBS_CANCEL', s => s)

export const obsCancelled = handler
  .observable('TEST_OBS_CANCELLED')
  .call((_, { action$ }) =>
    Observable.of({ test: '123' })
      .delay(200)
      .takeUntil(action$.filter(x => x.type === obsCancel.type)))
  .fulfilled((s) => ({ ...s, obsNotCancelled: true }))
  .build()

export const obsMultiple1 = handler.action('M1', s => ({ ...s, multiple1: true }))
export const obsMultiple2 = handler.action('M2', s => ({ ...s, multiple2: true }))
export const obsMultiple3 = handler.action('M3', s => ({ ...s, multiple3: true }))

export const obsMultipleActions = handler
  .observable('TEST_OBS_MULTIPLE')
  .call(() =>
    Observable.of(obsMultiple1()).delay(10)
      .concat(Observable.of(obsMultiple2()))
      .concat(Observable.of({ a1: 'Lo' }).delay(10))
      .concat(Observable.of({ a1: 'dash' }).delay(10))
      .concat(Observable.of(obsMultiple3()).delay(10)))
  .fulfilled((s, a) => ({ ...s, multipleResult: s.multipleResult + (a.payload as any).a1 }))
  .build()

export const obsEmptyPayloadAction = handler
  .observable('TEST_OBS_EMPTY_PAYLOAD')
  .call(() =>
    Observable.of({ type: 'test' })
      .concat(Observable.of(null)))
  .fulfilled((s, a) => ({ ...s, obsEmptyPayload: a.payload }))
  .build()

export const lib = handler.buildReducer()