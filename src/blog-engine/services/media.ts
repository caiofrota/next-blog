import { prisma } from "@/lib/prisma";
import { clearCachedMedia } from "@/blog-engine/storage/local-image-cache";
import { getStorageProvider } from "@/blog-engine/storage/r2-storage";
import { env } from "@/lib/env";
import { createDemoMediaAsset, demoMediaAssets } from "@/blog-engine/demo/data";

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
  if (env.DEMO_MODE) {
    return createDemoMediaAsset(input.filename, input.mimeType, input.size, input.altText);
  }

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
  if (env.DEMO_MODE) return [...demoMediaAssets].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

  return prisma.mediaAsset.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
}

export async function listMediaAssetsPage(options: { take: number; skip: number }) {
  if (env.DEMO_MODE) {
    const assets = await listMediaAssets();
    return { assets: assets.slice(options.skip, options.skip + options.take), total: assets.length, hasMore: options.skip + options.take < assets.length };
  }

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
  if (env.DEMO_MODE) return;

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
