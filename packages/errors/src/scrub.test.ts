import { describe, expect, it } from "vitest";

import { filtered, scrubBreadcrumb, scrubEvent, scrubUrl } from "./scrub";
import type { ScrubbableEvent } from "./scrub";

const sampleEvent: ScrubbableEvent = {
  breadcrumbs: [
    { category: "console", message: "user alex@example.test logged a meal" },
    { category: "ui.click", message: "button Save note: ate broccoli" },
    {
      category: "fetch",
      data: { method: "POST", status_code: 500, url: "/api/entries?token=abc" },
    },
  ],
  contexts: {
    app: { name: "LittleProgress" },
    child: { dateOfBirth: "2025-10-01" },
  },
  extra: { note: "refused broccoli", password: "hunter2", route: "/log/meal" },
  request: {
    cookies: { session: "secret-session" },
    data: { food: "broccoli", reaction: "gagged" },
    headers: {
      accept: "application/json",
      authorization: "Bearer abc",
      cookie: "better-auth.session_token=abc",
      "x-forwarded-for": "203.0.113.7",
    },
    query_string: "token=abc",
    url: "https://app.example.test/reset-password/one-time-token?foo=1",
  },
  server_name: "scotts-laptop",
  user: {
    email: "alex@example.test",
    id: "user_1",
    ip_address: "203.0.113.7",
    username: "alex",
  },
};

describe(scrubEvent, () => {
  it("removes the request body, cookies and credentials", () => {
    const clean = scrubEvent(sampleEvent);

    expect(clean.request?.data).toBeUndefined();
    expect(clean.request?.cookies).toBeUndefined();
    expect(clean.request?.query_string).toBeUndefined();
    expect(clean.request?.headers).toStrictEqual({
      accept: "application/json",
    });
  });

  it("keeps only an opaque user id", () => {
    expect(scrubEvent(sampleEvent).user).toStrictEqual({ id: "user_1" });
  });

  it("drops a user with no id completely", () => {
    const clean = scrubEvent({ user: { email: "alex@example.test" } });

    expect(clean.user).toStrictEqual({});
  });

  it("filters personal values in extra and contexts but keeps useful ones", () => {
    const clean = scrubEvent(sampleEvent);

    expect(clean.extra).toStrictEqual({
      note: filtered,
      password: filtered,
      route: "/log/meal",
    });
    expect(clean.contexts).toStrictEqual({
      app: { name: "LittleProgress" },
      child: { dateOfBirth: filtered },
    });
  });

  it("hides one-time secrets in the request URL", () => {
    expect(scrubEvent(sampleEvent).request?.url).toBe(
      "https://app.example.test/reset-password/[Filtered]?foo=1"
    );
  });

  it("drops the host name and risky breadcrumbs, keeps network ones", () => {
    const clean = scrubEvent(sampleEvent);

    expect(clean.server_name).toBeUndefined();
    expect(clean.breadcrumbs).toHaveLength(1);
    expect(clean.breadcrumbs?.[0]?.data?.url).toBe(
      "/api/entries?token=%5BFiltered%5D"
    );
  });

  it("does not change the event it was given", () => {
    const before = JSON.stringify(sampleEvent);

    scrubEvent(sampleEvent);

    expect(JSON.stringify(sampleEvent)).toBe(before);
  });
});

describe(scrubBreadcrumb, () => {
  it("drops console output and taps", () => {
    expect(scrubBreadcrumb({ category: "console", message: "x" })).toBeNull();
    expect(scrubBreadcrumb({ category: "ui.tap", message: "x" })).toBeNull();
  });

  it("keeps a plain breadcrumb unchanged", () => {
    const crumb = { category: "navigation", message: "to /charts" };

    expect(scrubBreadcrumb(crumb)).toStrictEqual(crumb);
  });

  it("filters sensitive keys in breadcrumb data", () => {
    const clean = scrubBreadcrumb({
      category: "custom",
      data: { email: "alex@example.test", step: "form" },
    });

    expect(clean?.data).toStrictEqual({ email: filtered, step: "form" });
  });
});

describe(scrubUrl, () => {
  it("filters sensitive query values and keeps the rest", () => {
    expect(scrubUrl("/verify?token=abc&page=2#top")).toBe(
      "/verify?token=%5BFiltered%5D&page=2#top"
    );
  });

  it("filters one-time path segments", () => {
    expect(scrubUrl("/accept-invitation/abc123")).toBe(
      "/accept-invitation/[Filtered]"
    );
  });

  it("leaves a url with nothing sensitive alone", () => {
    expect(scrubUrl("/charts?range=week")).toBe("/charts?range=week");
  });
});
