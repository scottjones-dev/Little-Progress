import { allowedContentTypes, maxUploadBytes } from "../shared/constants";
import type { PresignResponse } from "../shared/schemas";

export const validateFile = (file: { size: number; type: string }) => {
  const type = allowedContentTypes.find((allowed) => allowed === file.type);
  if (!type) {
    return "Unsupported file type";
  }
  if (file.size > maxUploadBytes[type]) {
    return "File is too large";
  }
  return null;
};

export const uploadToPresignedUrl = async (
  presigned: Pick<PresignResponse, "headers" | "url">,
  body: Blob
) => {
  const res = await fetch(presigned.url, {
    body,
    headers: presigned.headers,
    method: "PUT",
  });
  if (!res.ok) {
    throw new Error(`Upload failed with status ${res.status}`);
  }
};
