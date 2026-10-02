import { intlLocale } from "@repo/i18n/format";
import { locales } from "@repo/i18n/resolve";
import { describe, expect, it } from "vitest";

import { emailIds, registry, renderEmail } from "./registry";

// A key that leaked into the output looks like "verifyEmail.heading" or "layout.privacy".
const leakedKey =
  /\b(?:deleteAccount|familyInvite|layout|magicLink|newLocationSignIn|passwordChanged|resetPassword|twoFactorChanged|verifyEmail)\.[a-zA-Z]+/u;

const cases = locales.flatMap((locale) =>
  emailIds.map((id) => ({ id, locale }))
);

describe("emails in every language", () => {
  it.each(cases)(
    "$id renders in $locale with no raw keys or placeholders",
    async ({ id, locale }) => {
      const { html, subject, text } = await registry[id].renderPreview(locale);
      const problems = [
        subject.length > 0 ? "" : "empty subject",
        leakedKey.test(subject + html + text) ? "raw key in output" : "",
        html.includes("{{") ? "unreplaced placeholder" : "",
        html.includes(`lang="${intlLocale(locale)}"`) ? "" : "wrong lang",
      ].filter(Boolean);

      expect(problems).toStrictEqual([]);
    }
  );
});

describe("plural wording", () => {
  it("says 1 day for one day and 7 days for a week", async () => {
    const props = registry["family-invite"].previewProps;
    const one = await renderEmail("family-invite", {
      ...props,
      expiresInDays: 1,
    });
    const week = await renderEmail("family-invite", {
      ...props,
      expiresInDays: 7,
    });

    expect(one.text).toContain("expires in 1 day.");
    expect(week.text).toContain("expires in 7 days.");
  });

  it("keeps the number a template was given", async () => {
    const { text } = await renderEmail("verify-email", {
      ...registry["verify-email"].previewProps,
      expiresInMinutes: 15,
    });

    expect(text).toContain("expires in 15 minutes");
  });
});

describe("two-factor wording", () => {
  it("says on or off", async () => {
    const props = registry["two-factor-changed"].previewProps;
    const on = await renderEmail("two-factor-changed", {
      ...props,
      state: "on",
    });
    const off = await renderEmail("two-factor-changed", {
      ...props,
      state: "off",
    });

    expect(on.text).toContain("turned on");
    expect(off.text).toContain("turned off");
  });
});
