import path from "node:path";
import { createEngine } from "../platform/index.js";
import { detectTerminal } from "../terminal/detect.js";
import { focusTerminal, isAppFocused } from "../terminal/focus.js";
import { readStdin } from "../stdin.js";
import {
  allowResponse,
  denyResponse,
  answerResponse,
  writeResponse,
} from "../output/hook-response.js";
import { formatPath, getPathDisplayMode } from "../format-path.js";
import type {
  HookStdinPayload,
  AskUserQuestionInput,
  InteractiveOptions,
} from "../types.js";
import { DEFAULTS } from "../types.js";

/**
 * Handle PermissionRequest hooks.
 * Reads JSON from stdin, determines tool type, shows interactive notification.
 * Skips notification if the host app is already focused — the user can
 * respond directly in the terminal.
 *
 * - AskUserQuestion: dropdown (macOS) / buttons (Windows) with options
 * - All other tools: Allow/Deny dialog
 */
export function handlePermission(sound: string): void {
  const payload = readStdin();
  if (!payload) return; // empty stdin = fall through to terminal

  // App is focused — user is already looking at it, fall through to terminal dialog
  const { terminal } = detectTerminal();
  if (isAppFocused(terminal)) return;

  const toolName = payload.tool_name ?? "Unknown";

  if (toolName === "AskUserQuestion") {
    handleAskUser(payload, sound);
  } else {
    handleAllowDeny(payload, toolName, sound);
  }
}

function handleAskUser(payload: HookStdinPayload, sound: string): void {
  const input = payload.tool_input as unknown as AskUserQuestionInput;
  const question = input.questions?.[0];
  if (!question) return;

  const questionText = question.question ?? "Claude has a question";
  const options = question.options?.map((o) => o.label).filter(Boolean) ?? [];
  if (options.length === 0) return;

  const engine = createEngine();
  if (!engine.isAvailable()) return;

  const { app, terminal } = detectTerminal();
  const dir = path.basename(process.cwd());
  const subtitle = app ? `${app} - ${dir}` : dir;

  const opts: InteractiveOptions = {
    title: `${DEFAULTS.TITLE_PREFIX} \u2014 Question`,
    subtitle,
    message: questionText,
    actions: options,
    dropdownLabel: "Options",
    sound: sound || DEFAULTS.SOUND_QUESTION,
    group: DEFAULTS.GROUP_QUESTION,
    timeout: DEFAULTS.TIMEOUT_QUESTION,
    closeLabel: DEFAULTS.CLOSE_LABEL,
  };

  const result = engine.prompt(opts);

  // User picked a valid option from the dropdown
  if (!result.timedOut && !result.dismissed && options.includes(result.action)) {
    writeResponse(answerResponse(questionText, result.action));
    return;
  }

  // Content/close-label click — focus terminal
  if (!result.timedOut && !result.dismissed) {
    focusTerminal(terminal);
  }
}

function handleAllowDeny(
  payload: HookStdinPayload,
  toolName: string,
  sound: string,
): void {
  const description = extractDescription(payload, toolName);

  const engine = createEngine();
  if (!engine.isAvailable()) return;

  const { app, terminal } = detectTerminal();
  const dir = path.basename(process.cwd());
  const subtitle = app ? `${app} - ${dir}` : dir;

  const opts: InteractiveOptions = {
    title: `${DEFAULTS.TITLE_PREFIX} \u2014 Permission`,
    subtitle,
    message: `${toolName}: ${description}`,
    actions: ["Allow", "Deny"],
    sound: sound || DEFAULTS.SOUND_PERMISSION,
    group: DEFAULTS.GROUP_PERMISSION,
    timeout: DEFAULTS.TIMEOUT_PERMISSION,
    closeLabel: DEFAULTS.CLOSE_LABEL,
  };

  const result = engine.prompt(opts);

  if (result.action === "Allow") {
    writeResponse(allowResponse());
    return;
  }

  if (result.action === "Deny") {
    writeResponse(denyResponse());
    return;
  }

  // Content/close-label click — focus terminal
  if (!result.timedOut && !result.dismissed) {
    focusTerminal(terminal);
  }
}

function extractDescription(
  payload: HookStdinPayload,
  toolName: string,
): string {
  const input = payload.tool_input;
  if (!input) return "";

  switch (toolName) {
    case "Bash":
      return String(input.command ?? "").slice(0, 200);
    case "Edit":
    case "Write":
      return formatPath(String(input.file_path ?? ""), getPathDisplayMode());
    default: {
      // Generic: show key:value pairs, truncated
      const pairs = Object.entries(input)
        .map(([k, v]) => `${k}: ${String(v).slice(0, 80)}`)
        .join(", ");
      return pairs.slice(0, 200);
    }
  }
}
