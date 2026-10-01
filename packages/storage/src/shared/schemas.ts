import { z } from "zod";

import { allowedContentTypes, maxUploadBytes } from "./constants";

export const uploadStatuses = ["pending", "uploaded"] as const;
export type UploadStatus = (typeof uploadStatuses)[number];

export const presignRequestSchema = z
  .object({
    contentType: z.enum(allowedContentTypes),
    entryId: z.uuid().optional(),
    size: z.number().int().positive(),
  })
  .refine((v) => v.size <= maxUploadBytes[v.contentType], {
    message: "File is too large",
    path: ["size"],
  });
export type PresignRequest = z.infer<typeof presignRequestSchema>;

export const presignResponseSchema = z.object({
  expiresAt: z.iso.datetime(),
  headers: z.record(z.string(), z.string()),
  id: z.uuid(),
  url: z.url(),
});
export type PresignResponse = z.infer<typeof presignResponseSchema>;
