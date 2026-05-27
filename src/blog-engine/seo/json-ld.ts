import type { MediaAsset, Post, User } from "@prisma/client";
import { env } from "@/lib/env";
import { getPublicStorageUrl } from "@/blog-engine/storage/public-url";
import { parseMetaTags } from "@/blog-engine/seo/meta-tags";
import { brand } from "@/site/config/brand";

type ArticlePost = Post & {
  author: Pick<User, "name">;
  coverImage: Pick<MediaAsset, "key"> | null;
  ogImage: Pick<MediaAsset, "key"> | null;
};

export function articleJsonLd(post: ArticlePost) {
  const url = `${env.APP_URL}/posts/${post.slug}`;
  const imageKey = post.ogImage?.key ?? post.coverImage?.key;
  const image = imageKey ? getPublicStorageUrl(imageKey) : undefined;
  const keywords = parseMetaTags(post.metaTags);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    keywords: keywords.length > 0 ? keywords : undefined,
    image: image ? [image] : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: post.author.name
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": post.canonicalUrl ?? url
    }
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    description: brand.description,
    url: env.APP_URL,
    inLanguage: "pt-BR",
    potentialAction: {
      "@type": "SearchAction",
      target: `${env.APP_URL}/busca?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: brand.name,
    description: brand.description,
    applicationCategory: "BlogPublishingApplication",
    operatingSystem: "Web",
    url: env.APP_URL,
    creator: {
      "@type": "Person",
      name: brand.author
    },
    keywords: brand.keywords.join(", ")
  };
}
