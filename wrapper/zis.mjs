// Runs Claude Code in a pseudo-terminal and shows everything it draws with
// "Claude" swapped for "Zis": banner, prompts, menus, window title, replies.
import { spawn } from '@lydell/node-pty'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { rewrite, swap } from './rewrite.mjs'

const CLAUDE = process.env.ZIS_CLAUDE ?? join(homedir(), '.local', 'bin', 'claude.exe')

const child = spawn(CLAUDE, process.argv.slice(2), {
  name: 'xterm-256color',
  cols: process.stdout.columns || 120,
  rows: process.stdout.rows || 30,
  cwd: process.cwd(),
  env: process.env,
})

let pending = ''
let timer
const flush = () => {
  clearTimeout(timer)
  if (pending) process.stdout.write(swap(pending))
  pending = ''
}

child.onData(data => {
  clearTimeout(timer)
  const { out, held } = rewrite(pending + data)
  pending = held
  if (out) process.stdout.write(out)
  // Something held that nothing follows is shown after a moment, not stuck.
  if (pending) timer = setTimeout(flush, 15)
})

if (process.stdin.isTTY) process.stdin.setRawMode(true)
process.stdin.on('data', data => child.write(data.toString()))
process.stdout.on('resize', () => child.resize(process.stdout.columns, process.stdout.rows))

child.onExit(({ exitCode }) => {
  flush()
  if (process.stdin.isTTY) process.stdin.setRawMode(false)
  process.exit(exitCode)
})
