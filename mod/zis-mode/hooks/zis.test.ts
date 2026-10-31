import { test, expect, mock } from 'claude-code/testing'
import type { On, TurnStepChunk } from 'claude-code'

// The model's side of a step: streams `pieces` as one text block.
const model = (on: On, pieces: string[]) =>
  on('turn.step', async function* () {
    for (const text of pieces) yield { kind: 'text', index: 0, text } as TurnStepChunk
    yield { kind: 'stop', stopReason: 'end_turn', usage: null } as TurnStepChunk
    return { turnId: 't', index: 0, answer: pieces.join(''), toolUses: [], stopReason: 'end_turn', usage: null }
  })

const shown = async ($: any) => {
  let text = ''
  for await (const c of $.turn.step({ turnId: 't', index: 0, model: 'm', messageCount: 1 })) {
    if (c.kind === 'text') text += c.text
  }
  return text
}

test('replaces Claude, even split across chunks', async ($, on) => {
  mock.store(on)
  model(on, ['Hi, I am Cla', 'ude. Claude', ' says Cl'])
  expect(await shown($)).toBe('Hi, I am Zis. Zis says Cl')
})

test('leaves look-alikes alone', async ($, on) => {
  mock.store(on)
  model(on, ['Clam chowder, Clau', 'dia'])
  expect(await shown($)).toBe('Clam chowder, Claudia')
})

test('/zis turns it off', async ($, on) => {
  mock.store(on)
  model(on, ['I am Claude'])
  on('command.run', () => ({ text: '' }))
  await $.command.run({ command: 'zis', args: '', origin: { kind: 'composer' } } as any)
  expect(await shown($)).toBe('I am Claude')
})

test('swaps Claude in what the terminal draws', async ($, on) => {
  mock.store(on)
  let drawn: any
  on('ui.render', ($, e) => {
    drawn = e.props
    return { type: 'Text', children: [String(e.props.text)] } as any
  })
  await $.ui.render({
    component: 'InfoNotice',
    surface: 'terminal',
    requestId: 'n1',
    props: { text: 'Claude is ready', command: null },
  } as any)
  expect(drawn.text).toBe('Zis is ready')
})
