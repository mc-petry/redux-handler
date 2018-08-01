import { handler } from '../..'
import { baseSyncWithArgs } from './sync-a'

export interface SyncBStore {
  handle?: string
}

export const syncBHandler = handler<SyncBStore>({})

export const fromAnother = syncBHandler
  .handle(baseSyncWithArgs, (s, a) => ({ ...s, handle: a.args.data }))