import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { emailIds, registry } from "../registry";

const root = path.join(import.meta.dirname, "..", "..");
const dist = path.join(root, "dist");
const prefix = process.env.EMAIL_TOKEN_PREFIX ?? "";
const token = (key: string) => `{{${prefix}${key}}}`;

await rm(dist, { force: true, recursive: true });
await mkdir(path.join(dist, "html"), { recursive: true });
await mkdir(path.join(dist, "text"), { recursive: true });

const manifest = await Promise.all(
  emailIds.map(async (id) => {
    const entry = registry[id];
    const { html, subject, text } = await entry.renderWithTokens(token);
    await Promise.all([
      writeFile(path.join(dist, "html", `${id}.html`), html),
      writeFile(path.join(dist, "text", `${id}.txt`), text),
    ]);
    return {
      html: `html/${id}.html`,
      id,
      subject,
      text: `text/${id}.txt`,
      variables: entry.variables,
    };
  })
);

await writeFile(
  path.join(dist, "manifest.json"),
  `${JSON.stringify({ templates: manifest, tokenPrefix: prefix }, null, 2)}\n`
);

console.log(`built ${manifest.length} email templates to ${dist}`);
