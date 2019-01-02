# redux-handler

Powerful and simple redux middleware to handle RxJS Observables. Forget about the difficulty with redux. Designed for large projects.

Out of the box handles **RxJS Observable** and **Promise**.

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
  - [Sync actions](#sync-actions)
  - [Operators](#operators)
    - [rx](#rx)
    - [promise](#promise)
    - [available](#available)
    - [pending](#pending)
    - [fulfilled](#fulfilled)
    - [rejected](#rejected)
    - [completed](#completed)
    - [loading](#loading)
  - [Advanced](#advanced)
    - [Handle action in another handler](#handle-action-in-another-handler)
    - [Redux devtools](#redux-devtools)
  - [Example](#example)

## Requirements

peer dependencies:
 - redux: ^4

optional dependencies:
 - rxjs: ^6

## Installation

```ts
// Define your inner stores
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
  .sync(s => ({ ...s, counter: s.value + 1 }))
```

#### With args

```ts
const addCustom = myHandler
  .action<{ amount: number }>()
  .sync((s, { args }) => ({ ...s, counter: s.value + args.amount }))
```

### Operators

<a id="rx"></a>

```ts
/**
 * Handles rxjs observable.
 */
rx(fn: (args: A, injects: { getState: () => RootStore, action$: Observable<Action>, type: string }) => Observable)
```

<a id="promise"></a>

```ts
/**
 * Handles the promise.
 */
promise(fn: (args: A, injects: { getState: () => RootStore, type: string }) => PromiseLike<T>) {
```

<a id="available"></a>

```ts
/**
 * Prevents calling async operators based on state.
 * Can be used only before main operator such `rx` or `promise`.
 */
available(fn: (getState: () => RootStore, other: { args: TArgs, type: string })
```

<a id="pending"></a>

```ts
/**
 * Occurs before async method is called.
 */
pending(hr: (state: Readonly<Store>, action: { args: TArgs, type: string }))
```

<a id="fulfilled"></a>

```ts
/**
 * Occurs on async method succeeds.
 */
fulfilled(hr: (state: Readonly<Store>, action: { payload: TPayload, args: TArgs, type: string }))
```

<a id="rejected"></a>

```ts
/**
 * Occurs on async method failed.
 */
rejected(hr: (state: Readonly<Store>, action: { error: any, args: TArgs, type: string }))
```

<a id="completed"></a>

```ts
/**
 * Occurs after async method is completed.
 */
completed(hr: (state: Readonly<Store>, action: { args: TArgs, type: string }))
```

<a id="loading"></a>

```ts
/**
 * Sets the property = `true` on pending.
 * Sets the property = `false` on completed.
 */
loading(prop: keyof S)
```

### RxJS

```ts
export const fetchData = myHandler
  .action()
  .pipe(
    // Optional `available` operator
    rx(args => ajax(...)),
    // Effects operators
  )
```

### Advanced

#### Handle action in another handler

```ts
const h1 = handler<Handler1>()
const h2 = handler<Handler2>()

const action = h1
  .action()
  .sync(...)

const actionAsync = h1
  .action()
  .pipe(...)

h2.handle(
  action,
  (state, action) => (...)
)

h2.handle(
  actionAsync,
  // ...operators[]
)
```

#### Redux devtools

```ts
import { actionSanitizer } from 'redux-handler/utils'

const composeEnhancers: typeof compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ actionSanitizer })
  : compose

export const store = createStore(reducer, composeEnhancers(...composes))
```

### Example

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
    rx(({ limit }) => ajax({ url: `/users?limit=${limit}` })),
    fulfilled((s, { payload }) => ({ ...s, data: payload })),
    loading('loading')
  )
```

Dispatch another action inside action:

```ts
export const updateUsersBalance = usersHandler
  .action()
  .sync(s => ({ ...s, balance: s.users.reduce((a, b) => a + b.balance, 0) }))

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

## Development

### Publishing

`npm run build`\
`npm publish dist`