import { describe, expect, it } from "vitest";

import { parseAcceptLanguage, resolveLocale, toLocale } from "./resolve";

describe(toLocale, () => {
  it("accepts a supported language and ignores the region", () => {
    expect(toLocale("pl")).toBe("pl");
    expect(toLocale("pl-PL")).toBe("pl");
    expect(toLocale("es_MX")).toBe("es");
    expect(toLocale("CY")).toBe("cy");
    expect(toLocale("en-GB")).toBe("en");
  });

  it("returns nothing for unsupported or empty input", () => {
    expect(toLocale("fr")).toBeUndefined();
    expect(toLocale("")).toBeUndefined();
    expect(toLocale(null)).toBeUndefined();
    expect(toLocale()).toBeUndefined();
    expect(toLocale("not a language")).toBeUndefined();
  });
});

describe(parseAcceptLanguage, () => {
  it("picks the first supported language in the browser's order", () => {
    expect(parseAcceptLanguage("pl-PL,pl;q=0.9,en;q=0.8")).toBe("pl");
  });

  it("honours quality values over the order written", () => {
    expect(parseAcceptLanguage("en;q=0.5,cy;q=0.9")).toBe("cy");
  });

  it("skips unsupported languages and wildcards", () => {
    expect(parseAcceptLanguage("fr-FR,fr;q=0.9,es;q=0.8,*;q=0.1")).toBe("es");
  });

  it("ignores languages with a quality of zero", () => {
    expect(parseAcceptLanguage("pl;q=0,es;q=0.4")).toBe("es");
  });

  it("returns nothing for junk or a missing header", () => {
    expect(parseAcceptLanguage("garbage;;;,,")).toBeUndefined();
    expect(parseAcceptLanguage("")).toBeUndefined();
    expect(parseAcceptLanguage(null)).toBeUndefined();
  });
});

describe(resolveLocale, () => {
  it("prefers the signed-in user's saved language", () => {
    expect(
      resolveLocale({
        acceptLanguage: "es",
        cookie: "cy",
        device: "es",
        user: "pl",
      })
    ).toBe("pl");
  });

  it("then the remembered cookie", () => {
    expect(
      resolveLocale({ acceptLanguage: "es", cookie: "cy", user: null })
    ).toBe("cy");
  });

  it("then the browser, then the device", () => {
    expect(resolveLocale({ acceptLanguage: "es-ES,es;q=0.9" })).toBe("es");
    expect(resolveLocale({ device: "pl" })).toBe("pl");
  });

  it("skips values that are not supported", () => {
    expect(resolveLocale({ cookie: "fr", user: "de" })).toBe("en");
  });

  it("falls back to English", () => {
    expect(resolveLocale({})).toBe("en");
  });
});
