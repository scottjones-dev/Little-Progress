import { afterEach, describe, expect, it, vi } from "vitest";

import { maxUploadBytes } from "../shared/constants";
import { uploadToPresignedUrl, validateFile } from "./upload";

describe(validateFile, () => {
  it("accepts allowed types within limits", () => {
    expect(validateFile({ size: 100, type: "image/webp" })).toBeNull();
  });

  it("rejects unsupported types", () => {
    expect(validateFile({ size: 100, type: "text/html" })).toBe(
      "Unsupported file type"
    );
  });

  it("rejects oversize files", () => {
    expect(
      validateFile({
        size: maxUploadBytes["image/jpeg"] + 1,
        type: "image/jpeg",
      })
    ).toBe("File is too large");
  });
});

describe(uploadToPresignedUrl, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("PUTs the body with the presigned headers", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const body = new Blob(["hello"]);

    await uploadToPresignedUrl(
      {
        headers: { "Content-Type": "image/png" },
        url: "https://example.test/x",
      },
      body
    );

    expect(fetchMock).toHaveBeenCalledWith("https://example.test/x", {
      body,
      headers: { "Content-Type": "image/png" },
      method: "PUT",
    });
  });

  it("throws when the upload fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 403 })
    );

    await expect(
      uploadToPresignedUrl(
        { headers: {}, url: "https://example.test/x" },
        new Blob(["x"])
      )
    ).rejects.toThrow("Upload failed with status 403");
  });
});
