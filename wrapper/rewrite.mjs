// Swaps "Claude" for "Zis" in terminal output, escape sequences included.
const FROM = 'Claude'
const TO = 'Zis'

// An escape sequence: CSI, OSC (window title and the like), or a two-byte one.
const ESCAPE = /\x1b(?:\[[0-?]*[ -/]*[@-~]|\][^\x07\x1b]*(?:\x07|\x1b\\)|[^[\]])/y
export const swap = text => text.split(FROM).join(TO)
// A window title (OSC 0/1/2) also loses the lowercase name: "claude" -> "zis".
const swapEscape = seq => (/^\x1b\][012];/.test(seq) ? swap(seq).replace(/claude/g, 'zis') : swap(seq))

// Rewrites `text`, returning what can be shown now and what must wait for
// the next chunk (a split escape sequence, or a tail that may become FROM).
export const rewrite = text => {
  let out = ''
  let run = '' // plain text since the last escape or line break
  const endRun = () => {
    const swapped = swap(run)
    // Pad to the old width at the run's end, so text the terminal places by
    // column after it still lands where Claude Code meant it to.
    out += swapped + ' '.repeat(run.length - swapped.length)
    run = ''
  }
  let i = 0
  while (i < text.length) {
    const c = text[i]
    if (c === '\x1b') {
      ESCAPE.lastIndex = i
      const m = ESCAPE.exec(text)
      if (!m) {
        // Incomplete at the chunk's end: wait for the rest.
        endRun()
        return { out, held: text.slice(i) }
      }
      endRun()
      out += swapEscape(m[0])
      i += m[0].length
    } else if (c === '\r' || c === '\n') {
      endRun()
      out += c
      i++
    } else {
      run += c
      i++
    }
  }
  // Hold back a tail of the last run that could grow into FROM.
  let keep = 0
  for (let n = Math.min(FROM.length - 1, run.length); n > 0; n--) {
    if (FROM.startsWith(run.slice(-n))) {
      keep = n
      break
    }
  }
  const held = run.slice(run.length - keep)
  run = run.slice(0, run.length - keep)
  endRun()
  return { out, held }
}
