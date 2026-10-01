import { defineConfig } from "oxlint";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";
import shadcn from "ultracite/oxlint/shadcn";
import vitest from "ultracite/oxlint/vitest";

export default defineConfig({
  extends: [core, react, next, vitest, shadcn, antiSlop],
  ignorePatterns: core.ignorePatterns,
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
      // Email: shadcn token rules target app UI; email clients need exact pixel values.
      files: ["packages/emails/**"],
      rules: {
        "shadcn/no-arbitrary-values": "off",
        "shadcn/no-raw-colors": "off",
      },
    },
  ],
});
