import { PostCard } from "@/site/components/post-card/post-card";
import { SiteSidebar } from "@/site/components/sidebar/site-sidebar";
import { postsByCategory } from "@/blog-engine/services/posts";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const posts = await postsByCategory(params.slug);

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <h1 className="mb-8 text-4xl font-bold">Categoria</h1>
        <section className="space-y-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>
      </div>
      <div className="lg:top-6 lg:self-start">
        <SiteSidebar />
      </div>
    </main>
  );
}
