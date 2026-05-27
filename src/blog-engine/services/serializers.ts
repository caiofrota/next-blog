import type { Category, MediaAsset, Post, Tag, User } from "@prisma/client";
import { formatDate } from "@/lib/dates";
import { getPublicStorageUrl } from "@/blog-engine/storage/public-url";
import { cleanWordPressExcerpt } from "@/blog-engine/seo/text";
import { getPrimaryCategory } from "@/site/utils/categories";

export type PublicPost = Post & {
  author: User;
  coverImage: MediaAsset | null;
  ogImage: MediaAsset | null;
  categories: Category[];
  tags: Tag[];
};

export function serializePublicPost(post: PublicPost) {
  const category = getPrimaryCategory(post.categories);

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: cleanWordPressExcerpt(post.excerpt),
    publishedAt: post.publishedAt?.toISOString() ?? null,
    publishedLabel: post.publishedAt ? formatDate(post.publishedAt) : null,
    readingTimeMinutes: post.readingTimeMinutes,
    coverImage: post.coverImage
      ? {
          url: getPublicStorageUrl(post.coverImage.key),
          altText: post.coverImage.altText ?? post.title
        }
      : null,
    category: category ? { name: category.name, slug: category.slug } : null
  };
}
