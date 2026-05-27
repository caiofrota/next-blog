import { PostStatus } from "@prisma/client";
import { env } from "@/lib/env";
import { slugify } from "@/lib/slug";
import { postInputSchema, type PostInput } from "@/blog-engine/validation/post";

function buildCanonicalUrl(slug: string) {
  const normalizedBase = env.APP_URL.replace(/\/$/, "");
  return `${normalizedBase}/posts/${slug}`;
}

function parsePublishedAt(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parsePostFormData(formData: FormData, status: PostStatus): PostInput {
  const title = String(formData.get("title") || "");
  const slug = String(formData.get("slug") || "");
  const canonicalSlug = slugify(slug || title);
  const coverImageId = String(formData.get("coverImageId") || "") || null;

  return postInputSchema.parse({
    title,
    slug,
    excerpt: String(formData.get("excerpt") || ""),
    contentHtml: String(formData.get("contentHtml") || ""),
    status,
    publishedAt: parsePublishedAt(formData.get("publishedAt")),
    seoTitle: title,
    seoDescription: String(formData.get("seoDescription") || ""),
    metaTags: String(formData.get("metaTags") || ""),
    canonicalUrl: buildCanonicalUrl(canonicalSlug),
    coverImageId,
    ogImageId: coverImageId,
    categoryIds: formData.getAll("categoryIds").map(String),
    tagIds: formData.getAll("tagIds").map(String)
  });
}
