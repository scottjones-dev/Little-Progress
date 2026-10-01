import {
  CreateBucketCommand,
  GetBucketCorsCommand,
  PutBucketCorsCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "@repo/env/storage";
import { beforeAll, describe, expect, it } from "vitest";

import { createStorage } from "./create";
import { buildKey } from "./key";

const origin = "http://localhost:3000";
const client = new S3Client({
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  region: env.S3_REGION,
});
const storage = createStorage();
const familyId = "0190f2c0-7f6e-7a3b-9d2c-1b2a3c4d5e6f";

describe("storage against the S3 emulator", () => {
  beforeAll(async () => {
    try {
      await client.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }));
    } catch {
      // bucket already exists
    }
    await client.send(
      new PutBucketCorsCommand({
        Bucket: env.S3_BUCKET,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ["*"],
              AllowedMethods: ["PUT", "GET", "HEAD"],
              AllowedOrigins: [origin],
            },
          ],
        },
      })
    );
  });

  it("uploads with a presigned PUT, then reads it back", async () => {
    const key = buildKey({
      contentType: "image/png",
      familyId,
      kind: "attachment",
    });
    const body = new Uint8Array([1, 2, 3, 4, 5]);

    const put = await storage.presignPut({
      contentType: "image/png",
      key,
      size: body.length,
    });
    const upload = await fetch(put.url, {
      body,
      headers: put.headers,
      method: "PUT",
    });
    expect(upload.ok).toBeTruthy();

    await expect(storage.head(key)).resolves.toStrictEqual({
      contentType: "image/png",
      size: 5,
    });

    const get = await storage.presignGet(key);
    const download = await fetch(get.url);
    expect(new Uint8Array(await download.arrayBuffer())).toStrictEqual(body);
  });

  it("returns null from head for a missing object", async () => {
    await expect(storage.head("family/none/missing.png")).resolves.toBeNull();
  });

  it("put() writes server-side and delete() removes the object", async () => {
    const key = buildKey({
      contentType: "application/pdf",
      familyId,
      kind: "report",
    });
    await storage.put({
      body: new TextEncoder().encode("%PDF-1.4"),
      contentType: "application/pdf",
      key,
    });
    await expect(storage.head(key)).resolves.toMatchObject({ size: 8 });

    await storage.delete(key);
    await expect(storage.head(key)).resolves.toBeNull();
  });

  it("bucket CORS allows the web origin for PUT", async () => {
    const cors = await client.send(
      new GetBucketCorsCommand({ Bucket: env.S3_BUCKET })
    );
    expect(cors.CORSRules?.[0]?.AllowedOrigins).toContain(origin);

    const { url } = await storage.presignPut({
      contentType: "image/png",
      key: "family/cors/check.png",
      size: 1,
    });
    const allowed = await fetch(url, {
      headers: {
        "Access-Control-Request-Method": "PUT",
        Origin: origin,
      },
      method: "OPTIONS",
    });
    expect(allowed.status).toBe(200);
    expect(allowed.headers.get("access-control-allow-origin")).toBe(origin);

    const denied = await fetch(url, {
      headers: {
        "Access-Control-Request-Method": "PUT",
        Origin: "http://evil.example",
      },
      method: "OPTIONS",
    });
    expect(denied.status).toBe(403);
  });
});
