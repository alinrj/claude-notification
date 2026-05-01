import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectTerminal } from "../src/terminal/detect.js";

describe("detectTerminal", () => {
  beforeEach(() => {
    // Clear relevant env vars
    delete process.env.TERMINAL_EMULATOR;
    delete process.env.TERM_PROGRAM;
    delete process.env.CURSOR_CHANNEL;
    delete process.env.WT_SESSION;
  });

  it("detects Ghostty from TERM_PROGRAM", () => {
    process.env.TERM_PROGRAM = "ghostty";
    const result = detectTerminal();
    expect(result.app).toBe("Ghostty");
    expect(result.terminal?.bundleId).toBe("com.mitchellh.ghostty");
  });

  it("detects iTerm from TERM_PROGRAM", () => {
    process.env.TERM_PROGRAM = "iTerm.app";
    const result = detectTerminal();
    expect(result.app).toBe("iTerm");
    expect(result.terminal?.bundleId).toBe("com.googlecode.iterm2");
  });

  it("detects VSCode from TERM_PROGRAM", () => {
    process.env.TERM_PROGRAM = "vscode";
    const result = detectTerminal();
    expect(result.app).toBe("VSCode");
    expect(result.terminal?.bundleId).toBe("com.microsoft.VSCode");
  });

  it("detects IntelliJ from TERMINAL_EMULATOR", () => {
    process.env.TERMINAL_EMULATOR = "JetBrains-JediTerm";
    const result = detectTerminal();
    expect(result.app).toBe("IntelliJ");
    expect(result.terminal?.bundleId).toBe("com.jetbrains.intellij");
  });

  it("detects Warp from TERM_PROGRAM", () => {
    process.env.TERM_PROGRAM = "WarpTerminal";
    const result = detectTerminal();
    expect(result.app).toBe("Warp");
  });

  it("detects Terminal.app from TERM_PROGRAM", () => {
    process.env.TERM_PROGRAM = "Apple_Terminal";
    const result = detectTerminal();
    expect(result.app).toBe("Terminal");
  });

  it("detects Alacritty from TERM_PROGRAM", () => {
    process.env.TERM_PROGRAM = "Alacritty";
    const result = detectTerminal();
    expect(result.app).toBe("Alacritty");
  });

  it("detects Cursor from CURSOR_CHANNEL", () => {
    process.env.CURSOR_CHANNEL = "stable";
    const result = detectTerminal();
    expect(result.app).toBe("Cursor");
  });

  it("detects Windows Terminal from WT_SESSION", () => {
    process.env.WT_SESSION = "some-guid";
    const result = detectTerminal();
    expect(result.app).toBe("Windows Terminal");
  });

  // Test 18: Unknown terminal
  it("returns empty app and null terminal when nothing matches", () => {
    const result = detectTerminal();
    expect(result.app).toBe("");
    expect(result.terminal).toBeNull();
  });

  // Test 17: Subtitle format
  it("provides terminal name for subtitle construction", () => {
    process.env.TERM_PROGRAM = "ghostty";
    const { app } = detectTerminal();
    const dir = "my-project";
    const subtitle = app ? `${app} - ${dir}` : dir;
    expect(subtitle).toBe("Ghostty - my-project");
  });
});
