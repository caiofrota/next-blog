import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { unstable_noStore as noStore } from "next/cache";
import { env } from "@/lib/env";

const CACHE_ROOT = path.join(os.tmpdir(), "blog-base-media-cache");

function normalizeKey(key: string) {
  const cleaned = key.replace(/^\/+/, "");
  if (!cleaned || cleaned.includes("..")) {
    throw new Error("Invalid media key");
  }

  return cleaned;
}

function getCachePaths(key: string) {
  const safeKey = normalizeKey(key);
  return {
    filePath: path.join(CACHE_ROOT, safeKey),
    metaPath: path.join(CACHE_ROOT, `${safeKey}.json`)
  };
}

async function readMeta(metaPath: string) {
  try {
    const raw = await fs.readFile(metaPath, "utf8");
    const parsed = JSON.parse(raw) as { contentType?: string };
    return parsed.contentType || "application/octet-stream";
  } catch {
    return "application/octet-stream";
  }
}

async function ensureParentDirectory(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function getCachedMediaResponse(key: string) {
  noStore();
  const { filePath, metaPath } = getCachePaths(key);

  try {
    const [file, contentType] = await Promise.all([fs.readFile(filePath), readMeta(metaPath)]);
    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Cache": "HIT"
      }
    });
  } catch {
    // cache miss
  }

  if (!env.R2_PUBLIC_BASE_URL) {
    return new Response("Missing R2_PUBLIC_BASE_URL", { status: 500 });
  }

  const remoteUrl = `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${normalizeKey(key)}`;
  const response = await fetch(remoteUrl, { cache: "no-store" });
  if (!response.ok || !response.body) {
    return new Response("Not found", { status: response.status || 404 });
  }

  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const buffer = Buffer.from(arrayBuffer);

  await ensureParentDirectory(filePath);
  await Promise.all([fs.writeFile(filePath, buffer), fs.writeFile(metaPath, JSON.stringify({ contentType }))]);

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Cache": "MISS"
    }
  });
}

export async function clearCachedMedia(key: string) {
  const { filePath, metaPath } = getCachePaths(key);
  await Promise.allSettled([fs.unlink(filePath), fs.unlink(metaPath)]);
}
