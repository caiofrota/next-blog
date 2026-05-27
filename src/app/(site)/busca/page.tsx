import type { Metadata } from "next";
import { PostCard } from "@/site/components/post-card/post-card";
import { SiteSidebar } from "@/site/components/sidebar/site-sidebar";
import { searchPublishedPosts } from "@/blog-engine/services/posts";
import { SiteSearchForm } from "@/site/components/search/site-search-form";
import { brand } from "@/site/config/brand";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Busca",
  description: `Encontre artigos, guias e novidades publicados no ${brand.name}.`,
  alternates: {
    canonical: "/busca"
  },
  robots: {
    index: false,
    follow: true
  }
};

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q?.trim() ?? "";
  const posts = query ? await searchPublishedPosts(query, 20) : [];

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <div className="rounded-2xl border border-[#eaded3] bg-white/90 p-6 shadow-[0_18px_50px_rgba(72,50,36,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted/70">Busca</p>
          <h1 className="mt-2 text-4xl font-semibold text-ink">Encontrar posts</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Use a busca para encontrar conteúdos por título, resumo ou corpo do post.
          </p>
          <SiteSearchForm
            defaultValue={query}
            className="mt-6 flex gap-3"
            inputClassName="min-w-0 flex-1 rounded-md border border-[#e7ddd4] px-4 py-3 outline-none transition focus:border-primary"
            buttonClassName="rounded-md bg-gradient-to-r from-ink to-muted px-5 py-3 font-semibold text-white transition hover:from-primary hover:to-blush"
          />
        </div>
        <section className="mt-10 space-y-8">
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
