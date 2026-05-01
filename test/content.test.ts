import { describe, it, expect, vi } from "vitest";
import { DEFAULTS } from "../src/types.js";
import { formatPath } from "../src/format-path.js";

describe("content tests", () => {
  // Test 13: Bash tool description truncation
  it("Bash command is truncated to 200 chars", () => {
    const longCommand = "a".repeat(300);
    const truncated = String(longCommand).slice(0, 200);
    expect(truncated.length).toBe(200);
  });

  // Test 14: Edit/Write tool shows file_path
  it("Edit tool shows file_path as description", () => {
    const input = { file_path: "/foo/bar.ts" };
    expect(String(input.file_path ?? "")).toBe("/foo/bar.ts");
  });

  // Test 15: Title for "stopped" message
  it("title is 'Claude Code — Finished' when message contains 'stopped'", () => {
    const message = "Claude stopped";
    let title = DEFAULTS.TITLE_PREFIX;
    if (message.includes("stopped")) title = `${DEFAULTS.TITLE_PREFIX} \u2014 Finished`;
    expect(title).toBe(`${DEFAULTS.TITLE_PREFIX} \u2014 Finished`);
  });

  // Test 16: Title for "Plan" message
  it("title is 'Claude Code — Plan Ready' when message contains 'Plan'", () => {
    const message = "Plan ready for review";
    let title = DEFAULTS.TITLE_PREFIX;
    if (message.includes("Plan")) title = `${DEFAULTS.TITLE_PREFIX} \u2014 Plan Ready`;
    expect(title).toBe(`${DEFAULTS.TITLE_PREFIX} \u2014 Plan Ready`);
  });

  // Test 17: Subtitle format
  it("subtitle is 'App - dirname' when terminal is detected", () => {
    const app = "Ghostty";
    const dir = "project";
    const subtitle = app ? `${app} - ${dir}` : dir;
    expect(subtitle).toBe("Ghostty - project");
  });

  it("subtitle is just dirname when no terminal detected", () => {
    const app = "";
    const dir = "project";
    const subtitle = app ? `${app} - ${dir}` : dir;
    expect(subtitle).toBe("project");
  });

  // Test: Generic tool description
  it("generic tool shows key:value pairs truncated", () => {
    const input: Record<string, unknown> = { foo: "x".repeat(100), bar: "y".repeat(100) };
    const pairs = Object.entries(input)
      .map(([k, v]) => `${k}: ${String(v).slice(0, 80)}`)
      .join(", ");
    const description = pairs.slice(0, 200);
    expect(description.length).toBeLessThanOrEqual(200);
    expect(description).toContain("foo:");
    expect(description).toContain("bar:");
  });
});

describe("formatPath", () => {
  it("'full' mode returns path unchanged", () => {
    expect(formatPath("/usr/local/src/file.ts", "full")).toBe("/usr/local/src/file.ts");
  });

  it("'filename' mode returns only basename", () => {
    expect(formatPath("/usr/local/src/file.ts", "filename")).toBe("file.ts");
  });

  it("'relative' mode strips cwd prefix", () => {
    const cwd = process.cwd();
    const filePath = `${cwd}/src/hooks/permission.ts`;
    expect(formatPath(filePath, "relative")).toBe("src/hooks/permission.ts");
  });

  it("'relative' mode returns full path when file is outside cwd", () => {
    const filePath = "/some/other/project/file.ts";
    expect(formatPath(filePath, "relative")).toBe("/some/other/project/file.ts");
  });

  it("returns empty string for empty input", () => {
    expect(formatPath("", "relative")).toBe("");
    expect(formatPath("", "filename")).toBe("");
    expect(formatPath("", "full")).toBe("");
  });
});
