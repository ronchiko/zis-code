# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Two independent ways of showing "Zis" instead of "Claude" in Claude Code. They share no code, so a change to the swapping behaviour usually has to be made in both.

- `mod/zis-mode/`: a Claude Code plugin. It works through engine hooks, and `/zis` toggles it.
- `wrapper/`: a Node program that runs Claude Code in a pseudo-terminal and rewrites its output bytes. This also reaches text that hooks don't, such as the banner and window title.

## Commands

Wrapper (run `npm install` in `wrapper/` first):

```sh
node wrapper/test.mjs       # rewrite.mjs assertions; no framework or name filter
node wrapper/snap.mjs       # runs real Claude Code for 10s, prints Claude counts before/after and the rewritten screen
node wrapper/zis.mjs        # runs the wrapper from the repo; ZIS_CLAUDE overrides the claude binary path
```

Plugin:

```sh
claude plugin test mod/zis-mode       # runs every *.test.ts; there is no single-test option
claude plugin validate mod/zis-mode
claude --plugin-dir mod/zis-mode      # start a session with the plugin loaded
tsc -p mod/zis-mode                   # only after the engine has loaded the plugin (see below)
```

`mod/zis-mode/tsconfig.json` extends `.claude-plugin/types/tsconfig.json`, which the engine generates when it loads the plugin. It is not in the repo, so `tsc` fails on a fresh checkout until then.

## Architecture

### Plugin (`mod/zis-mode/hooks/register.ts`)

- `ui.render` deep-swaps the props of everything the terminal draws, but skips props named like addresses (`ADDRESS`: ids, refs, keys, hrefs, paths) so that references keep working.
- `turn.step` swaps streamed model text. "Claude" can be split across chunks, so it holds back any tail that could grow into the word, per block index, and flushes that on a non-text chunk or at the end of the stream.
- The on/off setting lives in `$.store`. The module's `enabled` variable only mirrors it, and `session.start` refills it after a reload.

### Wrapper (`wrapper/`)

- `rewrite.mjs` is the pure core. `rewrite(text)` returns `{ out, held }`, and the caller prepends `held` to the next chunk. It holds back incomplete escape sequences and tails that could become "Claude".
- `zis.mjs` handles the PTY and terminal I/O. A 15ms timer flushes held text through `swap` so it can't get stuck when nothing follows it.
- Plain text is padded with spaces back to its original width, because "Zis" is shorter than "Claude" and later text is placed by column. Tests expect this padding (`'Hi Zis   \r\n'`).
- Escape sequences get the swap without padding. Window titles (OSC 0/1/2) also change lowercase `claude` to `zis`.

## Installed copy

`wrapper/zis.cmd` runs `%USERPROFILE%\.zis\zis.mjs`, not the repo's copy. Changes under `wrapper/` don't reach the `zis` command until they are copied to `~/.zis`.
