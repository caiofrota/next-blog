import { notFound } from "next/navigation";
import Image from "next/image";
import { getPublishedPostBySlug } from "@/blog-engine/services/posts";
import { articleJsonLd } from "@/blog-engine/seo/json-ld";
import { postMetadata } from "@/blog-engine/seo/metadata";
import { formatDate } from "@/lib/dates";
import { getPublicStorageUrl } from "@/blog-engine/storage/public-url";
import { resolveMediaUrlsInHtml, sanitizePostHtml } from "@/blog-engine/storage/html";
import { getPrimaryCategory } from "@/site/utils/categories";
import { SiteSidebar } from "@/site/components/sidebar/site-sidebar";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPublishedPostBySlug(params.slug);
  if (!post) return {};
  return postMetadata(post);
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPublishedPostBySlug(params.slug);
  if (!post) notFound();
  const category = getPrimaryCategory(post.categories);

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(post)) }} />
        <div className="mb-8">
          {category ? <p className="text-sm font-bold uppercase text-primary">{category.name}</p> : null}
          <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">{post.title}</h1>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted">
            {post.publishedAt ? <span>{formatDate(post.publishedAt)}</span> : null}
            <span>{post.readingTimeMinutes} min de leitura</span>
          </div>
        </div>
        {post.coverImage ? (
          <Image
            src={getPublicStorageUrl(post.coverImage.key)}
            alt={post.coverImage.altText ?? post.title}
            width={1200}
            height={800}
            className="mb-10 h-auto w-full rounded object-cover"
            priority
          />
        ) : null}
        <article className="prose-post" dangerouslySetInnerHTML={{ __html: resolveMediaUrlsInHtml(sanitizePostHtml(post.contentHtml)) }} />
      </div>
      <div className="lg:top-6 lg:self-start">
        <SiteSidebar />
      </div>
    </main>
  );
}
