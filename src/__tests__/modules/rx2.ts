import { handler } from '../..'
import { RootStore } from '../store'
import { baseRx } from './rx'
import { fulfilled, pending } from '../../operators'

export interface RxStoreB {
  pending2?: string
  fulfilled2?: string
}

export const rxHandler2 = handler<RxStoreB, RootStore>({})

rxHandler2
  .handle(
    baseRx,
    pending((s, a) => ({ ...s, pending2: a.args.data })),
    fulfilled((s, a) => ({ ...s, fulfilled2ed: a.args.data + a.payload.result }))
  )