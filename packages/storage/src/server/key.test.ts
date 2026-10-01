import { describe, expect, it } from "vitest";

import { buildKey } from "./key";

const familyId = "0190f2c0-7f6e-7a3b-9d2c-1b2a3c4d5e6f";
const childId = "0190f2c0-8000-7000-8000-000000000001";

const extensionOf = (contentType: "image/jpeg" | "image/heic" | "image/webp") =>
  buildKey({ contentType, familyId, kind: "attachment" }).split(".").pop();

describe(buildKey, () => {
  it("scopes attachments to family and child", () => {
    const key = buildKey({
      childId,
      contentType: "image/png",
      familyId,
      kind: "attachment",
    });
    expect(key).toMatch(
      new RegExp(
        `^family/${familyId}/child/${childId}/attachment/[0-9a-f-]{36}\\.png$`,
        "u"
      )
    );
  });

  it("scopes reports to the family only", () => {
    const key = buildKey({
      contentType: "application/pdf",
      familyId,
      kind: "report",
    });
    expect(key).toMatch(
      new RegExp(`^family/${familyId}/report/[0-9a-f-]{36}\\.pdf$`, "u")
    );
  });

  it("generates a unique key each time", () => {
    const input = {
      childId,
      contentType: "image/jpeg",
      familyId,
      kind: "attachment",
    } as const;
    expect(buildKey(input)).not.toBe(buildKey(input));
  });

  it("maps each content type to its extension", () => {
    expect(extensionOf("image/jpeg")).toBe("jpg");
    expect(extensionOf("image/heic")).toBe("heic");
    expect(extensionOf("image/webp")).toBe("webp");
  });
});
