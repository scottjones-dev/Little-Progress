import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { emailIds } from "../registry";

const root = path.join(import.meta.dirname, "..", "..");

describe("build script", () => {
  it("emits html, text and a manifest for every template", () => {
    execFileSync(
      process.execPath,
      ["--import", "tsx", "src/scripts/build.ts"],
      {
        cwd: root,
        env: { ...process.env, EMAIL_TOKEN_PREFIX: "payload." },
      }
    );

    const manifest = JSON.parse(
      readFileSync(path.join(root, "dist", "manifest.json"), "utf-8")
    );
    expect(manifest.tokenPrefix).toBe("payload.");
    expect(manifest.templates.map((t: { id: string }) => t.id)).toStrictEqual(
      emailIds
    );

    for (const template of manifest.templates) {
      const html = readFileSync(
        path.join(root, "dist", template.html),
        "utf-8"
      );
      const text = readFileSync(
        path.join(root, "dist", template.text),
        "utf-8"
      );
      expect(html).toContain("<html");
      expect(text.length).toBeGreaterThan(0);
      for (const variable of template.variables) {
        expect(html).toContain(`{{payload.${variable}}}`);
      }
    }
  });
});
