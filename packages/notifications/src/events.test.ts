import { emailIds, registry } from "@repo/emails/registry";
import { describe, expect, it } from "vitest";

import { eventIds, events } from "./events";

describe("event catalog", () => {
  it("has an event for every email template and nothing else", () => {
    expect(eventIds.toSorted()).toStrictEqual(emailIds.toSorted());
  });

  it.each(eventIds)("%s accepts its email template's preview props", (id) => {
    const result = events[id].payload.safeParse(registry[id].previewProps);
    expect(result.success).toBeTruthy();
  });

  it.each(eventIds)("%s rejects a payload with a missing field", (id) => {
    const [firstKey] = Object.keys(registry[id].previewProps);
    const incomplete = Object.fromEntries(
      Object.entries(registry[id].previewProps).filter(
        ([key]) => key !== firstKey
      )
    );
    expect(events[id].payload.safeParse(incomplete).success).toBeFalsy();
  });

  it.each(eventIds)("%s renders its email from a valid payload", async (id) => {
    const { html, subject, text } = await events[id].renderEmail(
      registry[id].previewProps
    );
    expect(html).toContain("<html");
    expect(subject.length).toBeGreaterThan(0);
    expect(text.length).toBeGreaterThan(0);
  });

  it("marks every current event critical (security and account mail)", () => {
    for (const id of eventIds) {
      expect(events[id].critical).toBeTruthy();
    }
  });
});

describe("push messages", () => {
  const pushIds = eventIds.filter((id) => events[id].hasPush);

  it("exist for the security events that should reach a phone", () => {
    expect(pushIds.toSorted()).toStrictEqual([
      "new-location-sign-in",
      "password-changed",
    ]);
  });

  it.each(pushIds)("%s push is short and holds no link", (id) => {
    const { body, title } = events[id].renderPush(registry[id].previewProps);
    expect(title.length).toBeLessThanOrEqual(40);
    expect(body.length).toBeLessThanOrEqual(120);
    expect(`${title} ${body}`).not.toMatch(/https?:\/\//u);
  });

  it("throws when asked for a push that the event does not have", () => {
    expect(() =>
      events["verify-email"].renderPush(registry["verify-email"].previewProps)
    ).toThrow("has no push message");
  });
});
