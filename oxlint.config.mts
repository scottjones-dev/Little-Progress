import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";
import shadcn from "ultracite/oxlint/shadcn";
import vitest from "ultracite/oxlint/vitest";

export default defineConfig({
  extends: [core, react, next, vitest, shadcn, antiSlop],
  // Both are generated: the Better Auth schema by `pnpm auth:generate`, the shadcn components
  // by the shadcn CLI (re-added or updated with `shadcn add`, so hand edits would be lost).
  ignorePatterns: [
    ...core.ignorePatterns,
    "packages/db/src/schemas/auth.ts",
    "packages/ui/src/components/**",
  ],
  jsPlugins: shadcn.jsPlugins,
  overrides: [
    {
      // React Native: shadcn is web-only; RN uses StyleSheet and require() for assets.
      files: ["apps/native/**"],
      rules: {
        "eslint/no-use-before-define": "off",
        "node/global-require": "off",
        "react/style-prop-object": "off",
        "shadcn/no-arbitrary-values": "off",
        "shadcn/no-inline-styles": "off",
        "shadcn/no-raw-colors": "off",
        "unicorn/prefer-module": "off",
      },
    },
    {
      // The error and analytics scrubbers walk arbitrary event data from the SDKs, so unknown-typed
      // values and typeof checks are the point of that file.
      files: [
        "packages/errors/src/scrub.ts",
        "packages/analytics/src/options.ts",
        "packages/i18n/src/catalog-check.ts",
      ],
      rules: {
        "anti-slop/no-known-value-widening": "off",
        "anti-slop/no-runtime-typeof": "off",
        "anti-slop/no-unknown-parameters": "off",
        "anti-slop/no-unknown-returns": "off",
        "anti-slop/no-unsafe-dictionary-type": "off",
      },
    },
    {
      // Email: shadcn token rules target app UI; email clients need exact pixel values.
      files: ["packages/emails/**"],
      rules: {
        "shadcn/no-arbitrary-values": "off",
        "shadcn/no-raw-colors": "off",
      },
    },
  ],
});
