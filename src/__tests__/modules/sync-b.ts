import { sync } from '../..'
import { baseSyncWithArgs } from './sync-a'
import { handler } from '../handler'

export interface SyncBStore {
  handle?: string
}

export const syncBHandler = handler<SyncBStore>({})

export const fromAnother = syncBHandler
  .on(baseSyncWithArgs, sync((s, a) => ({ ...s, handle: a.args.data })))