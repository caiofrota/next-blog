import { InfinitePosts } from "@/site/components/home/infinite-posts";
import { LatestStrip } from "@/site/components/home/latest-strip";
import { SiteSidebar } from "@/site/components/sidebar/site-sidebar";
import { listPublishedPosts, listPublishedPostsPage } from "@/blog-engine/services/posts";
import { serializePublicPost } from "@/blog-engine/services/serializers";

export const revalidate = 60;

export default async function HomePage() {
  const [latestPosts, page] = await Promise.all([listPublishedPosts({ take: 21 }), listPublishedPostsPage({ take: 7, skip: 0 })]);

  return (
    <main>
      <LatestStrip posts={latestPosts.slice(1).map(serializePublicPost)} />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <InfinitePosts initialPosts={page.posts.map(serializePublicPost)} initialHasMore={page.hasMore} />
        </div>
        <div className="lg:top-6 lg:self-start">
          <SiteSidebar />
        </div>
      </div>
    </main>
  );
}
