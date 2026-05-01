import { execFileSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { NotificationEngine } from "./base.js";
import type {
  NotifyOptions,
  InteractiveOptions,
  NotificationResult,
  TerminalInfo,
} from "../types.js";
import { DEFAULTS } from "../types.js";

/**
 * macOS notification engine using `alerter` (brew install alerter).
 *
 * - notify(): fire-and-forget banner. On click -> focuses terminal.
 * - prompt(): blocking banner with action buttons. Returns user's choice.
 */
export class MacOSEngine extends NotificationEngine {
  private readonly alerterPath: string;

  constructor() {
    super();
    this.alerterPath = resolveAlerter();
  }

  isAvailable(): boolean {
    return existsSync(this.alerterPath);
  }

  notify(opts: NotifyOptions, terminal?: TerminalInfo | null): void {
    const args = buildArgs(opts);

    const alerterCmd = [this.alerterPath, ...args.map(shellEscape)].join(" ");
    let script = `result=$(${alerterCmd})`;

    if (terminal?.bundleId && /^[a-zA-Z0-9._-]+$/.test(terminal.bundleId)) {
      script += `; if [ "$result" != "@TIMEOUT" ] && [ "$result" != "@CLOSED" ] && [ -n "$result" ]; then osascript -e 'tell application id "${terminal.bundleId}"' -e 'reopen' -e 'activate' -e 'end tell' 2>/dev/null; fi`;
    }

    const child = spawn("sh", ["-c", script], {
      detached: true,
      stdio: "ignore",
    });

    child.unref();
  }

  prompt(opts: InteractiveOptions): NotificationResult {
    const args = buildArgs(opts);

    if (opts.actions.length > 0) {
      args.push("--actions", opts.actions.join(","));
    }
    if (opts.dropdownLabel) {
      args.push("--dropdown-label", opts.dropdownLabel);
    }

    try {
      const timeoutMs = ((opts.timeout ?? DEFAULTS.TIMEOUT_PERMISSION) + 10) * 1000;
      const stdout = execFileSync(this.alerterPath, args, {
        timeout: timeoutMs,
        encoding: "utf8",
      });
      return parseAlerterOutput(stdout.trim());
    } catch {
      return { action: "@TIMEOUT", timedOut: true, dismissed: false };
    }
  }
}

// ── Helpers ──

function resolveAlerter(): string {
  const nativeNotifier = join(
    homedir(),
    ".claude",
    "ClaudeNotifier.app",
    "Contents",
    "MacOS",
    "claude-notifier",
  );
  if (existsSync(nativeNotifier)) return nativeNotifier;

  const systemPaths = ["/opt/homebrew/bin/alerter", "/usr/local/bin/alerter"];
  for (const p of systemPaths) {
    if (existsSync(p)) return p;
  }
  return "alerter";
}

function buildArgs(opts: NotifyOptions): string[] {
  const args = ["--title", opts.title, "--message", opts.message];
  if (opts.subtitle) args.push("--subtitle", opts.subtitle);
  if (opts.sound) args.push("--sound", opts.sound);
  if (opts.group) args.push("--group", opts.group);
  if (opts.timeout != null) args.push("--timeout", String(opts.timeout));
  if (opts.closeLabel) args.push("--close-label", opts.closeLabel);
  return args;
}

function parseAlerterOutput(output: string): NotificationResult {
  if (output === "@TIMEOUT") {
    return { action: output, timedOut: true, dismissed: false };
  }
  if (output === "@CLOSED" || output === "") {
    return { action: output || "@CLOSED", timedOut: false, dismissed: true };
  }
  return { action: output, timedOut: false, dismissed: false };
}

function shellEscape(arg: string): string {
  return `'${arg.replace(/'/g, "'\\''")}'`;
}
