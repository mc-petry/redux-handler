import { thunk, sync } from '../../operators'
import { handler } from '../handler'

export interface ThunkStore {
  loading?: boolean
  data?: string
  stored: string
}

export const thunkHandler = handler<ThunkStore>({
  stored: 'Avengers'
})

const preload = thunkHandler
  .action()
  .pipe(
    sync(s => ({ ...s, loading: true }))
  )

const setdata = thunkHandler
  .action<{ data: string }>()
  .pipe(
    sync((s, { args }) => ({ ...s, data: args.data }))
  )

export const getAsyncName = thunkHandler
  .action<{ episode: number }>()
  .pipe(
    thunk(({ dispatch, getState, args }) => {
      dispatch(preload())

      Promise.resolve()
        .then(() => {
          const state = getState().thunk
          dispatch(setdata({ data: `${state.stored} ${args.episode}: Thanos` }))
        })
    })
  )