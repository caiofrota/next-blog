import { redirect } from "next/navigation";
import { PostStatus } from "@prisma/client";
import { PostEditorForm } from "@/blog-engine/components/admin/post-editor-form";
import { requireAdmin } from "@/blog-engine/services/auth";
import { listCategories } from "@/blog-engine/services/categories";
import { listTags } from "@/blog-engine/services/tags";
import { listMediaAssets } from "@/blog-engine/services/media";
import { createPost } from "@/blog-engine/services/posts";
import { parsePostFormData } from "@/blog-engine/services/post-form";
import { getPublicStorageUrl } from "@/blog-engine/storage/public-url";
import { env } from "@/lib/env";

async function saveDraftAction(formData: FormData) {
  "use server";
  const user = await requireAdmin();
  const parsed = parsePostFormData(formData, PostStatus.DRAFT);
  const post = await createPost(parsed, user.id);
  redirect(`/admin/posts/${post.id}`);
}

async function publishAction(formData: FormData) {
  "use server";
  const user = await requireAdmin();
  const parsed = parsePostFormData(formData, PostStatus.PUBLISHED);
  const post = await createPost(parsed, user.id);
  redirect(`/admin/posts/${post.id}`);
}

export default async function NewPostPage() {
  await requireAdmin();
  const [categories, tags, media] = await Promise.all([listCategories(), listTags(), listMediaAssets()]);
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

  return (
    <PostEditorForm
      mode="create"
      initialTitle=""
      initialExcerpt=""
      initialHtml=""
      initialPublishedAt={null}
      media={mediaAssets}
      categories={categories.map((category) => ({ id: category.id, label: category.name }))}
      tags={tags.map((tag) => ({ id: tag.id, label: tag.name }))}
      canonicalBaseUrl={env.APP_URL}
      saveDraftAction={saveDraftAction}
      publishAction={publishAction}
    />
  );
}
