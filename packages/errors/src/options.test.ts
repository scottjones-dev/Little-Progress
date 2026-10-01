import { describe, expect, it } from "vitest";

import { baseSentryOptions } from "./options";
import { scrubBreadcrumb, scrubEvent } from "./scrub";

describe(baseSentryOptions, () => {
  it("is off without a DSN, on with one", () => {
    expect(
      baseSentryOptions({ environment: "production" }).enabled
    ).toBeFalsy();
    expect(
      baseSentryOptions({
        dsn: "https://k@o1.ingest.de.sentry.io/1",
        environment: "production",
      }).enabled
    ).toBeTruthy();
  });

  it("never sends default PII and always scrubs", () => {
    const options = baseSentryOptions({ environment: "production" });

    expect(options.sendDefaultPii).toBeFalsy();
    expect(options.beforeSend).toBe(scrubEvent);
    expect(options.beforeBreadcrumb).toBe(scrubBreadcrumb);
  });

  it("has no replay, screenshot or profiling settings", () => {
    const keys = Object.keys(baseSentryOptions({ environment: "production" }));

    expect(
      keys.filter((k) =>
        /replay|screenshot|profil|hierarchy|feedback/iu.test(k)
      )
    ).toStrictEqual([]);
  });

  it("samples traces fully in development and lightly elsewhere", () => {
    expect(
      baseSentryOptions({ environment: "development" }).tracesSampleRate
    ).toBe(1);
    expect(
      baseSentryOptions({ environment: "production" }).tracesSampleRate
    ).toBe(0.1);
  });
});
