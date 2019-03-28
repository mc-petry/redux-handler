import { create } from '../handler'
import { RootStore } from './store'

export const { handler } = create<RootStore>()