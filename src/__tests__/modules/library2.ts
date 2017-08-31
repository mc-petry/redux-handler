import { Handler } from "../../index";
import { setDefaultName, setName, DEFAULT_NAME } from "./library";

export interface Lib2Store {
  name?: string
}

const handler = new Handler<Lib2Store>({}, { prefix: 'library2' })

handler.handle(setDefaultName, (s, a) => ({ ...s, name: DEFAULT_NAME }))
handler.handle(setName, (s, a) => ({ ...s, name: a.payload.name }))

export const lib2 = handler.buildReducer()