import { NextRequest, NextResponse } from "next/server";
import { listPublishedPostsPage } from "@/blog-engine/services/posts";
import { serializePublicPost } from "@/blog-engine/services/serializers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const skip = Number(searchParams.get("skip") ?? 0);
  const take = Math.min(Number(searchParams.get("take") ?? 6), 12);
  const page = await listPublishedPostsPage({ skip, take });

  return NextResponse.json({
    posts: page.posts.map(serializePublicPost),
    hasMore: page.hasMore
  });
}
