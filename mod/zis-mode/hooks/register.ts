import type { Register, TurnStepChunk } from 'claude-code'

const FROM = 'Claude'
const TO = 'Zis'
const ENABLED = 'enabled'

// Props that address things rather than show text: left as they are.
const ADDRESS = /(^|_)(id|ref|key|href|path)$|Id$|Path$/

// The longest tail of `text` that could still grow into FROM in the next chunk.
const heldTail = (text: string) => {
  for (let n = Math.min(FROM.length - 1, text.length); n > 0; n--) {
    if (FROM.startsWith(text.slice(-n))) return n
  }
  return 0
}

// Every shown string in `value`, with FROM swapped for TO.
const swap = (value: unknown, key = ''): unknown => {
  if (typeof value === 'string') return ADDRESS.test(key) ? value : value.split(FROM).join(TO)
  if (Array.isArray(value)) return value.map(v => swap(v))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, swap(v, k)]))
  }
  return value
}

export const register: Register = on => {
  // Mirrors the stored setting; session.start refills it after a reload.
  let enabled = true

  on('session.start', async ($, e, next) => {
    enabled = (await $.store.get(ENABLED)) !== false
    await $.command.register({ name: 'zis', description: 'Toggle Zis mode (Claude → Zis)' })
    $.ui.status(enabled ? 'Zis mode' : undefined)
    return next(e)
  })

  on('command.run', { command: 'zis' }, async $ => {
    enabled = (await $.store.get(ENABLED)) === false
    await $.store.set(ENABLED, enabled)
    $.ui.status(enabled ? 'Zis mode' : undefined)
    return { text: `Zis mode ${enabled ? 'on' : 'off'}.` }
  })

  // The terminal's own text: messages, spinner, notices, hints, tool rows.
  on('ui.render', ($, e, next) =>
    enabled ? next({ ...e, props: swap(e.props) as typeof e.props }) : next(e),
  )

  on('turn.step', async function* ($, e, next) {
    if (!enabled) return yield* next(e)

    const stream = next(e)
    // Text held back per block because it may be the start of a split "Claude".
    const pending = new Map<number, string>()

    const flush = function* (): Generator<TurnStepChunk> {
      for (const [index, text] of pending) {
        if (text) yield { kind: 'text', index, text }
      }
      pending.clear()
    }

    for await (const chunk of stream) {
      if (chunk.kind !== 'text') {
        yield* flush()
        yield chunk
        continue
      }
      const text = ((pending.get(chunk.index) ?? '') + chunk.text).split(FROM).join(TO)
      const keep = heldTail(text)
      pending.set(chunk.index, text.slice(text.length - keep))
      const out = text.slice(0, text.length - keep)
      if (out) yield { ...chunk, text: out }
    }
    yield* flush()

    return stream.result
  })
}
