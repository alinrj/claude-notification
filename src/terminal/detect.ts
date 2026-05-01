import type { DetectedTerminal } from "../types.js";
import { TERMINALS } from "./terminals.js";

/**
 * Detect which terminal/IDE is running from environment variables.
 * Returns the app display name and its TerminalInfo (or null if unknown).
 */
export function detectTerminal(): DetectedTerminal {
  const env = process.env;

  // JetBrains IDEs set TERMINAL_EMULATOR
  if (env.TERMINAL_EMULATOR?.includes("JetBrains")) {
    return { app: TERMINALS.intellij.name, terminal: TERMINALS.intellij };
  }

  // Most terminals set TERM_PROGRAM
  const tp = env.TERM_PROGRAM;
  if (tp === "ghostty") return { app: TERMINALS.ghostty.name, terminal: TERMINALS.ghostty };
  if (tp === "iTerm.app") return { app: TERMINALS.iterm.name, terminal: TERMINALS.iterm };
  if (tp === "vscode") return { app: TERMINALS.vscode.name, terminal: TERMINALS.vscode };
  if (tp === "WarpTerminal") return { app: TERMINALS.warp.name, terminal: TERMINALS.warp };
  if (tp === "Apple_Terminal") return { app: TERMINALS.terminal.name, terminal: TERMINALS.terminal };
  if (tp === "Alacritty") return { app: TERMINALS.alacritty.name, terminal: TERMINALS.alacritty };

  // Cursor sets its own env var
  if (env.CURSOR_CHANNEL) return { app: TERMINALS.cursor.name, terminal: TERMINALS.cursor };

  // Windows Terminal sets WT_SESSION
  if (env.WT_SESSION) return { app: TERMINALS.windowsTerminal.name, terminal: TERMINALS.windowsTerminal };

  return { app: "", terminal: null };
}
