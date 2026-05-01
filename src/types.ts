// ── Notification Engine ──

export interface NotifyOptions {
  title: string;
  subtitle?: string;
  message: string;
  sound?: string;
  group?: string;
  timeout?: number;
  closeLabel?: string;
}

export interface InteractiveOptions extends NotifyOptions {
  actions: string[];
  dropdownLabel?: string; // macOS only: groups actions into a dropdown
}

export interface NotificationResult {
  action: string; // chosen button/option text, or "@TIMEOUT" / "@CLOSED"
  timedOut: boolean;
  dismissed: boolean;
}

// ── Terminal ──

export interface TerminalInfo {
  name: string;
  bundleId?: string; // macOS
  processName?: string; // Windows
}

export interface DetectedTerminal {
  app: string; // display name (e.g. "Ghostty")
  terminal: TerminalInfo | null;
}

// ── Claude Code Hook Protocol ──

export interface HookStdinPayload {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

export interface AskUserQuestionInput {
  questions: Array<{
    question: string;
    options?: Array<{ label: string }>;
  }>;
}

export interface HookDecision {
  behavior: "allow" | "deny";
  message?: string;
  updatedInput?: Record<string, unknown>;
}

export interface HookResponse {
  hookSpecificOutput: {
    hookEventName: string;
    decision: HookDecision;
  };
}

// ── CLI ──

export type Mode = "notify" | "permission" | "test" | "version" | "setup";

export interface ParsedArgs {
  mode: Mode;
  message: string;
  sound: string;
  uninstall?: boolean;
}

// ── Constants ──

export const DEFAULTS = {
  TIMEOUT_NOTIFY: 30,
  TIMEOUT_PERMISSION: 30,
  TIMEOUT_QUESTION: 30,
  SOUND_NOTIFY: "default",
  SOUND_PERMISSION: "Basso",
  SOUND_QUESTION: "Ping",
  GROUP_NOTIFY: "claude-code",
  GROUP_PERMISSION: "claude-code-permission",
  GROUP_QUESTION: "claude-code-ask",
  CLOSE_LABEL: "Open terminal",
  TITLE_PREFIX: "[CN] Claude Code",
} as const;
