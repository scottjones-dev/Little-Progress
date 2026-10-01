import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { presignTtlSeconds } from "../shared/constants";
import type { StorageProvider } from "../shared/provider";

export interface S3Config {
  accessKeyId: string;
  bucket: string;
  endpoint?: string;
  forcePathStyle: boolean;
  region: string;
  secretAccessKey: string;
}

const expiry = (seconds: number) => new Date(Date.now() + seconds * 1000);

export const createS3Provider = (config: S3Config): StorageProvider => {
  const client = new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    region: config.region,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  const Bucket = config.bucket;

  return {
    async delete(key) {
      await client.send(new DeleteObjectCommand({ Bucket, Key: key }));
    },

    async head(key) {
      try {
        const res = await client.send(
          new HeadObjectCommand({ Bucket, Key: key })
        );
        return { contentType: res.ContentType, size: res.ContentLength ?? 0 };
      } catch (error) {
        if (error instanceof Error && error.name === "NotFound") {
          return null;
        }
        throw error;
      }
    },

    async presignGet(key, expiresInSeconds = presignTtlSeconds) {
      const url = await getSignedUrl(
        client,
        new GetObjectCommand({ Bucket, Key: key }),
        { expiresIn: expiresInSeconds }
      );
      return { expiresAt: expiry(expiresInSeconds), headers: {}, url };
    },

    async presignPut({
      contentType,
      expiresInSeconds = presignTtlSeconds,
      key,
      size,
    }) {
      const url = await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket,
          ContentLength: size,
          ContentType: contentType,
          Key: key,
        }),
        {
          expiresIn: expiresInSeconds,
          signableHeaders: new Set(["content-type"]),
        }
      );
      return {
        expiresAt: expiry(expiresInSeconds),
        headers: { "Content-Type": contentType },
        url,
      };
    },

    async put({ body, contentType, key }) {
      await client.send(
        new PutObjectCommand({
          Body: body,
          Bucket,
          ContentType: contentType,
          Key: key,
        })
      );
    },
  };
};
