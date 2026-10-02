import { describe, expect, it } from "vitest";

import { beforeSend, isTrackedPath } from "./options";

describe(isTrackedPath, () => {
  it("tracks ordinary pages", () => {
    expect(isTrackedPath("/")).toBeTruthy();
    expect(isTrackedPath("/dashboard")).toBeTruthy();
    expect(isTrackedPath("https://littleprogress.app/report/12")).toBeTruthy();
  });

  it("never tracks the carer quick-log or one-time link pages", () => {
    expect(isTrackedPath("/quick-log")).toBeFalsy();
    expect(isTrackedPath("/quick-log/meal")).toBeFalsy();
    expect(isTrackedPath("/reset-password/abc123")).toBeFalsy();
    expect(isTrackedPath("/accept-invitation/xyz")).toBeFalsy();
    expect(isTrackedPath("http://localhost:3000/quick-log?x=1")).toBeFalsy();
  });
});

describe(beforeSend, () => {
  it("passes null through", () => {
    expect(beforeSend(null)).toBeNull();
  });

  it("drops events from untracked pages and screens", () => {
    expect(
      beforeSend({
        event: "$pageview",
        properties: { $current_url: "http://localhost:3000/quick-log" },
      })
    ).toBeNull();
    expect(
      beforeSend({
        event: "$screen",
        properties: { $screen_name: "/quick-log" },
      })
    ).toBeNull();
  });

  it("hides secrets in URLs", () => {
    const sent = beforeSend({
      event: "$pageview",
      properties: {
        $current_url: "http://localhost:3000/welcome?token=SECRET&tab=1",
        $referrer: "https://example.com/?email=a@b.c",
      },
    });

    expect(sent?.properties?.$current_url).toBe(
      "http://localhost:3000/welcome?token=%5BFiltered%5D&tab=1"
    );
    expect(sent?.properties?.$referrer).toBe(
      "https://example.com/?email=%5BFiltered%5D"
    );
  });

  it("removes denylisted properties and keeps the rest", () => {
    const sent = beforeSend({
      event: "entry_logged",
      properties: { email: "a@b.c", kind: "meal", note: "ate carrots" },
    });

    expect(sent?.properties).toStrictEqual({ kind: "meal" });
  });

  it("leaves events without properties alone", () => {
    expect(beforeSend({ event: "family_created" })).toStrictEqual({
      event: "family_created",
    });
  });
});
