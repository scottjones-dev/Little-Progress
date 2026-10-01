import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  endOfLine: "lf",
  ignorePatterns: [
    ...(ultracite.ignorePatterns ?? []),
    "packages/db/src/schemas/auth.ts",
  ],
});
