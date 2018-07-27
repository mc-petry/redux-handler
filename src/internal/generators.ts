export function* prefixGenerator() {
  let i = 0

  while (true) {
    yield `scope_${i++}`
  }
}

export function* actionTypeGenerator(prefix: string) {
  let i = 0

  while (true) {
    yield `${prefix}/ACTION_${i++}`
  }
}