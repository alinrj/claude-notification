import { describe, it, expect } from "vitest";
import {
  allowResponse,
  denyResponse,
  answerResponse,
} from "../src/output/hook-response.js";

describe("hook-response", () => {
  // Test 8: Allow returns correct JSON
  it("allowResponse returns exact Claude Code protocol JSON", () => {
    const result = allowResponse();
    expect(result).toEqual({
      hookSpecificOutput: {
        hookEventName: "PermissionRequest",
        decision: { behavior: "allow" },
      },
    });
  });

  // Test 9: Deny returns correct JSON
  it("denyResponse returns exact Claude Code protocol JSON with message", () => {
    const result = denyResponse();
    expect(result).toEqual({
      hookSpecificOutput: {
        hookEventName: "PermissionRequest",
        decision: {
          behavior: "deny",
          message: "Denied via notification",
        },
      },
    });
  });

  // Test 10: AskUserQuestion returns answer
  it("answerResponse includes updatedInput with question and chosen option", () => {
    const result = answerResponse("Which approach?", "Option B");
    expect(result).toEqual({
      hookSpecificOutput: {
        hookEventName: "PermissionRequest",
        decision: {
          behavior: "allow",
          updatedInput: {
            answers: { "Which approach?": "Option B" },
          },
        },
      },
    });
  });

  // Test 12: JSON stringification produces valid output
  it("all responses produce valid JSON strings", () => {
    expect(() => JSON.stringify(allowResponse())).not.toThrow();
    expect(() => JSON.stringify(denyResponse())).not.toThrow();
    expect(() => JSON.stringify(answerResponse("q", "a"))).not.toThrow();
  });
});
