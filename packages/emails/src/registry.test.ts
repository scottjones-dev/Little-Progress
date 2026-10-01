import { app } from "@repo/config/app";
import { describe, expect, it } from "vitest";

import { emailIds, registry, renderEmail } from "./registry";

const tokenOf = (key: string) => `{{${key}}}`;

describe("email registry", () => {
  it("ships the account and family templates", () => {
    expect(emailIds.toSorted()).toStrictEqual([
      "delete-account",
      "family-invite",
      "magic-link",
      "new-location-sign-in",
      "password-changed",
      "reset-password",
      "two-factor-changed",
      "verify-email",
    ]);
  });

  it.each(emailIds)("%s has a non-empty subject", async (id) => {
    const { subject } = await registry[id].renderPreview();
    expect(subject.length).toBeGreaterThan(0);
  });
});

describe("rendered emails", () => {
  it.each(emailIds)("%s renders branded html and plain text", async (id) => {
    const { html, text } = await registry[id].renderPreview();

    expect(html).toContain(app.name);
    expect(html).toContain(`lang="${app.locale}"`);
    expect(html).toContain("background-color:rgb(15,16,18)");
    expect(text).toContain(app.name);
    expect(text).not.toMatch(/<[a-z][^>]*>/u);
  });

  it.each(emailIds)("%s html has footer links and no rem units", async (id) => {
    const { html } = await registry[id].renderWithTokens(tokenOf);

    expect(html).toContain(`${app.url}${app.links.privacy}`);
    expect(html).toContain(`${app.url}${app.links.terms}`);
    expect(html).toContain(app.links.support);
    expect(html).not.toMatch(/\d(?:\.\d+)?rem/u);
  });

  it("puts the supplied values into the html and text", async () => {
    const { html, subject, text } = await renderEmail("verify-email", {
      code: "123 456",
      expiresInMinutes: 7,
      name: "Sam",
      verifyUrl: "https://example.test/verify?x=1",
    });

    expect(subject).toBe("Verify your email address");
    expect(html).toContain("123 456");
    expect(html).toContain("https://example.test/verify?x=1");
    expect(text).toContain("123 456");
    expect(text).toContain("7 minutes");
  });
});

describe("placeholder templates", () => {
  it.each(emailIds)("%s contains every declared variable", async (id) => {
    const entry = registry[id];
    const { html, text } = await entry.renderWithTokens(tokenOf);

    expect(entry.variables.length).toBeGreaterThan(0);
    for (const variable of entry.variables) {
      expect(html).toContain(tokenOf(variable));
    }
    expect(text.length).toBeGreaterThan(0);
  });
});
