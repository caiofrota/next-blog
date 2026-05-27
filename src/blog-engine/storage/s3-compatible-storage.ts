import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";
import type { PutObjectInput, StorageProvider } from "./types";
import { getPublicStorageUrl } from "./public-url";

export class S3CompatibleStorage implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicBaseUrl: string;

  constructor(options: { endpoint: string; bucket: string; accessKeyId: string; secretAccessKey: string; publicBaseUrl: string }) {
    this.bucket = options.bucket;
    this.publicBaseUrl = options.publicBaseUrl.replace(/\/$/, "");
    this.client = new S3Client({
      region: "auto",
      endpoint: options.endpoint,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey
      }
    });
  }

  async putObject(input: PutObjectInput) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType
      })
    );

    return { key: input.key, url: this.getPublicUrl(input.key) };
  }

  async deleteObject(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  getPublicUrl(key: string) {
    return getPublicStorageUrl(key);
  }
}

export function getStorageProvider() {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET || !env.R2_PUBLIC_BASE_URL) {
    throw new Error("Missing R2 storage environment variables");
  }

  return new S3CompatibleStorage({
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    bucket: env.R2_BUCKET,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    publicBaseUrl: env.R2_PUBLIC_BASE_URL
  });
}
