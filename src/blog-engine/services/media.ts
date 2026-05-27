import { prisma } from "@/lib/prisma";
import { clearCachedMedia } from "@/blog-engine/storage/local-image-cache";
import { getStorageProvider } from "@/blog-engine/storage/r2-storage";

export async function createMediaAsset(input: {
  key: string;
  provider: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
  legacyUrl?: string | null;
}) {
  const data = {
    key: input.key,
    provider: input.provider,
    filename: input.filename,
    mimeType: input.mimeType,
    size: input.size,
    width: input.width ?? null,
    height: input.height ?? null,
    altText: input.altText ?? null,
    legacyUrl: input.legacyUrl ?? null
  };

  if (input.legacyUrl) {
    return prisma.mediaAsset.upsert({
      where: { legacyUrl: input.legacyUrl },
      create: data,
      update: data
    });
  }

  return prisma.mediaAsset.create({ data });
}

export async function listMediaAssets() {
  return prisma.mediaAsset.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
}

export async function listMediaAssetsPage(options: { take: number; skip: number }) {
  const [assets, total] = await Promise.all([
    prisma.mediaAsset.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: options.take,
      skip: options.skip
    }),
    prisma.mediaAsset.count()
  ]);

  return { assets, total, hasMore: options.skip + assets.length < total };
}

export async function deleteMediaAssets(ids: string[]) {
  if (ids.length === 0) return;

  const assets = await prisma.mediaAsset.findMany({
    where: { id: { in: ids } },
    select: { id: true, key: true }
  });
  const storage = getStorageProvider();
  for (const asset of assets) {
    await storage.deleteObject(asset.key);
    await clearCachedMedia(asset.key);
  }

  await prisma.mediaAsset.deleteMany({ where: { id: { in: ids } } });
}
