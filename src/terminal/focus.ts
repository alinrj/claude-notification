import { execFileSync } from "node:child_process";
import type { TerminalInfo } from "../types.js";

const SAFE_BUNDLE_ID = /^[a-zA-Z0-9._-]+$/;

/**
 * Check whether the terminal/IDE app is the frontmost (focused) application.
 * Returns true if the app is focused — callers should skip notifications.
 */
export function isAppFocused(terminal: TerminalInfo | null): boolean {
  if (!terminal?.bundleId) return false;

  if (process.platform === "darwin") {
    return isAppFocusedMacOS(terminal.bundleId);
  }
  // Windows support added in Phase 3
  return false;
}

/**
 * Focus/activate the terminal application.
 * Only does something when the user explicitly interacted with the notification.
 */
export function focusTerminal(terminal: TerminalInfo | null): void {
  if (!terminal) return;

  if (process.platform === "darwin" && terminal.bundleId) {
    focusMacOS(terminal.bundleId);
  }
  // Windows support added in Phase 3
}

function isAppFocusedMacOS(bundleId: string): boolean {
  if (!SAFE_BUNDLE_ID.test(bundleId)) return false;

  try {
    const result = execFileSync("osascript", [
      "-e",
      'tell application "System Events" to get bundle identifier of first application process whose frontmost is true',
    ], { encoding: "utf8", timeout: 3000 });
    return result.trim() === bundleId;
  } catch {
    // Can't determine — assume not focused, send the notification
    return false;
  }
}

function focusMacOS(bundleId: string): void {
  if (!SAFE_BUNDLE_ID.test(bundleId)) return;

  try {
    execFileSync("osascript", [
      "-e", `tell application id "${bundleId}"`,
      "-e", "reopen",
      "-e", "activate",
      "-e", "end tell",
    ], { stdio: "ignore" });
  } catch {
    // Silently fail — app may not be running
  }
}
