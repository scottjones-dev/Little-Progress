import { describe, expect, it } from "vitest";

import { buildLocalEnv } from "./plan";

describe(buildLocalEnv, () => {
  it("has the keys the API, the website and the app need to start", () => {
    const { values } = buildLocalEnv();

    for (const key of [
      "BETTER_AUTH_SECRET",
      "CARER_TOKEN_SECRET",
      "DATABASE_URL",
      "NEXT_PUBLIC_API_URL",
      "EXPO_PUBLIC_API_URL",
      "S3_BUCKET",
      "WEB_ORIGIN",
    ]) {
      expect(values[key]).toBeTruthy();
    }
  });

  it("makes long, different secrets each time", () => {
    const first = buildLocalEnv().values;
    const second = buildLocalEnv().values;

    expect(first.BETTER_AUTH_SECRET?.length).toBeGreaterThanOrEqual(32);
    expect(first.BETTER_AUTH_SECRET).not.toBe(first.CARER_TOKEN_SECRET);
    expect(first.BETTER_AUTH_SECRET).not.toBe(second.BETTER_AUTH_SECRET);
  });

  it("points only at this machine and asks for no account", () => {
    // Only the KEY=value lines: the header comment names the optional services on purpose.
    const text = buildLocalEnv()
      .lines.filter((line) => /^[A-Z0-9_]+=/u.test(line))
      .join("\n");

    expect(text).not.toMatch(/sentry|posthog|novu|google|microsoft/iu);
    expect(text).not.toMatch(/https:\/\//u);
  });

  it("writes every value as KEY=value with comments for the groups", () => {
    const { lines, values } = buildLocalEnv();
    const assignments = lines.filter((line) => /^[A-Z0-9_]+=/u.test(line));

    expect(assignments).toHaveLength(Object.keys(values).length);
  });
});
