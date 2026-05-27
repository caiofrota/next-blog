import { getCachedMediaResponse } from "@/blog-engine/storage/local-image-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { key: string[] } }) {
  const key = params.key.join("/");
  return getCachedMediaResponse(key);
}
