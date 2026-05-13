# claude-notify

**Stop babysitting your terminal.** Get native macOS notifications when Claude Code finishes, needs permission, or has a question. Respond directly from the notification without switching windows.

## Install

```bash
npm install -g @alinrj/claude-notify
claude-notify setup
```

That's it. `setup` installs the native notifier app and wires up Claude Code hooks automatically.

On first run, macOS will ask to allow notifications — approve once and forget about it.

## What it does

- **Banners when Claude finishes** — no more checking the terminal
- **Allow/Deny buttons** — approve tool use right from the notification
- **Answer dropdowns** — pick from Claude's options without switching windows
- **Smart suppression** — if you're already looking at the terminal, no notification fires

### Permission requests

Approve or deny tool use directly from the notification — no need to switch windows.

![Permission notification with Allow/Deny buttons](https://raw.githubusercontent.com/alinrj/claude-notification/main/assets/permission-notification.png)

### Task completed

A simple banner when Claude finishes. Click it to jump back to the terminal.

![Claude stopped notification](https://raw.githubusercontent.com/alinrj/claude-notification/main/assets/stop-notification.png)

### Questions with options

When Claude asks a question, pick your answer from a dropdown right in the notification.

![Question notification with multiple options](https://raw.githubusercontent.com/alinrj/claude-notification/main/assets/question-notification.png)

## How it behaves

- **Terminal focused?** No notification. You're already there.
- **Clicked Allow/Deny?** Response sent silently. Terminal stays in background.
- **Clicked the notification body?** Terminal comes to front.
- **Timed out or dismissed?** Terminal focuses so you can respond there.

## Configuration

### Sounds

Override the notification sound with `-s`:

```bash
claude-notify notify -m "Done" -s Ping
```

Available: `default`, `Basso`, `Blow`, `Bottle`, `Frog`, `Funk`, `Glass`, `Hero`, `Morse`, `Ping`, `Pop`, `Purr`, `Sosumi`, `Submarine`, `Tink`.

### Path display (`CLAUDE_NOTIFY_PATH_DISPLAY`)

Controls how file paths appear in permission notifications (e.g. when Claude wants to edit a file).

| Value | Example | When to use |
|---|---|---|
| `relative` | `src/hooks/permission.ts` | Default — shows path from project root |
| `filename` | `permission.ts` | When you work in deep directories and want less noise |
| `full` | `/Users/you/project/src/hooks/permission.ts` | When you work across multiple projects simultaneously |

**Where to set it:** Add it as an environment variable in your hook command inside `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PermissionRequest": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "CLAUDE_NOTIFY_PATH_DISPLAY=filename claude-notify permission -s Basso" }]
      }
    ]
  }
}
```

You can also export it in your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export CLAUDE_NOTIFY_PATH_DISPLAY=filename
```

## Setup details

`claude-notify setup` is idempotent — run it again and it skips what's already configured. It never overwrites your existing hooks.

<details>
<summary>What it writes to ~/.claude/settings.json</summary>

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

## Supported terminals

Ghostty, iTerm2, VS Code, Cursor, IntelliJ (JetBrains), Warp, Terminal.app, Alacritty, Kitty.

Detection is automatic via environment variables — no configuration needed.

## Requirements

- macOS 13.0+
- Node.js >= 18

## License

MIT
