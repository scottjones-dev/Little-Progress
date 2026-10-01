import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutBucketLifecycleConfigurationCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { app } from "@repo/config/app";
import { env } from "@repo/env/storage";

const client = new S3Client({
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  region: env.S3_REGION,
});
const Bucket = env.S3_BUCKET;

try {
  await client.send(new HeadBucketCommand({ Bucket }));
  console.log(`bucket ${Bucket} exists`);
} catch {
  await client.send(new CreateBucketCommand({ Bucket }));
  console.log(`bucket ${Bucket} created`);
}

await client.send(
  new PutBucketCorsCommand({
    Bucket,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["PUT", "GET", "HEAD"],
          AllowedOrigins: [app.url, "http://localhost:3000"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3000,
        },
      ],
    },
  })
);
console.log("cors applied");

try {
  await client.send(
    new PutBucketLifecycleConfigurationCommand({
      Bucket,
      LifecycleConfiguration: {
        Rules: [
          {
            AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 },
            Filter: { Prefix: "" },
            ID: "abort-incomplete-uploads",
            Status: "Enabled",
          },
        ],
      },
    })
  );
  console.log("lifecycle applied");
} catch (error) {
  console.warn(
    "lifecycle not applied:",
    error instanceof Error ? error.message : String(error)
  );
}
