import { NotificationEngine } from "./base.js";
import { MacOSEngine } from "./macos.js";

/**
 * Create the notification engine for the current platform.
 * Throws if the platform is not supported.
 */
export function createEngine(): NotificationEngine {
  switch (process.platform) {
    case "darwin":
      return new MacOSEngine();
    // case "win32": return new WindowsEngine(); // Phase 3
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}
