# redux-handler

![redux-handler](/docs/screen.png "redux-handler")

Redux reduce boilerplate library.
Resolves sync, promise and observable actions.
Designed especially to use with **typescript**.

## Usage

### Simple action

Define some store:

```ts
interface UserStore {
  name?: string
}
```

Common action and reducer looks like that:

```ts
const SET_NAME = "app/SET_NAME"

interface SetNameAction extends Action {
  name: number
}

const setName = (name: string): SetNameAction =>
  ({
    type: SET_NAME,
    name
  })

const reducer = (state: UserStore = {}, action: Action) => {
  switch (action.type) {
    case SET_NAME:
      return {
        ...state,
        name: (action as SetNameAction).name
      }
    
    default:
      return state
  }
}
```

But we can do this:

```ts
const handler = new Handler<UserStore>({}, { prefix: "app" })

const setName = handler.sync<{ name: string }>("SET_NAME", (s, a) => ({ ...s, name: a.payload.name }))

const reducer = handler.buildReducer()
```

### Handle promise

```ts
const getName = handler
  .promise('GET_NAME')
  .call(a => Promise.resolve('Lisa'))
  .pending(state => ({ ...state, loading: true }))
  .fulfilled((state, a) => ({ ...state, name: a.payload }))
  .finally((state, a) => ({ ...state, loading: false }))
  .build()
```

### Handle observable

Requires [redux-observable](https://github.com/redux-observable/redux-observable)

```ts
const getName = handler
  .observable<{ userId: string }>('GET_NAME')
  .call(action$ => action$.mergeMap(args => ...))
  ...
```

### Handle action in another handler

```ts
const setDefaultName = handler1.action('SET_DEFAULT_NAME', s => ({ ...s, name: 'default' }))
const setName = handler1.action<{ name: string }>('SET_CUSTOM_NAME', (s, a) => ({ ...s, name: action.payload.name }))

handler2.handle(setDefaultName, (s, a) => ({ ...s, name: DEFAULT_NAME }))
handler2.handle(setName, (s, a) => ({ ...s, name: a.payload.name }))
```

## Installation

1. Add middleware (needs for promises actions only):

```ts
import { handlerMiddleware } from "redux-handler";

...

export const store = createStore(combineReducers<Store>(reducers), applyMiddleware(handlerMiddleware))
```

2. Now you are ready to create your handlers