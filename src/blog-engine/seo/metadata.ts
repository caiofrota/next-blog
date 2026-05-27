import type { MediaAsset, Post } from "@prisma/client";
import type { Metadata } from "next";
import { env } from "@/lib/env";
import { getPublicStorageUrl } from "@/blog-engine/storage/public-url";
import { parseMetaTags } from "@/blog-engine/seo/meta-tags";

type SeoPost = Post & {
  coverImage: Pick<MediaAsset, "key" | "altText"> | null;
  ogImage: Pick<MediaAsset, "key" | "altText"> | null;
};

export function postMetadata(post: SeoPost): Metadata {
  const title = post.seoTitle ?? post.title;
  const description = post.seoDescription ?? post.excerpt ?? "Next blog";
  const url = post.canonicalUrl ?? `${env.APP_URL}/posts/${post.slug}`;
  const keywords = parseMetaTags(post.metaTags);
  const imageKey = post.ogImage?.key ?? post.coverImage?.key;
  const image = imageKey ? getPublicStorageUrl(imageKey) : undefined;

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      images: image ? [{ url: image, alt: post.ogImage?.altText ?? post.coverImage?.altText ?? title }] : undefined
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined
    }
  };
}
