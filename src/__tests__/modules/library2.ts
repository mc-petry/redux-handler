import { Handler } from "../../index";
import { setDefaultName, setName, DEFAULT_NAME, getDefaultNameChain } from "./library";

export interface Lib2Store {
  name?: string
  test2?: any
}

const handler = new Handler<Lib2Store>({}, { prefix: 'library2' })

handler.handle(setDefaultName, (s, a) => ({ ...s, name: DEFAULT_NAME }))
handler.handle(setName, (s, a) => ({ ...s, name: a.payload.name }))

handler.handle(getDefaultNameChain)
  .fulfilled((s, a) => ({ ...s, test2: a.payload }))

export const lib2 = handler.buildReducer()