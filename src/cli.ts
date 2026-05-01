import { handleStop } from "./hooks/stop.js";
import { handlePermission } from "./hooks/permission.js";
import { runSetup } from "./setup.js";
import { createEngine } from "./platform/index.js";
import { DEFAULTS } from "./types.js";
import type { Mode, ParsedArgs } from "./types.js";

function main(): void {
  const parsed = parseArgs(process.argv.slice(2));

  switch (parsed.mode) {
    case "notify":
      handleStop(parsed.message, parsed.sound);
      break;

    case "permission":
      handlePermission(parsed.sound);
      break;

    case "test":
      runTest();
      break;

    case "setup":
      runSetup({ uninstall: parsed.uninstall });
      break;

    case "version":
      printVersion();
      break;
  }
}

function parseArgs(argv: string[]): ParsedArgs {
  let mode: Mode = "notify";
  let message = "";
  let sound = DEFAULTS.SOUND_NOTIFY as string;
  let uninstall = false;

  const positional: string[] = [];
  let i = 0;

  while (i < argv.length) {
    const arg = argv[i];

    // Mode flags
    if (arg === "--permission" || arg === "permission") {
      mode = "permission";
      i++;
      continue;
    }
    if (arg === "notify") {
      mode = "notify";
      i++;
      continue;
    }
    if (arg === "test") {
      mode = "test";
      i++;
      continue;
    }
    if (arg === "setup") {
      mode = "setup";
      i++;
      continue;
    }
    if (arg === "version" || arg === "--version" || arg === "-v") {
      mode = "version";
      i++;
      continue;
    }

    // Named flags
    if ((arg === "-m" || arg === "--message") && i + 1 < argv.length) {
      message = argv[i + 1];
      i += 2;
      continue;
    }
    if ((arg === "-s" || arg === "--sound") && i + 1 < argv.length) {
      sound = argv[i + 1];
      i += 2;
      continue;
    }
    if (arg === "--uninstall") {
      uninstall = true;
      i++;
      continue;
    }

    // Positional args (backward-compat with shell script)
    positional.push(arg);
    i++;
  }

  // Backward-compatible positional: claude-notify "message" "sound"
  if (!message && positional.length > 0) message = positional[0];
  if (positional.length > 1) sound = positional[1];

  return { mode, message, sound, uninstall };
}

function runTest(): void {
  try {
    const engine = createEngine();
    if (!engine.isAvailable()) {
      process.stderr.write("[claude-notify] Notification backend not available\n");
      return;
    }
    engine.notify({
      title: `${DEFAULTS.TITLE_PREFIX} \u2014 Test`,
      message: "Notifications are working!",
      sound: "Ping",
      group: DEFAULTS.GROUP_NOTIFY,
      timeout: 30,
      closeLabel: DEFAULTS.CLOSE_LABEL,
    });
    process.stderr.write("[claude-notify] Test notification sent\n");
  } catch (err) {
    process.stderr.write(`[claude-notify] Test failed: ${err}\n`);
  }
}

declare const __PKG_VERSION__: string;

function printVersion(): void {
  process.stdout.write(__PKG_VERSION__ + "\n");
}

// ── Entry point with error boundary ──

try {
  main();
} catch (err) {
  // Hooks must ALWAYS exit 0
  process.stderr.write(`[claude-notify] ${err}\n`);
  process.exit(0);
}
