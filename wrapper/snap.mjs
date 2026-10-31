import { spawn } from '@lydell/node-pty'
import { rewrite } from './rewrite.mjs'
const env = { ...process.env }; delete env.CLAUDECODE; delete env.CLAUDE_CODE_ENTRYPOINT
const p = spawn(process.env.USERPROFILE + '/.local/bin/claude.exe', [], { name: 'xterm-256color', cols: 100, rows: 30, cwd: process.cwd(), env })
let raw = '', shown = '', held = ''
p.onData(d => { raw += d; const r = rewrite(held + d); shown += r.out; held = r.held })
setTimeout(() => { p.kill(); const strip = s => s.replace(/\x1b\[[0-?]*[ -\/]*[@-~]/g, '\n').replace(/\x1b\][^\x07]*\x07/g, m => '\n[TITLE ' + m.slice(4, -1) + ']\n').replace(/\n+/g, '\n')
  console.log('raw Claude count:', (raw.match(/Claude/g) || []).length, ' shown Claude count:', (shown.match(/Claude/g) || []).length)
  console.log(strip(shown).split('\n').filter(l => l.trim()).slice(0, 40).join('\n')); process.exit(0) }, 10000)
