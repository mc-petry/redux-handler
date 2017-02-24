# redux-handler

Redux reduce boilerplate library.
Resolves sync and async (promise) actions.
Designed especially to use with **typescript**. Fully intellisense

## Simple

### Sync action

```ts
const syncAction = handler.sync('KEY', s => ({ ...s, name: 'test' }))
```

### Async action

```ts
const asyncAction = handler.async({
  type: 'KEY',
  promise: (args: { name: string }) => Promise.resolve(args.name),
  pending: s => ({ ...s, loading: true }),
  then: (s, a) => ({ ...s, name: a.payload }),
  catch: s => ({ ...s, data: undefined })
  finally: s => ({ ...s, loading: false })
})
```

## Installation

### Reducer (redux/modules/library.ts)

```ts
import { Handler } from 'redux-handler'

export interface IMyStore {
  name?: string
  loading?: boolean
}

export interface IStore {
  my: IMyStore
}

const handler = new Handler<IStore, IMyStore>({}, { prefix: 'myPrefix' })

// Create actions
// ...

export const myReducer = handler.toReducer()
```