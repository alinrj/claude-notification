import type { HookResponse, HookDecision } from "../types.js";

/**
 * Build the JSON response for a PermissionRequest hook.
 * All builders produce the exact format Claude Code expects.
 */

export function allowResponse(): HookResponse {
  return {
    hookSpecificOutput: {
      hookEventName: "PermissionRequest",
      decision: { behavior: "allow" },
    },
  };
}

export function denyResponse(): HookResponse {
  return {
    hookSpecificOutput: {
      hookEventName: "PermissionRequest",
      decision: { behavior: "deny", message: "Denied via notification" },
    },
  };
}

export function answerResponse(
  questionText: string,
  chosenOption: string,
): HookResponse {
  return {
    hookSpecificOutput: {
      hookEventName: "PermissionRequest",
      decision: {
        behavior: "allow",
        updatedInput: {
          answers: { [questionText]: chosenOption },
        },
      },
    },
  };
}

/** Write a hook response to stdout as JSON. */
export function writeResponse(response: HookResponse): void {
  process.stdout.write(JSON.stringify(response));
}
