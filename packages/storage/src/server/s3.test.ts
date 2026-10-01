import { S3Client } from "@aws-sdk/client-s3";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createS3Provider } from "./s3";

const provider = createS3Provider({
  accessKeyId: "test",
  bucket: "unit-bucket",
  endpoint: "http://localhost:4566",
  forcePathStyle: true,
  region: "us-east-1",
  secretAccessKey: "test",
});

describe("createS3Provider presigning", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("presigns a PUT that signs content type and length", async () => {
    const result = await provider.presignPut({
      contentType: "image/png",
      key: "family/f/attachment/a.png",
      size: 1234,
    });
    const url = new URL(result.url);

    expect(url.pathname).toBe("/unit-bucket/family/f/attachment/a.png");
    expect(url.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toContain(
      "content-length"
    );
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toContain(
      "content-type"
    );
  });

  it("returns the headers the client must send and a future expiry", async () => {
    const result = await provider.presignPut({
      contentType: "image/png",
      key: "k.png",
      size: 1,
    });

    expect(result.headers).toStrictEqual({ "Content-Type": "image/png" });
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("honours a custom expiry for GET", async () => {
    const result = await provider.presignGet("k.pdf", 60);
    expect(new URL(result.url).searchParams.get("X-Amz-Expires")).toBe("60");
  });
});

describe("createS3Provider head", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns size and content type", async () => {
    // SAFETY: send() is overloaded per command; the head path only reads ContentLength and ContentType.
    vi.spyOn(S3Client.prototype, "send").mockResolvedValue({
      ContentLength: 42,
      ContentType: "image/png",
    } as never);
    await expect(provider.head("k")).resolves.toStrictEqual({
      contentType: "image/png",
      size: 42,
    });
  });

  it("returns null when the object does not exist", async () => {
    const notFound = Object.assign(new Error("missing"), { name: "NotFound" });
    vi.spyOn(S3Client.prototype, "send").mockRejectedValue(notFound);
    await expect(provider.head("k")).resolves.toBeNull();
  });

  it("rethrows other errors", async () => {
    vi.spyOn(S3Client.prototype, "send").mockRejectedValue(new Error("boom"));
    await expect(provider.head("k")).rejects.toThrow("boom");
  });
});
