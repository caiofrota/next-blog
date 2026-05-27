import { notFound, redirect } from "next/navigation";
import { PostStatus } from "@prisma/client";
import { PostEditorForm } from "@/blog-engine/components/admin/post-editor-form";
import { getAdminPost, updatePost } from "@/blog-engine/services/posts";
import { requireAdmin } from "@/blog-engine/services/auth";
import { listCategories } from "@/blog-engine/services/categories";
import { listTags } from "@/blog-engine/services/tags";
import { listMediaAssets } from "@/blog-engine/services/media";
import { resolveMediaUrlsInHtml } from "@/blog-engine/storage/html";
import { parsePostFormData } from "@/blog-engine/services/post-form";
import { env } from "@/lib/env";
import { getPublicStorageUrl } from "@/blog-engine/storage/public-url";

async function saveDraftAction(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id"));
  const current = await getAdminPost(id);
  if (!current) throw new Error("Post not found");
  const parsed = parsePostFormData(formData, PostStatus.DRAFT);
  await updatePost(id, parsed);
  redirect(`/admin/posts/${id}`);
}

async function publishAction(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id"));
  const current = await getAdminPost(id);
  if (!current) throw new Error("Post not found");
  const parsed = parsePostFormData(formData, PostStatus.PUBLISHED);
  await updatePost(id, parsed);
  redirect(`/admin/posts/${id}`);
}

async function revertToDraftAction(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id"));
  const current = await getAdminPost(id);
  if (!current) throw new Error("Post not found");
  const parsed = parsePostFormData(formData, PostStatus.DRAFT);
  await updatePost(id, parsed);
  redirect(`/admin/posts/${id}`);
}

export default async function EditPostPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const [post, categoriesRaw, tags, media] = await Promise.all([getAdminPost(params.id), listCategories(), listTags(), listMediaAssets()]);
  if (!post) notFound();
  const categories = categoriesRaw;
  const editableHtml = post.draftContentHtml ?? post.contentHtml;
  const editableTitle = post.draftTitle ?? post.title;
  const editableExcerpt = post.draftExcerpt ?? post.excerpt;
  const mediaAssets = media.map((asset) => ({
    id: asset.id,
    key: asset.key,
    filename: asset.filename,
    mimeType: asset.mimeType,
    size: asset.size,
    width: asset.width,
    height: asset.height,
    altText: asset.altText,
    url: getPublicStorageUrl(asset.key)
  }));
  const initialCoverImage = post.coverImage
    ? {
        id: post.coverImage.id,
        key: post.coverImage.key,
        filename: post.coverImage.filename,
        mimeType: post.coverImage.mimeType,
        size: post.coverImage.size,
        width: post.coverImage.width,
        height: post.coverImage.height,
        altText: post.coverImage.altText,
        url: getPublicStorageUrl(post.coverImage.key)
      }
    : null;

  return (
    <PostEditorForm
      mode="edit"
      postId={post.id}
      initialTitle={editableTitle}
      initialSlug={post.slug}
      initialExcerpt={editableExcerpt}
      initialHtml={resolveMediaUrlsInHtml(editableHtml)}
      initialSeoDescription={post.seoDescription}
      initialMetaTags={post.metaTags}
      initialCoverImageId={post.coverImageId}
      initialCoverImage={initialCoverImage}
      initialPublishedAt={post.publishedAt?.toISOString() ?? null}
      initialCategoryIds={post.categories.map((category) => category.id)}
      initialTagIds={post.tags.map((tag) => tag.id)}
      media={mediaAssets}
      categories={categories.map((category) => ({ id: category.id, label: category.name }))}
      tags={tags.map((tag) => ({ id: tag.id, label: tag.name }))}
      canonicalBaseUrl={env.APP_URL}
      saveDraftAction={saveDraftAction}
      publishAction={publishAction}
      revertToDraftAction={revertToDraftAction}
      showRevertToDraft={post.status === PostStatus.PUBLISHED}
    />
  );
}
