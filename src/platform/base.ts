import type { NotifyOptions, InteractiveOptions, NotificationResult } from "../types.js";

/**
 * Abstract notification engine. Each platform (macOS, Windows, Linux)
 * provides a concrete implementation.
 */
export abstract class NotificationEngine {
  /** Fire-and-forget notification (Stop, PlanReady). Returns immediately. */
  abstract notify(opts: NotifyOptions): void;

  /** Blocking notification with action buttons. Returns user's choice. */
  abstract prompt(opts: InteractiveOptions): NotificationResult;

  /** Check if the notification backend binary is available. */
  abstract isAvailable(): boolean;
}
