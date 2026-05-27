import { CopyObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "../src/lib/prisma";
import { env } from "../src/lib/env";

const fromPrefix = process.env.FROM_PREFIX;
const toPrefix = process.env.TO_PREFIX ?? "uploads/";

function requireR2Env() {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET) {
    throw new Error("Missing R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY or R2_BUCKET.");
  }

  return {
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucket: env.R2_BUCKET
  };
}

function copySource(bucket: string, key: string) {
  const encodedKey = encodeURIComponent(key).replace(/%2F/g, "/");
  return `${bucket}/${encodedKey}`;
}

async function main() {
  if (!fromPrefix) {
    throw new Error("Set FROM_PREFIX to the media key prefix that should be renamed.");
  }

  const r2 = requireR2Env();
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2.accessKeyId,
      secretAccessKey: r2.secretAccessKey
    }
  });

  const assets = await prisma.mediaAsset.findMany({
    where: { key: { startsWith: fromPrefix } },
    orderBy: { createdAt: "asc" }
  });

  if (!assets.length) {
    console.log(`No media assets found with prefix ${fromPrefix}`);
    return;
  }

  for (const asset of assets) {
    const newKey = `${toPrefix}${asset.key.slice(fromPrefix.length)}`;
    console.log(`Renaming ${asset.key} -> ${newKey}`);

    await client.send(
      new CopyObjectCommand({
        Bucket: r2.bucket,
        CopySource: copySource(r2.bucket, asset.key),
        Key: newKey,
        ContentType: asset.mimeType,
        MetadataDirective: "COPY"
      })
    );

    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { key: newKey }
    });

    await client.send(
      new DeleteObjectCommand({
        Bucket: r2.bucket,
        Key: asset.key
      })
    );
  }

  console.log(`Renamed ${assets.length} media asset(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
