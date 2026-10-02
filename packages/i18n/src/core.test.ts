import { createInstance } from "i18next";
import { describe, expect, it } from "vitest";

import { getT, i18nOptions } from "./core";

describe(getT, () => {
  it("translates with interpolation", () => {
    const t = getT("en", "push");

    expect(t("newLocationSignIn.body", { location: "Leeds" })).toBe(
      "Signed in from Leeds. Was this you?"
    );
  });

  it("picks the singular and plural English forms", () => {
    const t = getT("en", "emails");

    expect(t("deleteAccount.expiry", { amount: 1, count: 1 })).toContain(
      "1 hour."
    );
    expect(t("deleteAccount.expiry", { amount: 24, count: 24 })).toContain(
      "24 hours."
    );
  });

  it("uses English for an unknown or missing language", () => {
    expect(getT(undefined, "common")("actions.tryAgain")).toBe("Try again");
    expect(getT("fr", "common")("actions.tryAgain")).toBe("Try again");
    expect(getT(null, "common")("actions.tryAgain")).toBe("Try again");
  });
});

// Own resources, so these keep passing once the real Polish catalogs are filled in.
// The keys here are not in our real catalogs, so `t` is used through a plain function type.
const translateWith = async (pl: Record<string, string>, key: string) => {
  const instance = createInstance();
  await instance.init({
    ...i18nOptions("pl"),
    ns: ["common"],
    resources: {
      en: { common: { greeting: "Hello", only: "Only English" } },
      pl: { common: pl },
    },
  });
  // SAFETY: the test catalog above holds these keys; the typed t only knows the real catalog keys.
  return instance.t(key as "tagline");
};

describe("fallback to English", () => {
  it("uses the translation when there is one", async () => {
    await expect(
      translateWith({ greeting: "Cześć" }, "greeting")
    ).resolves.toBe("Cześć");
  });

  it("falls back to English for a missing key, never a raw key", async () => {
    await expect(translateWith({ greeting: "Cześć" }, "only")).resolves.toBe(
      "Only English"
    );
  });

  it("treats an empty translation as missing", async () => {
    await expect(translateWith({ greeting: "" }, "greeting")).resolves.toBe(
      "Hello"
    );
  });
});
