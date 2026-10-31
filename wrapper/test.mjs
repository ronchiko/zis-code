import { rewrite } from './rewrite.mjs'
import assert from 'node:assert/strict'
const feed = chunks => { let held = '', all = ''; for (const c of chunks) { const r = rewrite(held + c); all += r.out; held = r.held } return all + held }
assert.equal(feed(['Hi Claude\r\n']), 'Hi Zis   \r\n')
assert.equal(feed(['Hi Cla', 'ude!\n']), 'Hi Zis!   \n')
assert.equal(feed(['\x1b]0;Claude Code\x07x']), '\x1b]0;Zis Code\x07x')
assert.equal(feed(['\x1b]0;Cl', 'aude\x07']), '\x1b]0;Zis\x07')
assert.equal(feed(['Claude\x1b[5;20Hz']), 'Zis   \x1b[5;20Hz')
assert.equal(feed(['Claudia\n']), 'Claudia\n')
console.log('all pass')
assert.equal(feed(['\x1b]0;claude\x07']), '\x1b]0;zis\x07')
