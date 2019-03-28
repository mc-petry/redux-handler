import { sync } from '../../operators'
import { handler } from '../handler'

export interface SyncAStore {
  prop?: string
  propArg?: string
  union?: string
}

export const syncAHandler = handler<SyncAStore>({})

export const baseSync = syncAHandler
  .action()
  .pipe(sync(s => ({ ...s, prop: 'green' })))

export const baseSyncWithArgs = syncAHandler
  .action<{ data: string }>()
  .pipe(sync((s, a) => ({ ...s, propArg: a.args.data })))

export const testUnionArgs = syncAHandler
  .action<{ data: string } | { value: string }>()
  .pipe(sync((s, a) => {
    const value = ('data' in a.args)
      ? (a.args as { data: string; }).data
      : (a.args as { value: string; }).value

    return ({
      ...s,
      union: (s.union || '') + value
    })
  }))