import type { Metadata } from "next";
import { PostCard } from "@/site/components/post-card/post-card";
import { SiteSidebar } from "@/site/components/sidebar/site-sidebar";
import { postsByTag } from "@/blog-engine/services/posts";
import { getTagBySlug } from "@/blog-engine/services/tags";
import { brand } from "@/site/config/brand";
import { notFound } from "next/navigation";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const tag = await getTagBySlug(params.slug);
  if (!tag) return {};
  const description = `Artigos marcados com ${tag.name} publicados no ${brand.name}.`;

  return {
    title: tag.name,
    description,
    alternates: {
      canonical: `/tags/${tag.slug}`
    },
    openGraph: {
      title: `${tag.name} | ${brand.name}`,
      description,
      url: `/tags/${tag.slug}`
    }
  };
}

export default async function TagPage({ params }: { params: { slug: string } }) {
  const [tag, posts] = await Promise.all([getTagBySlug(params.slug), postsByTag(params.slug)]);
  if (!tag) notFound();

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Tag</p>
        <h1 className="mt-2 text-4xl font-bold">{tag.name}</h1>
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
