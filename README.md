# redux-handler

Powerful :muscle: and simple :point_left: redux middleware to handle async actions.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Operators](#operators)
  - [Main](#main)
    - [sync](#sync)
    - [rx](#rx)
    - [promise](#promise)
    - [thunk](#thunk)
  - [Async](#async)
    - [pending](#pending)
    - [fulfilled](#fulfilled)
    - [rejected](#rejected)
    - [completed](#completed)
    - [loading](#loading)
  - [Common](#common)
    - [available](#available)  
    
  - [Advanced](#advanced)
    - [Handle action in another handler](#handle-action-in-another-handler)
    - [Redux devtools](#redux-devtools)
  - [Example](#example)

## Requirements

peer dependencies: redux: ^4\
optional dependencies: rxjs: ^6

## Installation

__store/index.ts__
```ts
// Define your inner stores
interface RootStore {
  inner: InnerStore
}

// Combine it
const reducer = combineHandlers<RootStore>({
  inner: innerHandler
})

const store = createStore(reducer.buildReducer(), applyMiddleware(handlerMiddleware()))
```

__store/handler.ts__
```ts
export const { handler } = create<RootStore>()
```

## Usage

Define store & handler:

```ts
interface Store {
  counter: number
}

const myHandler = handler<Store>({ counter: 0 })

// Create action
const myAction = myHandler
  .action() // For arguments use `.action<TArgs>`
  .pipe(
    // Operators
  )
```

## Operators

Each pipe must contain single [main](#main) operator

### Main

#### sync

Handles standard action handler.
Compatible operators: [Common](#common)

```ts
sync((state, { args, type }) => typeof state)
```


#### rx

Handles rxjs observable.
Compatible operators: [Common](#common), [Async](#async)

```ts
rx((args, { action$, getState, type }) => Observable)
```


#### promise

Handles promise.
Compatible operators: [Common](#common), [Async](#async)

```ts
promise((args, { getState, type }) => Promise)
```


#### thunk

Handles async dispatch.
Compatible operators: [Common](#common)

```ts
thunk({ dispatch, getState, args } => void)
```


### Async


#### pending

Occurs before async method is called.

```ts
pending((state, { args, type }) => void)
```


#### fulfilled

Occurs on async method succeeds.

```ts
fulfilled((state, { payload, args, type }) => typeof state)
```


#### rejected

Occurs on async method failed.

```ts
rejected((state, { error, args, type }) => typeof state)
```


#### completed

Occurs after async method is completed.

```ts
completed((state, { args, type }) => typeof state)
```


#### loading

Sets the property = `true` on pending.
Sets the property = `false` on completed.

```ts
loading(prop: keyof state)
```


### Common

#### available

Prevents calling actions based on state.
Can be used only before main operator.

```ts
available((getState, { args, type }) => boolean)
```


### Advanced

#### Handle action in another handler

```ts
myHandler.handle(
  myAction,
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

### Examples

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
  .pipe(
    sync(s => ({ ...s, balance: s.users.reduce((a, b) => a + b.balance, 0) }))
  )

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