import { errorCodeNames } from "@repo/errors/codes";
import { describe, expect, it } from "vitest";

import {
  checkCatalogs,
  checkNamespace,
  expectedKeys,
  flatten,
  placeholdersOf,
} from "./catalog-check";
import { resources } from "./resources";

describe("the catalogs", () => {
  it("have no problems in what is written (empty or partial languages are allowed)", () => {
    expect(checkCatalogs()).toStrictEqual([]);
  });

  it("have a message for every API error code", () => {
    const keys = Object.keys(resources.en.errors);

    expect(keys.toSorted()).toStrictEqual([...errorCodeNames].toSorted());
  });

  it("have English plural forms in pairs", () => {
    for (const catalog of Object.values(resources.en)) {
      const keys = Object.keys(flatten(catalog));
      for (const key of keys.filter((k) => k.endsWith("_one"))) {
        expect(keys).toContain(key.replace(/_one$/u, "_other"));
      }
    }
  });
});

describe(expectedKeys, () => {
  const english = {
    "a.hours_one": "{{count}} hour",
    "a.hours_other": "{{count}} hours",
    "a.title": "T",
  };

  it("asks for the plural forms each language needs", () => {
    expect([...expectedKeys(english, "en")].toSorted()).toStrictEqual([
      "a.hours_one",
      "a.hours_other",
      "a.title",
    ]);
    expect([...expectedKeys(english, "pl")].toSorted()).toStrictEqual([
      "a.hours_few",
      "a.hours_many",
      "a.hours_one",
      "a.hours_other",
      "a.title",
    ]);
    expect([...expectedKeys(english, "cy")].toSorted()).toStrictEqual([
      "a.hours_few",
      "a.hours_many",
      "a.hours_one",
      "a.hours_other",
      "a.hours_two",
      "a.hours_zero",
      "a.title",
    ]);
  });
});

describe(placeholdersOf, () => {
  it("lists the names once, sorted", () => {
    expect(placeholdersOf("Hi {{name}}, {{ count }} {{name}}")).toStrictEqual([
      "count",
      "name",
    ]);
  });
});

describe(checkNamespace, () => {
  const english = {
    greeting: "Hi {{name}}",
    hours_one: "{{count}} hour",
    hours_other: "{{count}} hours",
  };

  it("accepts a correct partial translation", () => {
    expect(
      checkNamespace("pl", "common", { greeting: "Cześć {{name}}" }, english)
    ).toStrictEqual([]);
  });

  it("reports a changed placeholder", () => {
    const problems = checkNamespace(
      "pl",
      "common",
      { greeting: "Cześć {{imie}}" },
      english
    );

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("placeholders");
  });

  it("reports empty values, markup and email addresses", () => {
    const problems = checkNamespace(
      "pl",
      "common",
      { greeting: "<b>Cześć</b> a@b.co {{name}}" },
      english
    );

    expect(problems.join("\n")).toContain("markup");
    expect(problems.join("\n")).toContain("email address");
    expect(
      checkNamespace("pl", "common", { greeting: "" }, english).join("\n")
    ).toContain("empty value");
  });

  it("reports a key English does not have", () => {
    expect(
      checkNamespace("pl", "common", { extra: "x" }, english).join("\n")
    ).toContain("does not exist in English");
  });

  it("lets a plural form leave out the number", () => {
    expect(
      checkNamespace("pl", "common", { hours_one: "godzina" }, english)
    ).toStrictEqual([]);
  });

  it("reports missing translations only when completeness is required", () => {
    expect(checkNamespace("pl", "common", {}, english)).toStrictEqual([]);

    const missing = checkNamespace("pl", "common", {}, english, {
      requireComplete: true,
    });

    expect(missing.join("\n")).toContain("hours_few: missing translation");
    expect(missing.join("\n")).toContain("hours_many: missing translation");
    expect(missing).toHaveLength(5);
  });
});
