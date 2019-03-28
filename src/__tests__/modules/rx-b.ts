import { baseRx } from './rx-a'
import { fulfilled, pending } from '../../operators'
import { handler } from '../handler'

export interface RxStoreB {
  pending2?: string
  fulfilled2?: string
}

export const rxHandler2 = handler<RxStoreB>({})

rxHandler2
  .on(
    baseRx,
    pending((s, a) => ({ ...s, pending2: a.args.data })),
    fulfilled((s, a) => ({ ...s, fulfilled2: a.args.data + a.payload.result }))
  )