import type { TerminalInfo } from "../types.js";

/**
 * Registry of known terminals/IDEs.
 * Each entry maps a lookup key to its platform identifiers.
 * Extend this record to add support for new terminals.
 */
export const TERMINALS: Record<string, TerminalInfo> = {
  ghostty: { name: "Ghostty", bundleId: "com.mitchellh.ghostty", processName: "ghostty.exe" },
  iterm: { name: "iTerm", bundleId: "com.googlecode.iterm2" },
  vscode: { name: "VSCode", bundleId: "com.microsoft.VSCode", processName: "Code.exe" },
  intellij: { name: "IntelliJ", bundleId: "com.jetbrains.intellij", processName: "idea64.exe" },
  warp: { name: "Warp", bundleId: "dev.warp.Warp-Stable", processName: "Warp.exe" },
  terminal: { name: "Terminal", bundleId: "com.apple.Terminal" },
  alacritty: { name: "Alacritty", bundleId: "org.alacritty", processName: "alacritty.exe" },
  kitty: { name: "Kitty", bundleId: "net.kovidgoyal.kitty", processName: "kitty.exe" },
  cursor: { name: "Cursor", bundleId: "com.todesktop.230313mzl4w4u92", processName: "Cursor.exe" },
  windowsTerminal: { name: "Windows Terminal", processName: "WindowsTerminal.exe" },
  cmd: { name: "Command Prompt", processName: "cmd.exe" },
  powershell: { name: "PowerShell", processName: "pwsh.exe" },
};
