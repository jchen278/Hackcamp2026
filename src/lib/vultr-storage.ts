// src/lib/vultr-storage.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: process.env.VULTR_STORAGE_ENDPOINT,
  region: process.env.VULTR_STORAGE_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.VULTR_STORAGE_ACCESS_KEY!,
    secretAccessKey: process.env.VULTR_STORAGE_SECRET_KEY!,
  },
  forcePathStyle: true, // Recommended for S3-compatible providers like Vultr
});

export async function uploadAuditImage(
  buffer: Buffer,
  filename: string,
  contentType: string = "image/jpeg"
): Promise<string> {
  const bucket = process.env.VULTR_BUCKET_NAME!;
  const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `scans/${Date.now()}-${cleanName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read",
    })
  );

  // Strip trailing slashes from endpoint
  const endpoint = process.env.VULTR_STORAGE_ENDPOINT!.replace(/\/$/, "");
  return `${endpoint}/${bucket}/${key}`;
}