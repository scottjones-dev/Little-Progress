# @repo/storage

Private object storage (photos, report PDFs) behind a small provider interface.

## Why it exists

Works with anything that speaks the S3 API: AWS S3, Cloudflare R2, MinIO and the local Floci emulator. Azure Blob is not S3-compatible; it can be added later behind the same `StorageProvider` interface. Server and client code live together but are split by subpath, so browsers and Expo never bundle the AWS SDK.

## What's inside

- `@repo/storage/shared/*`: constants (allowed types, size limits, presign TTL), Zod schemas for presign requests, the `StorageProvider` type.
- `@repo/storage/server/*`: `createStorage()` / `createS3Provider()` (presign PUT and GET, head, put, delete), `buildKey()` (server-generated object keys), `init.ts` (bucket, CORS, lifecycle).
- `@repo/storage/client/*`: `validateFile()` and `uploadToPresignedUrl()` (fetch only).

Uploads: the API authorises and presigns, the client PUTs straight to the bucket, the API verifies with `head`. Presigned PUTs sign both `Content-Type` and `Content-Length`.

## Use it

```ts
import { createStorage } from "@repo/storage/server/create";
import { buildKey } from "@repo/storage/server/key";

const storage = createStorage();
const key = buildKey({
  contentType: "image/png",
  familyId,
  kind: "attachment",
});
const { url, headers } = await storage.presignPut({
  contentType: "image/png",
  key,
  size,
});
```

```ts
import {
  uploadToPresignedUrl,
  validateFile,
} from "@repo/storage/client/upload";
```

## Run it

Local storage is Floci: `pnpm infra:storage:up` (S3 on :4566, UI on <http://localhost:4500>), then `pnpm storage:init` to create the bucket and CORS.

## Tests

- `pnpm --filter @repo/storage test`: unit tests (Vitest).
- `pnpm --filter @repo/storage test:integration`: runs against Floci (needs `infra:storage:up`). Floci does not verify signatures, so tampered or expired URLs must be tested against a real R2 bucket.

## Depends on / used by

Depends on `@repo/env`, `@repo/config`, AWS SDK v3, `zod`. Will be used by `apps/api`; the client subpath by web and native.
