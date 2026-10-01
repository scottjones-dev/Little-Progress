import { describe, expect, it } from "vitest";

import { maxUploadBytes } from "./constants";
import { presignRequestSchema } from "./schemas";

describe("presign request schema", () => {
  it("accepts an allowed type within the size limit", () => {
    const result = presignRequestSchema.safeParse({
      contentType: "image/png",
      size: 1024,
    });
    expect(result.success).toBeTruthy();
  });

  it("accepts an optional entry id", () => {
    const result = presignRequestSchema.safeParse({
      contentType: "image/jpeg",
      entryId: "0190f2c0-7f6e-7a3b-9d2c-1b2a3c4d5e6f",
      size: 10,
    });
    expect(result.success).toBeTruthy();
  });

  it("rejects unsupported content types", () => {
    const result = presignRequestSchema.safeParse({
      contentType: "application/x-msdownload",
      size: 1024,
    });
    expect(result.success).toBeFalsy();
  });

  it("rejects zero, negative and fractional sizes", () => {
    for (const size of [0, -1, 1.5]) {
      const result = presignRequestSchema.safeParse({
        contentType: "image/png",
        size,
      });
      expect(result.success).toBeFalsy();
    }
  });

  it("rejects files over the per-type limit", () => {
    const result = presignRequestSchema.safeParse({
      contentType: "image/png",
      size: maxUploadBytes["image/png"] + 1,
    });
    expect(result.success).toBeFalsy();
  });

  it("allows the limit exactly", () => {
    const result = presignRequestSchema.safeParse({
      contentType: "application/pdf",
      size: maxUploadBytes["application/pdf"],
    });
    expect(result.success).toBeTruthy();
  });

  it("rejects a malformed entry id", () => {
    const result = presignRequestSchema.safeParse({
      contentType: "image/png",
      entryId: "not-a-uuid",
      size: 10,
    });
    expect(result.success).toBeFalsy();
  });
});
