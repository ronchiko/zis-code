# zis-code

Makes Claude Code say "Zis" instead of "Claude".

There are two independent ways to do this. You can install either one, or both:

|  | Plugin (`mod/zis-mode/`) | Wrapper (`wrapper/`) |
| --- | --- | --- |
| **How it works** | Claude Code hooks swap the text before it is drawn | Runs Claude Code in a pseudo-terminal and rewrites its output |
| **Replies and interface text** | Yes | Yes |
| **Startup banner and window title** | No | Yes |
| **How you start it** | Run `claude` as usual | Run `zis` instead of `claude` |
| **On/off switch** | `/zis` | Run `claude` when you want the original |

Both match the exact word `Claude`, so `claude` in lowercase stays as it is. Window titles are the exception: the wrapper changes both spellings there.

## Requirements

- [Claude Code](https://claude.com/claude-code)
- Git
- [Node.js](https://nodejs.org) and npm (wrapper only)

The install steps below are for PowerShell on Windows. Start by cloning the repository somewhere permanent:

```powershell
git clone https://github.com/ronchiko/zis-code.git
cd zis-code
```

## Install the plugin

Claude Code loads the plugin directly from your clone, so keep the folder where it is.

1. Add this to `%USERPROFILE%\.claude\settings.json`, using the full path to your clone. If the file already has an `env` block, add the line to it.

   ```json
   {
     "env": {
       "CLAUDE_CODE_PLUGIN_DIRS": "C:/path/to/zis-code/mod/zis-mode"
     }
   }
   ```

2. Start a new `claude` session. The status line shows `Zis mode`.

Type `/zis` to turn it off or back on. The setting is remembered between sessions.

To try the plugin for one session without changing any settings, run `claude --plugin-dir mod/zis-mode`.

## Install the wrapper

1. Copy the program to `~\.zis` and install its dependency:

   ```powershell
   New-Item -ItemType Directory -Force "$HOME\.zis"
   Copy-Item wrapper\zis.mjs, wrapper\rewrite.mjs, wrapper\package.json, wrapper\package-lock.json "$HOME\.zis"
   Push-Location "$HOME\.zis"; npm install; Pop-Location
   ```

2. Copy the launcher to a folder on your `PATH`. Claude Code's native installer already uses this one:

   ```powershell
   Copy-Item wrapper\zis.cmd "$HOME\.local\bin"
   ```

3. Run `zis` in place of `claude`. It passes all arguments through, so `zis --continue` works the same way.

The wrapper expects Claude Code at `~\.local\bin\claude.exe`. If yours is somewhere else, set `ZIS_CLAUDE` to the path of the executable.

The wrapper has only been set up on Windows. `zis.cmd` and the default path are both Windows-specific, so on another system you would need your own launcher and `ZIS_CLAUDE`.

## Update

Run `git pull` in your clone, then:

- **Plugin:** nothing else to do. Sessions that are already running reload it automatically.
- **Wrapper:** repeat step 1 of the install, because `zis` runs the copy in `~\.zis` and not the one in your clone.

## Uninstall

- **Plugin:** remove `CLAUDE_CODE_PLUGIN_DIRS` from `settings.json`.
- **Wrapper:** delete `~\.zis` and `~\.local\bin\zis.cmd`.

## Development

Run `npm install` in `wrapper/` first, then:

```sh
node wrapper/test.mjs                # wrapper tests
node wrapper/zis.mjs                 # run the wrapper from the repo
claude plugin test mod/zis-mode      # plugin tests
claude plugin validate mod/zis-mode  # check the plugin manifest and hooks
```

The two versions share no code, so a change to the swapping behaviour usually has to be made in both. [CLAUDE.md](CLAUDE.md) describes the architecture.
