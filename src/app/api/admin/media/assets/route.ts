import { NextResponse } from "next/server";
import { getPublicStorageUrl } from "@/blog-engine/storage/public-url";
import { listMediaAssetsPage } from "@/blog-engine/services/media";
import { requireAdmin } from "@/blog-engine/services/auth";

function getPageSize(value: string | null) {
  const take = Number(value);
  return [12, 24, 48, 96].includes(take) ? take : 24;
}

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const take = getPageSize(url.searchParams.get("take"));
  const skipParam = Number(url.searchParams.get("skip"));
  const skip = Number.isFinite(skipParam) && skipParam > 0 ? Math.floor(skipParam) : 0;
  const { assets, total, hasMore } = await listMediaAssetsPage({ take, skip });

  return NextResponse.json({
    take,
    total,
    hasMore,
    assets: assets.map((asset) => ({
      id: asset.id,
      key: asset.key,
      filename: asset.filename,
      mimeType: asset.mimeType,
      size: asset.size,
      width: asset.width,
      height: asset.height,
      altText: asset.altText,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
      url: getPublicStorageUrl(asset.key)
    }))
  });
}
