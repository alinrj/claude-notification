import { describe, it, expect } from "vitest";
import type { Mode, ParsedArgs } from "../src/types.js";
import { DEFAULTS } from "../src/types.js";

/**
 * Replicate the arg parser from cli.ts for unit testing.
 * In production this lives in cli.ts; extracted here to test without side effects.
 */
function parseArgs(argv: string[]): ParsedArgs {
  let mode: Mode = "notify";
  let message = "";
  let sound = DEFAULTS.SOUND_NOTIFY;
  const positional: string[] = [];
  let i = 0;

  while (i < argv.length) {
    const arg = argv[i];
    if (arg === "--permission" || arg === "permission") { mode = "permission"; i++; continue; }
    if (arg === "notify") { mode = "notify"; i++; continue; }
    if (arg === "test") { mode = "test"; i++; continue; }
    if (arg === "version" || arg === "--version" || arg === "-v") { mode = "version"; i++; continue; }
    if ((arg === "-m" || arg === "--message") && i + 1 < argv.length) { message = argv[i + 1]; i += 2; continue; }
    if ((arg === "-s" || arg === "--sound") && i + 1 < argv.length) { sound = argv[i + 1]; i += 2; continue; }
    positional.push(arg);
    i++;
  }

  if (!message && positional.length > 0) message = positional[0];
  if (positional.length > 1) sound = positional[1];

  return { mode, message, sound };
}

describe("CLI arg parsing", () => {
  it("parses notify mode with named flags", () => {
    const result = parseArgs(["notify", "-m", "Claude stopped", "-s", "default"]);
    expect(result.mode).toBe("notify");
    expect(result.message).toBe("Claude stopped");
    expect(result.sound).toBe("default");
  });

  it("parses backward-compatible positional: message sound", () => {
    const result = parseArgs(["Claude stopped", "default"]);
    expect(result.mode).toBe("notify");
    expect(result.message).toBe("Claude stopped");
    expect(result.sound).toBe("default");
  });

  it("parses --permission flag with positional sound", () => {
    const result = parseArgs(["--permission", "", "Basso"]);
    expect(result.mode).toBe("permission");
    expect(result.sound).toBe("Basso");
  });

  it("parses permission subcommand with -s flag", () => {
    const result = parseArgs(["permission", "-s", "Basso"]);
    expect(result.mode).toBe("permission");
    expect(result.sound).toBe("Basso");
  });

  it("parses test mode", () => {
    const result = parseArgs(["test"]);
    expect(result.mode).toBe("test");
  });

  it("parses version flag", () => {
    expect(parseArgs(["version"]).mode).toBe("version");
    expect(parseArgs(["--version"]).mode).toBe("version");
    expect(parseArgs(["-v"]).mode).toBe("version");
  });

  it("defaults to notify mode with default sound", () => {
    const result = parseArgs([]);
    expect(result.mode).toBe("notify");
    expect(result.sound).toBe("default");
    expect(result.message).toBe("");
  });
});
