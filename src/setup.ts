import {
  mkdirSync,
  existsSync,
  readFileSync,
  writeFileSync,
  cpSync,
  rmSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";

const CLAUDE_DIR = join(homedir(), ".claude");
const SETTINGS_PATH = join(CLAUDE_DIR, "settings.json");
const APP_NAME = "ClaudeNotifier.app";
const INSTALL_PATH = join(CLAUDE_DIR, APP_NAME);

const REQUIRED_HOOKS: Record<string, Array<{ matcher: string; hooks: Array<{ type: string; command: string }> }>> = {
  PreToolUse: [
    {
      matcher: "ExitPlanMode",
      hooks: [{ type: "command", command: "claude-notify notify -m 'Plan ready for review'" }],
    },
  ],
  PermissionRequest: [
    {
      matcher: "",
      hooks: [{ type: "command", command: "claude-notify permission -s Basso" }],
    },
  ],
  Stop: [
    {
      matcher: "",
      hooks: [{ type: "command", command: "claude-notify notify -m 'Claude stopped'" }],
    },
  ],
};

export function runSetup(options: { uninstall?: boolean } = {}): void {
  if (options.uninstall) {
    runUninstall();
    return;
  }

  log("Setting up claude-notify...\n");

  ensureDir(CLAUDE_DIR);
  installNotifier();
  configureHooks();

  log("\n✓ Setup complete!");
  log("  Notifier: ~/.claude/ClaudeNotifier.app/");
  log("  Hooks:    ~/.claude/settings.json");
  log("\n  Test it: claude-notify test");
  log("  Note: macOS will ask to allow notifications on first use.\n");
}

function installNotifier(): void {
  const vendorApp = resolveVendorApp();

  if (!vendorApp) {
    log("⚠ Pre-built notifier not found in package. Skipping .app install.");
    log("  You can build it manually: cd native-notifier && ./build.sh");
    return;
  }

  log("Installing ClaudeNotifier.app...");

  if (existsSync(INSTALL_PATH)) {
    rmSync(INSTALL_PATH, { recursive: true, force: true });
  }

  cpSync(vendorApp, INSTALL_PATH, { recursive: true });

  try {
    execSync(`codesign --force --sign - "${INSTALL_PATH}"`, { stdio: "ignore" });
  } catch {
    log("  ⚠ codesign failed (non-fatal). Notifications may require manual signing.");
  }

  log("  ✓ ClaudeNotifier.app installed");
}

function configureHooks(): void {
  log("Configuring hooks...");

  let settings: Record<string, unknown> = {};

  if (existsSync(SETTINGS_PATH)) {
    try {
      const raw = readFileSync(SETTINGS_PATH, "utf8");
      settings = JSON.parse(raw);
    } catch {
      log("  ⚠ Could not parse settings.json, creating backup");
      cpSync(SETTINGS_PATH, SETTINGS_PATH + ".backup");
      settings = {};
    }
  }

  if (!settings.hooks || typeof settings.hooks !== "object") {
    settings.hooks = {};
  }

  const hooks = settings.hooks as Record<string, unknown[]>;

  for (const [eventName, entries] of Object.entries(REQUIRED_HOOKS)) {
    if (!Array.isArray(hooks[eventName])) {
      hooks[eventName] = [];
    }

    for (const entry of entries) {
      if (!hasClaudeNotifyHook(hooks[eventName], entry.matcher)) {
        hooks[eventName].push(entry);
        const label = entry.matcher ? ` [${entry.matcher}]` : "";
        log(`  + Added ${eventName}${label}`);
      } else {
        const label = entry.matcher ? ` [${entry.matcher}]` : "";
        log(`  · ${eventName}${label} already configured`);
      }
    }
  }

  writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + "\n");
  log("  ✓ settings.json updated");
}

function runUninstall(): void {
  log("Uninstalling claude-notify...\n");

  if (existsSync(INSTALL_PATH)) {
    rmSync(INSTALL_PATH, { recursive: true, force: true });
    log("  ✓ Removed ~/.claude/ClaudeNotifier.app/");
  } else {
    log("  · ClaudeNotifier.app not found (already removed)");
  }

  if (existsSync(SETTINGS_PATH)) {
    try {
      const raw = readFileSync(SETTINGS_PATH, "utf8");
      const settings = JSON.parse(raw);

      if (settings.hooks && typeof settings.hooks === "object") {
        let anyRemoved = false;

        for (const eventName of Object.keys(REQUIRED_HOOKS)) {
          if (Array.isArray(settings.hooks[eventName])) {
            const before = settings.hooks[eventName].length;
            settings.hooks[eventName] = settings.hooks[eventName].filter(
              (entry: Record<string, unknown>) => !isClaudeNotifyEntry(entry),
            );
            if (settings.hooks[eventName].length === 0) {
              delete settings.hooks[eventName];
            }
            if (settings.hooks[eventName]?.length !== before) {
              anyRemoved = true;
            }
          }
        }

        if (Object.keys(settings.hooks).length === 0) {
          delete settings.hooks;
        }

        if (anyRemoved) {
          writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + "\n");
          log("  ✓ Hooks removed from settings.json");
        } else {
          log("  · No claude-notify hooks found in settings.json");
        }
      }
    } catch {
      log("  ⚠ Could not parse settings.json, skipping hook removal");
    }
  }

  log("\n✓ Uninstall complete.\n");
}

function resolveVendorApp(): string | null {
  // When installed via npm, layout is:
  //   <pkg-root>/dist/cli.js  (entry point)
  //   <pkg-root>/vendor/ClaudeNotifier.app/
  const scriptPath = process.argv[1];
  const pkgRoot = dirname(dirname(scriptPath));
  const vendorApp = join(pkgRoot, "vendor", APP_NAME);
  if (existsSync(vendorApp)) return vendorApp;

  // Dev mode: running from repo root
  const cwdVendor = join(process.cwd(), "vendor", APP_NAME);
  if (existsSync(cwdVendor)) return cwdVendor;

  return null;
}

function hasClaudeNotifyHook(entries: unknown[], matcher: string): boolean {
  return entries.some(
    (entry: unknown) => {
      const e = entry as Record<string, unknown>;
      return e.matcher === matcher && isClaudeNotifyEntry(e);
    },
  );
}

function isClaudeNotifyEntry(entry: Record<string, unknown>): boolean {
  const hooks = entry.hooks;
  if (!Array.isArray(hooks)) return false;
  return hooks.some(
    (h: Record<string, unknown>) =>
      h.type === "command" &&
      typeof h.command === "string" &&
      h.command.includes("claude-notify"),
  );
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function log(msg: string): void {
  process.stderr.write(msg + "\n");
}
