import { handler } from '../..'

export interface SyncStore {
  prop?: string
  propArg?: string
}

export const syncHandler = handler<SyncStore>({})

export const baseSync = syncHandler
  .action()
  .handle(s => ({ ...s, prop: 'green' }))

export const baseSyncWithArgs = syncHandler
  .action<{ data: string }>()
  .handle((s, a) => ({ ...s, propArg: a.args.data }))