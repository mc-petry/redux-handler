# redux-handler

Powerful and simple redux middleware via RxJS. Forget about the difficulty with redux. Designed for large projects. Use it with TypeScript for full intellisense.

peerDependencies: redux v4, rxjs v6

## Installation

```ts
// Definer your inner stores
interface RootStore {
  inner: InnerStore
}

// Combine it
const reducer = combineHandlers<RootStore>({
  inner: innerHandler
})
  .buildReducer({
    // Other reducers if needs
    // For example: `router: RouterState`
  })

const store = createStore(reducer, applyMiddleware(handlerMiddleware()))
```

## Usage

Define store & handler:

```ts
interface Store {
  counter: number
}

const myHandler = handler<Store>({ counter: 0 })
```

### Sync actions

```ts
const add = myHandler
  .action() // .action('ACTION_NAME') for explicit name
  .handle(s => ({ ...s, counter: s.value + 1 }))
```

#### With args

```ts
const addCustom = myHandler
  .action<{ amount: number }>()
  .handle((s, { args }) => ({ ...s, counter: s.value + args.amount }))
```

### Async actions:

```ts
/**
 * Prevents call async operators based on state
 */
available(fn: (getState: () => RootStore, other: { args: TArgs, type: string })
```

```ts
/**
 * Occurs before async method is called
 */
pending(hr: (state: Readonly<Store>, action: { args: TArgs, type: string }))
```

```ts
/**
 * Occurs on async method succeeds
 */
fulfilled(hr: (state: Readonly<Store>, action: { payload: TPayload, args: TArgs, type: string }))
```

```ts
/**
 * Occurs on async method failed
 */
rejected(hr: (state: Readonly<Store>, action: { error: any, args: TArgs, type: string }))
```

```ts
/**
 * Occurs after async method is completed
 */
completed(hr: (state: Readonly<Store>, action: { args: TArgs, type: string }))
```

```ts
/**
 * On 'pending' sets property to `true`
 * On 'completed' sets property to `false`
 */
loading(prop: keyof S)
```

### RxJS

```ts
export const fetchData = myHandler
  .action()
  .pipe(
    rx(args => ajax()),
    // ... Your operators
  )
```

#### Example

Simple users fetch:

```ts
export interface UsersStore {
  data?: any[]
  loading?: boolean
}

export const usersHandler = handler<UsersStore>({})

export const fetchUsers = usersHandler
  .action<{ limit: number }>()
  .pipe(
    available((getState, { args }) => getState().users.data),
    rx(({ limit }) => ajax({ url: `/users?limit${limit}` })),
    fulfilled((s, { payload }) => ({ ...s, data: payload })),
    loading('loading')
  )
```

Dispatch another action inside action:

```ts
export const updateUsersBalance = usersHandler
  .action()
  .handle(s => ({ ...s, balance: s.users.reduce((a, b) => a + b.balance, 0) }))

export const fetchUsers = usersHandler
  .action()
  .pipe(
    rx(
      () => concat(
        ajax(),
        of(updateUsersBalance())
      )
    )
  )
```