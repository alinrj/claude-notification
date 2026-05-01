# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands

```bash
npm run build          # tsup → dist/cli.js (single CJS bundle with shebang)
npm run dev            # tsup --watch
npm test               # vitest run (all tests)
npx vitest run test/cli.test.ts   # single test file
npx vitest --watch     # interactive watch mode
npx tsc --noEmit       # type-check only (note: known narrowing issue with DEFAULTS.TITLE_PREFIX reassignment)
```

After any source change, `npm run build` must be run for the installed `claude-notify` binary to reflect the update.

## Architecture

This is a CLI tool (`claude-notify`) that sends macOS desktop notifications for Claude Code hooks. It has two main flows:

**Fire-and-forget (Stop/ExitPlanMode hooks):**
`cli.ts` → `handleStop()` → `MacOSEngine.notify()` — spawns a detached `alerter` subprocess and exits immediately. Clicking the notification focuses the terminal via osascript.

**Interactive (PermissionRequest hooks):**
`cli.ts` → `handlePermission()` → reads JSON from stdin → routes to `handleAskUser()` (dropdown) or `handleAllowDeny()` (Allow/Deny buttons) → `MacOSEngine.prompt()` blocks with `execFileSync` → writes Claude Code hook JSON response to stdout.

**Focus suppression:** Both flows call `isAppFocused()` before showing a notification. If the host app (IntelliJ, VSCode, etc.) is the frontmost macOS app, the notification is skipped entirely — the user is already looking at the terminal.

**Terminal detection** (`terminal/detect.ts`) reads env vars (`$TERMINAL_EMULATOR`, `$TERM_PROGRAM`, `$CURSOR_CHANNEL`, `$WT_SESSION`) and maps to entries in the `TERMINALS` registry (`terminal/terminals.ts`), which holds `bundleId` (macOS) and `processName` (Windows) for each supported app.

**Platform abstraction:** `NotificationEngine` (abstract base) → `MacOSEngine` (uses `alerter` binary). Factory in `platform/index.ts`. Windows engine is planned for Phase 3.

## Key Conventions

- **Always exit 0** — hooks must never fail Claude Code. Errors go to stderr only.
- **Hook protocol** — stdout JSON must exactly match the Claude Code hook spec. See `output/hook-response.ts` for the response builders (`allowResponse`, `denyResponse`, `answerResponse`).
- **Zero runtime dependencies** — tsup bundles everything into a single file. No npm packages at runtime.
- **Focus rules** — never auto-focus on notification receipt. Focus only when the user explicitly clicks/dismisses a notification and needs to return to the terminal.
- **`alerter` output values** — `@TIMEOUT`, `@CLOSED`, `@CONTENTCLICKED`, or the selected action text. All must be handled; unrecognized values should fall through to terminal focus.

## Testing Patterns

Tests use vitest with globals enabled. They test pure logic by importing internal functions directly — no mocking of `alerter` or osascript. Test categories: CLI arg parsing, terminal env detection, hook response JSON shape, content formatting/truncation, and edge cases (malformed stdin, missing binaries).
