import Image from "next/image";
import Link from "next/link";
import type { MediaAsset, Post } from "@prisma/client";
import { formatDate } from "@/lib/dates";
import { getPublicStorageUrl } from "@/blog-engine/storage/public-url";
import { cleanWordPressExcerpt } from "@/blog-engine/seo/text";
import { getPrimaryCategory } from "@/site/utils/categories";

type PostCardPost = Post & {
  coverImage: MediaAsset | null;
  categories: { name: string; slug: string }[];
};

export function PostCard({ post }: { post: PostCardPost }) {
  const category = getPrimaryCategory(post.categories);

  return (
    <article className="grid gap-4 border-b border-rose/70 pb-8 md:grid-cols-[220px_1fr]">
      {post.coverImage ? (
        <Link href={`/posts/${post.slug}`} className="relative aspect-[4/3] overflow-hidden rounded bg-rose/40">
          <Image src={getPublicStorageUrl(post.coverImage.key)} alt={post.coverImage.altText ?? post.title} fill className="object-cover" />
        </Link>
      ) : (
        <div className="aspect-[4/3] rounded bg-mint" />
      )}
      <div>
        {category ? (
          <Link href={`/categorias/${category.slug}`} className="text-xs font-bold uppercase text-primary">
            {category.name}
          </Link>
        ) : null}
        <h2 className="mt-2 text-2xl font-bold leading-tight">
          <Link href={`/posts/${post.slug}`} className="hover:text-primary">
            {post.title}
          </Link>
        </h2>
        {post.publishedAt ? <p className="mt-2 text-sm text-muted">{formatDate(post.publishedAt)}</p> : null}
        {post.excerpt ? <p className="mt-4 text-muted">{cleanWordPressExcerpt(post.excerpt)}</p> : null}
        <Link href={`/posts/${post.slug}`} className="mt-4 inline-block font-semibold text-primary hover:text-ink">
          Ler Mais
        </Link>
      </div>
    </article>
  );
}
