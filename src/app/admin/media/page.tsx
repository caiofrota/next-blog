import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AdminNav } from "@/blog-engine/components/admin/admin-nav";
import { FaIcon } from "@/blog-engine/components/admin/fa-icon";
import { MediaGallery } from "@/blog-engine/components/admin/media-gallery";
import { requireAdmin } from "@/blog-engine/services/auth";
import { deleteMediaAssets, listMediaAssetsPage } from "@/blog-engine/services/media";

const IMAGE_PAGE_SIZE = 24;

async function deleteAssetsAction(formData: FormData) {
  "use server";
  await requireAdmin();
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  await deleteMediaAssets(ids);
  revalidatePath("/admin/media");
  redirect("/admin/media");
}

export default async function AdminMediaPage() {
  await requireAdmin();
  const initialPage = await listMediaAssetsPage({ take: IMAGE_PAGE_SIZE, skip: 0 });

  return (
    <main className="admin-shell">
      <AdminNav />
      <div className="admin-container space-y-6">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="rounded-full border border-[#eaded3] bg-white px-3 py-2 text-sm text-muted">
              {initialPage.total} {initialPage.total === 1 ? "imagem" : "imagens"}
            </div>
          </div>
          <MediaGallery initialAssets={initialPage.assets.map((asset) => ({
            id: asset.id,
            key: asset.key,
            filename: asset.filename,
            mimeType: asset.mimeType,
            size: asset.size,
            width: asset.width,
            height: asset.height,
            altText: asset.altText,
            createdAt: asset.createdAt.toISOString(),
            updatedAt: asset.updatedAt.toISOString(),
            url: `/api/media/${asset.key}`
          }))} initialHasMore={initialPage.hasMore} take={IMAGE_PAGE_SIZE} deleteAction={deleteAssetsAction} />
          {initialPage.assets.length === 0 ? (
            <div className="rounded-md border border-[#eaded3] bg-white/85 px-4 py-6 text-sm text-muted">
              Nenhuma imagem encontrada.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
