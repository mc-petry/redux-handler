import { handler } from '../..'

export interface SyncAStore {
  prop?: string
  propArg?: string
}

export const syncAHandler = handler<SyncAStore>({})

export const baseSync = syncAHandler
  .action()
  .handle(s => ({ ...s, prop: 'green' }))

export const baseSyncWithArgs = syncAHandler
  .action<{ data: string }>()
  .handle((s, a) => ({ ...s, propArg: a.args.data }))