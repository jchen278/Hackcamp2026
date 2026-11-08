const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");

let env = {};
if (fs.existsSync(".env")) {
  fs.readFileSync(".env", "utf8")
    .split("\n")
    .forEach((line) => {
      const [k, ...v] = line.trim().split("=");
      if (k && v.length) {
        env[k.trim()] = v.join("=").replace(/^["']|["']$/g, "");
      }
    });
}

const s3 = new S3Client({
  endpoint: env.VULTR_STORAGE_ENDPOINT,
  region: env.VULTR_STORAGE_REGION || "us-east-1",
  credentials: {
    accessKeyId: env.VULTR_STORAGE_ACCESS_KEY,
    secretAccessKey: env.VULTR_STORAGE_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function testUpload() {
  const key = `test-healthcheck-${Date.now()}.txt`;
  await s3.send(
    new PutObjectCommand({
      Bucket: env.VULTR_BUCKET_NAME,
      Key: key,
      Body: "PantryPulse Vultr S3 connection verified.",
      ContentType: "text/plain",
      ACL: "public-read",
    })
  );

  const endpoint = env.VULTR_STORAGE_ENDPOINT.replace(/\/$/, "");
  const url = `${endpoint}/${env.VULTR_BUCKET_NAME}/${key}`;
  console.log("\n SUCCESS! Test object uploaded to Vultr:\n", url);
}

testUpload().catch((err) => console.error("\nVultr upload failed:\n", err));