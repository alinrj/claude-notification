import path from "node:path";
import { createEngine } from "../platform/index.js";
import { detectTerminal } from "../terminal/detect.js";
import { isAppFocused } from "../terminal/focus.js";
import type { NotifyOptions } from "../types.js";
import { DEFAULTS } from "../types.js";

/**
 * Handle Stop and PreToolUse (ExitPlanMode) hooks.
 * Sends a fire-and-forget notification. Exits immediately.
 * Skips notification if the host app is already focused.
 */
export function handleStop(message: string, sound: string): void {
  const engine = createEngine();
  if (!engine.isAvailable()) return;

  const { app, terminal } = detectTerminal();

  // App is focused — user is already looking at it, skip notification
  if (isAppFocused(terminal)) return;

  const dir = path.basename(process.cwd());
  const subtitle = app ? `${app} - ${dir}` : dir;

  // Contextual title based on message content
  let title = DEFAULTS.TITLE_PREFIX as string;
  if (message.includes("stopped")) title = `${title} \u2014 Finished`;
  else if (message.includes("Plan")) title = `${title} \u2014 Plan Ready`;

  const opts: NotifyOptions = {
    title,
    subtitle,
    message,
    sound: sound || DEFAULTS.SOUND_NOTIFY,
    group: DEFAULTS.GROUP_NOTIFY,
    timeout: DEFAULTS.TIMEOUT_NOTIFY,
  };

  // Fire-and-forget — focus only on explicit user click
  (engine as import("../platform/macos.js").MacOSEngine).notify(opts, terminal);
}
