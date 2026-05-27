import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/blog-engine/services/auth";
import { createMediaAsset } from "@/blog-engine/services/media";
import { getStorageProvider } from "@/blog-engine/storage/r2-storage";
import { getPublicStorageUrl } from "@/blog-engine/storage/public-url";
import { allowedImageTypes } from "@/blog-engine/validation/media";
import { slugify } from "@/lib/slug";
import { env } from "@/lib/env";
import { createDemoMediaAsset } from "@/blog-engine/demo/data";

const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  const formData = await request.formData();
  const file = formData.get("file");
  const altText = String(formData.get("altText") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (!allowedImageTypes.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: `A imagem é muito grande. O tamanho máximo permitido é ${formatBytes(MAX_UPLOAD_SIZE_BYTES)}.`
      },
      { status: 413 }
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const fileName = `${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;
  const key = `uploads/${new Date().getFullYear()}/${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (env.DEMO_MODE) {
    const asset = createDemoMediaAsset(file.name, file.type, file.size, altText || null);
    return NextResponse.json({ ...asset, url: getPublicStorageUrl(asset.key), simulated: true });
  }

  const storage = getStorageProvider();
  const uploaded = await storage.putObject({ key, body: buffer, contentType: file.type });
  const asset = await createMediaAsset({
    key: uploaded.key,
    provider: "r2",
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    altText: altText || null
  });

  return NextResponse.json({ ...asset, url: getPublicStorageUrl(asset.key) });
}
