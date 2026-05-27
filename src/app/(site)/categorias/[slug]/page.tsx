import type { Metadata } from "next";
import { PostCard } from "@/site/components/post-card/post-card";
import { SiteSidebar } from "@/site/components/sidebar/site-sidebar";
import { postsByCategory } from "@/blog-engine/services/posts";
import { getCategoryBySlug } from "@/blog-engine/services/categories";
import { brand } from "@/site/config/brand";
import { notFound } from "next/navigation";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);
  if (!category) return {};
  const description = category.description ?? `Artigos sobre ${category.name} publicados no ${brand.name}.`;

  return {
    title: category.name,
    description,
    alternates: {
      canonical: `/categorias/${category.slug}`
    },
    openGraph: {
      title: `${category.name} | ${brand.name}`,
      description,
      url: `/categorias/${category.slug}`
    }
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const [category, posts] = await Promise.all([getCategoryBySlug(params.slug), postsByCategory(params.slug)]);
  if (!category) notFound();

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Categoria</p>
        <h1 className="mt-2 text-4xl font-bold">{category.name}</h1>
        {category.description ? <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{category.description}</p> : null}
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
