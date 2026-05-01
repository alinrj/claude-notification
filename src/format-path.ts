import path from "node:path";

export type PathDisplayMode = "full" | "relative" | "filename";

export function getPathDisplayMode(): PathDisplayMode {
  const val = process.env.CLAUDE_NOTIFY_PATH_DISPLAY;
  if (val === "full" || val === "relative" || val === "filename") return val;
  return "relative";
}

export function formatPath(filePath: string, mode: PathDisplayMode): string {
  if (!filePath) return "";

  switch (mode) {
    case "filename":
      return path.basename(filePath);
    case "relative": {
      const cwd = process.cwd();
      if (filePath.startsWith(cwd + path.sep) || filePath.startsWith(cwd + "/")) {
        return filePath.slice(cwd.length + 1);
      }
      return filePath;
    }
    case "full":
    default:
      return filePath;
  }
}
