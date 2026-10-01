export const allowedContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
] as const;

export const maxUploadBytes = {
  "application/pdf": 20 * 1024 * 1024,
  "image/heic": 15 * 1024 * 1024,
  "image/jpeg": 15 * 1024 * 1024,
  "image/png": 15 * 1024 * 1024,
  "image/webp": 15 * 1024 * 1024,
} as const;

export const extensions = {
  "application/pdf": "pdf",
  "image/heic": "heic",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export const presignTtlSeconds = 300;

export type AllowedContentType = (typeof allowedContentTypes)[number];
