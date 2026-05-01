# claude-notify

**Stop babysitting your terminal.** Let Claude Code work in the background — get a native macOS notification the moment it finishes, needs your permission, or has a question. Respond directly from the notification without ever switching windows.

---

### The problem

You kick off a task in Claude Code, switch to Slack or your browser, and now you're stuck polling the terminal to see if Claude is done — or worse, it's been blocked for 5 minutes waiting for you to click "Allow".

### The solution

`claude-notify` bridges Claude Code to macOS Notification Center. You get:

**Banners when Claude finishes** — stop checking, start getting pinged.

**Interactive Allow/Deny buttons** — approve tool use from the notification itself. Claude continues instantly without you context-switching.

**Answer dropdowns** — when Claude asks a question with options, pick one right from the notification banner. The answer flows back and Claude keeps working.

**Smart focus suppression** — if you're already looking at the terminal, no notification fires. No spam.

---

## Quick Start

```bash
npm install -g @arujoiumare/claude-notify
claude-notify setup
```

Done. Two commands. The `setup` handles everything: installs the native macOS notifier app and wires up the Claude Code hooks.

Verify it works:

```bash
claude-notify test
```

> macOS will ask to allow notifications on first run — approve it once and forget about it.

## What Gets Notified

| Event | You see | You can do |
|---|---|---|
| Claude finishes | "Claude stopped" banner | Click to jump back to terminal |
| Plan ready | "Plan ready for review" banner | Click to review |
| Tool needs permission | Allow / Deny buttons | Approve without switching windows |
| Claude asks a question | Dropdown with options | Pick an answer inline |

### Permissions — the killer feature

Claude wants to run `rm -rf /tmp/build`? You get a notification with the exact command and two buttons. Tap **Allow** and Claude continues instantly. Tap **Deny** and it backs off. No window switching, no context loss.

For questions with multiple choices, you get a dropdown right in the notification. Select an option → answer flows back → Claude keeps working. You never left your browser.

### It stays out of your way

- **Terminal focused?** No notification. You're already there.
- **Clicked Allow/Deny?** Response sent silently. Terminal stays in background.
- **Clicked the notification body?** Terminal comes to front.
- **Ignored it for 30s?** Disappears quietly. Falls back to terminal prompt.
- **Dismissed without choosing?** Terminal focuses so you can respond there.

## Install

### npm (recommended — no Xcode, no compilation, nothing)

```bash
npm install -g @arujoiumare/claude-notify
claude-notify setup
```

The package ships a pre-built universal binary (~400KB). Works on Apple Silicon and Intel. No build tools required on your machine.

### From source (for contributors)

```bash
git clone <repo>
cd claude-notify
npm install && npm run build && npm link
claude-notify setup
```

### Fallback: alerter

If you'd rather not use the native notifier, `claude-notify` can fall back to [alerter](https://github.com/vjeantet/alerter):

```bash
brew install vjeantet/tap/alerter
```

Tradeoff: no custom icon, notifications vanish on timeout instead of staying in Notification Center.

## Setup

`claude-notify setup` does everything:

1. Installs `ClaudeNotifier.app` to `~/.claude/`
2. Adds hook entries to `~/.claude/settings.json`

It's idempotent — run it again and it skips what's already there. It never overwrites your existing hooks.

<details>
<summary>What it writes to settings.json</summary>

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "ExitPlanMode",
        "hooks": [{ "type": "command", "command": "claude-notify notify -m 'Plan ready for review'" }]
      }
    ],
    "PermissionRequest": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "claude-notify permission -s Basso" }]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "claude-notify notify -m 'Claude stopped'" }]
      }
    ]
  }
}
```

</details>

### Uninstall

```bash
claude-notify setup --uninstall
```

Removes the app and hook entries. Your other settings stay untouched.

## Usage

The CLI is designed to be called by Claude Code hooks, but you can use it directly:

```bash
# Send a notification banner
claude-notify notify -m "Task complete" -s Ping

# Interactive permission dialog (reads JSON from stdin)
echo '{"tool_name":"Bash","tool_input":{"command":"npm test"}}' | claude-notify permission -s Basso

# Test notification
claude-notify test

# Version
claude-notify version
```

### Backward-compatible syntax

Positional args still work for migration from shell scripts:

```bash
claude-notify "Claude stopped" default
```

## Configuration

### Sounds

Override the notification sound with `-s`:

```bash
claude-notify notify -m "Done" -s Ping
```

Available macOS sounds: `default`, `Basso`, `Blow`, `Bottle`, `Frog`, `Funk`, `Glass`, `Hero`, `Morse`, `Ping`, `Pop`, `Purr`, `Sosumi`, `Submarine`, `Tink`.

### Path display

File paths in permission notifications can be configured via `CLAUDE_NOTIFY_PATH_DISPLAY`:

| Value | Example | Description |
|---|---|---|
| `relative` | `src/hooks/permission.ts` | From project root (default) |
| `filename` | `permission.ts` | File name only |
| `full` | `/Users/you/project/src/hooks/permission.ts` | Absolute path |

Set it in your hook command:

```json
{ "command": "CLAUDE_NOTIFY_PATH_DISPLAY=filename claude-notify permission -s Basso" }
```

### Custom icon

Replace `native-notifier/Resources/AppIcon.icns` with your own `.icns` file and rebuild:

```bash
npm run build:notifier
claude-notify setup
```

## Supported Terminals

Ghostty, iTerm2, VS Code, Cursor, IntelliJ (JetBrains), Warp, Terminal.app, Alacritty, Kitty.

Terminal detection is automatic via environment variables — no configuration needed.

## Under the Hood

- **Zero runtime dependencies** — tsup bundles everything into a single 20KB JS file
- **Native Swift notifier** — uses `UNUserNotificationCenter` for proper Notification Center integration
- **Universal binary** — arm64 + x86_64 via `lipo`, ~200KB
- **Always exits 0** — hooks never break Claude Code, errors go to stderr only
- **Hook protocol** — stdin JSON in, stdout JSON out, exactly matching the Claude Code spec

## Development

```bash
npm install             # install deps
npm run build           # compile → dist/cli.js
npm test                # run vitest
npm run dev             # watch mode
npm run build:notifier  # rebuild native notifier → vendor/
```

<details>
<summary>Project structure</summary>

```
src/
  cli.ts              # Entry point + arg parser
  setup.ts            # Setup/uninstall command
  types.ts            # Shared types and constants
  stdin.ts            # Sync stdin JSON reader
  format-path.ts      # Path display modes
  hooks/
    stop.ts           # Stop/PlanReady handler
    permission.ts     # Allow/Deny + AskUserQuestion handler
  platform/
    base.ts           # Abstract NotificationEngine
    macos.ts          # macOS engine (native notifier / alerter)
    index.ts          # Platform factory
  terminal/
    detect.ts         # Terminal/IDE detection from env vars
    focus.ts          # App activation (osascript)
    terminals.ts      # Terminal registry (bundle IDs)
  output/
    hook-response.ts  # Claude Code hook JSON response builders
native-notifier/
  Sources/            # Swift source files
  Resources/          # Info.plist + AppIcon.icns
  build.sh            # Compile universal binary
vendor/
  ClaudeNotifier.app/ # Pre-built universal .app (ships in npm)
```

</details>

## Roadmap

- [x] Setup command with auto-configuration
- [x] Native macOS notifier with universal binary
- [x] Interactive permission handling
- [ ] `claude-notify doctor` (diagnose notification issues)
- [ ] Windows support (snoretoast)
- [ ] Linux support (notify-send / zenity)

## Requirements

- macOS 13.0+
- Node.js >= 18

## License

MIT
