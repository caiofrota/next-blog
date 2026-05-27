import { getCachedMediaResponse } from "@/blog-engine/storage/local-image-cache";
import { demoImageSvg } from "@/blog-engine/demo/data";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { key: string[] } }) {
  const key = params.key.join("/");
  if (env.DEMO_MODE && key.startsWith("demo/")) {
    return new Response(demoImageSvg(key), {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "public, max-age=3600"
      }
    });
  }

  return getCachedMediaResponse(key);
}
