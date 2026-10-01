import { describe, expect, it } from "vitest";

import { buildSeedPlan, generateSecret } from "./plan.js";

const nodeEnv = (environment: "dev" | "prod") =>
  buildSeedPlan(environment).auto.find((secret) => secret.key === "NODE_ENV")
    ?.value;

const keys = (items: { key: string }[]) => items.map((item) => item.key);

describe(generateSecret, () => {
  it("is long enough for @repo/env and different every time", () => {
    const first = generateSecret();
    expect(first.length).toBeGreaterThanOrEqual(32);
    expect(generateSecret()).not.toBe(first);
  });
});

describe(buildSeedPlan, () => {
  it("generates both signing secrets for every environment", () => {
    for (const environment of ["dev", "staging", "prod"] as const) {
      const { auto } = buildSeedPlan(environment);
      expect(keys(auto)).toContain("BETTER_AUTH_SECRET");
      expect(keys(auto)).toContain("CARER_TOKEN_SECRET");
    }
  });

  it("gives the two signing secrets different values", () => {
    const { auto } = buildSeedPlan("dev");
    const values = auto
      .filter((secret) => secret.key.endsWith("_SECRET"))
      .map((secret) => secret.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("defaults localhost URLs only in dev", () => {
    const dev = buildSeedPlan("dev");
    expect(keys(dev.auto)).toContain("WEB_ORIGIN");
    expect(keys(dev.manual)).not.toContain("WEB_ORIGIN");

    const prod = buildSeedPlan("prod");
    expect(keys(prod.auto)).not.toContain("WEB_ORIGIN");
    expect(keys(prod.manual)).toContain("WEB_ORIGIN");
    expect(keys(prod.manual)).toContain("EXPO_PUBLIC_API_URL");
  });

  it("sets NODE_ENV=production outside dev", () => {
    expect(nodeEnv("dev")).toBe("development");
    expect(nodeEnv("prod")).toBe("production");
  });

  it("never auto-fills vendor credentials", () => {
    const { auto, manual } = buildSeedPlan("dev");
    for (const key of ["NOVU_SECRET_KEY", "AI_GATEWAY_API_KEY", "S3_BUCKET"]) {
      expect(keys(auto)).not.toContain(key);
      expect(keys(manual)).toContain(key);
    }
  });

  it("never lists a key as both automatic and manual", () => {
    const { auto, manual } = buildSeedPlan("dev");
    const overlap = keys(auto).filter((key) => keys(manual).includes(key));
    expect(overlap).toStrictEqual([]);
  });
});
