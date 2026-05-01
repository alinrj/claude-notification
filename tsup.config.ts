import { defineConfig } from "tsup";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf8"));

export default defineConfig({
  entry: {
    cli: "src/cli.ts",
  },
  format: ["cjs"],
  target: "node18",
  platform: "node",
  splitting: false,
  clean: true,
  treeshake: true,
  noExternal: [/.*/],
  banner: {
    js: "#!/usr/bin/env node",
  },
  define: {
    __PKG_VERSION__: JSON.stringify(pkg.version),
  },
});
