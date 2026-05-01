import { readFileSync } from "node:fs";
import type { HookStdinPayload } from "./types.js";

/**
 * Read and parse JSON from stdin synchronously.
 * Returns null if stdin is empty or contains invalid JSON.
 */
export function readStdin(): HookStdinPayload | null {
  try {
    const data = readFileSync(0, "utf8").trim();
    if (!data) return null;
    return JSON.parse(data) as HookStdinPayload;
  } catch {
    return null;
  }
}
