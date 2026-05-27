import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect";
import { EMPTY_TAXONOMY_FILTER } from "@/blog-engine/admin/post-filter-constants";
import { AdminNav } from "@/blog-engine/components/admin/admin-nav";
import { EditableTagRow } from "@/blog-engine/components/admin/editable-tag-row";
import { FaIcon } from "@/blog-engine/components/admin/fa-icon";
import { PostsPageSizeSelect } from "@/blog-engine/components/admin/posts-page-size-select";
import { requireAdmin } from "@/blog-engine/services/auth";
import { countPostsWithoutTag, createTag as createTagRecord, deleteTag, listTags, updateTag } from "@/blog-engine/services/tags";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;
const TAG_SORT_FIELDS = ["name", "slug", "postsCount"] as const;
type TagSortField = (typeof TAG_SORT_FIELDS)[number];
type SortDirection = "asc" | "desc";
type TagFilter = "empty" | null;

async function createTag(formData: FormData) {
  "use server";
  await requireAdmin();
  const page = getPageNumber(String(formData.get("page") || "1"));
  const take = getPageSize(String(formData.get("take") || String(DEFAULT_PAGE_SIZE)));
  const sort = getSortField(String(formData.get("sort") || ""));
  const dir = getSortDirection(String(formData.get("dir") || ""));
  const filter = getTagFilter(String(formData.get("empty") || ""));
  try {
    await createTagRecord(String(formData.get("name") ?? ""), String(formData.get("slug") ?? ""));
    revalidatePath("/admin/tags");
    redirectToTagsPage({ page, take, sort, dir, filter, notice: "saved" });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message = error instanceof Error ? error.message : "unknown";
    redirectToTagsPage({ page, take, sort, dir, filter, error: message });
  }
}

async function saveTag(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id"));
  const page = getPageNumber(String(formData.get("page") || "1"));
  const take = getPageSize(String(formData.get("take") || String(DEFAULT_PAGE_SIZE)));
  const sort = getSortField(String(formData.get("sort") || ""));
  const dir = getSortDirection(String(formData.get("dir") || ""));
  const filter = getTagFilter(String(formData.get("empty") || ""));
  try {
    await updateTag(id, String(formData.get("name") ?? ""), String(formData.get("slug") ?? ""));
    revalidatePath("/admin/tags");
    redirectToTagsPage({ page, take, sort, dir, filter, notice: "saved" });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message = error instanceof Error ? error.message : "unknown";
    redirectToTagsPage({ page, take, sort, dir, filter, error: message });
  }
}

async function removeTag(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id"));
  const page = getPageNumber(String(formData.get("page") || "1"));
  const take = getPageSize(String(formData.get("take") || String(DEFAULT_PAGE_SIZE)));
  const sort = getSortField(String(formData.get("sort") || ""));
  const dir = getSortDirection(String(formData.get("dir") || ""));
  const filter = getTagFilter(String(formData.get("empty") || ""));
  await deleteTag(id);
  revalidatePath("/admin/tags");
  redirectToTagsPage({ page, take, sort, dir, filter, notice: "deleted" });
}

function getPageNumber(value: string | string[] | undefined) {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function getPageSize(value: string | string[] | undefined) {
  const take = Number(Array.isArray(value) ? value[0] : value);
  return PAGE_SIZE_OPTIONS.includes(take as (typeof PAGE_SIZE_OPTIONS)[number]) ? take : DEFAULT_PAGE_SIZE;
}

function getSortField(value: string | string[] | undefined) {
  const sort = String(Array.isArray(value) ? value[0] : value);
  return TAG_SORT_FIELDS.includes(sort as TagSortField) ? (sort as TagSortField) : null;
}

function getSortDirection(value: string | string[] | undefined): SortDirection {
  const dir = String(Array.isArray(value) ? value[0] : value).toLowerCase();
  return dir === "desc" ? "desc" : "asc";
}

function getTagFilter(value: string | string[] | undefined): TagFilter {
  return String(Array.isArray(value) ? value[0] : value) === "1" ? "empty" : null;
}

function redirectToTagsPage(options: {
  page: number;
  take: number;
  sort?: TagSortField | null;
  dir?: SortDirection;
  filter?: TagFilter;
  notice?: string;
  error?: string;
}) {
  const params = new URLSearchParams();
  if (options.page > 1) params.set("page", String(options.page));
  if (options.take !== DEFAULT_PAGE_SIZE) params.set("take", String(options.take));
  if (options.sort) {
    params.set("sort", options.sort);
    params.set("dir", options.dir || "asc");
  }
  if (options.filter === "empty") params.set("empty", "1");
  if (options.notice) params.set("notice", options.notice);
  if (options.error) params.set("error", options.error);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  redirect(`/admin/tags${suffix}`);
}

function buildSortHref(options: {
  field: TagSortField;
  currentSort: TagSortField | null;
  currentDir: SortDirection;
  currentTake: number;
  currentFilter: TagFilter;
}) {
  const nextDir = options.currentSort === options.field && options.currentDir === "asc" ? "desc" : "asc";
  const params = new URLSearchParams();
  params.set("sort", options.field);
  params.set("dir", nextDir);
  params.set("take", String(options.currentTake));
  params.set("page", "1");
  if (options.currentFilter === "empty") params.set("empty", "1");
  return `/admin/tags?${params.toString()}`;
}

function buildPageHref(base: string, options: { page: number; take: number; sort: TagSortField | null; dir: SortDirection; filter: TagFilter }) {
  const params = new URLSearchParams();
  if (options.page > 1) params.set("page", String(options.page));
  if (options.take !== DEFAULT_PAGE_SIZE) params.set("take", String(options.take));
  if (options.sort) {
    params.set("sort", options.sort);
    params.set("dir", options.dir);
  }
  if (options.filter === "empty") params.set("empty", "1");
  return params.toString() ? `${base}?${params.toString()}` : base;
}

function compareText(a: string, b: string) {
  return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
}

function sortTags(tags: Awaited<ReturnType<typeof listTags>>, sort: TagSortField | null, dir: SortDirection) {
  const factor = dir === "asc" ? 1 : -1;
  return [...tags].sort((left, right) => {
    let result = 0;
    if (!sort || sort === "name") {
      result = compareText(left.name, right.name);
    } else if (sort === "slug") {
      result = compareText(left.slug, right.slug);
    } else if (sort === "postsCount") {
      result = (left._count.posts ?? 0) - (right._count.posts ?? 0);
    }

    if (result === 0) {
      result = compareText(left.name, right.name);
    }

    return result * factor;
  });
}

export default async function AdminTagsPage({ searchParams }: { searchParams: { page?: string; take?: string; sort?: string; dir?: string; empty?: string; notice?: string; error?: string } }) {
  await requireAdmin();
  const currentPage = getPageNumber(searchParams.page);
  const currentTake = getPageSize(searchParams.take);
  const currentSort = getSortField(searchParams.sort);
  const currentDir = getSortDirection(searchParams.dir);
  const currentFilter = getTagFilter(searchParams.empty);
  const skip = (currentPage - 1) * currentTake;
  const [allTags, postsWithoutTag] = await Promise.all([listTags(), countPostsWithoutTag()]);
  const tagsWithoutPosts = allTags.filter((tag) => (tag._count.posts ?? 0) === 0).length;
  const filteredTags = currentFilter === "empty" ? allTags.filter((tag) => (tag._count.posts ?? 0) === 0) : allTags;
  const sortedTags = sortTags(filteredTags, currentSort, currentDir);
  const total = sortedTags.length;
  const tags = sortedTags.slice(skip, skip + currentTake);
  const hasMore = skip + tags.length < total;
  const totalPages = Math.max(1, Math.ceil(total / currentTake));
  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <main className="admin-shell">
      <AdminNav />
      <div className="admin-container">
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="admin-metric">
            <p className="admin-metric-label">Total de tags</p>
            <p className="admin-metric-value">{allTags.length}</p>
          </div>
          <Link
            href={`/admin/posts?tags=${encodeURIComponent(EMPTY_TAXONOMY_FILTER)}`}
            className="admin-metric block h-full text-left hover:border-primary/30 hover:bg-[#f6f7f7]"
          >
            <p className="admin-metric-label">Posts sem tag</p>
            <p className="admin-metric-value">{postsWithoutTag}</p>
          </Link>
          <Link
            href={buildPageHref("/admin/tags", { page: 1, take: currentTake, sort: currentSort, dir: currentDir, filter: currentFilter === "empty" ? null : "empty" })}
            className={`admin-metric block h-full text-left ${currentFilter === "empty" ? "border-primary/40 bg-[#f0f6fc] ring-2 ring-primary/20" : "hover:border-primary/30 hover:bg-[#f6f7f7]"}`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="admin-metric-label">Tags sem posts</p>
              {currentFilter === "empty" ? <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">Ativo</span> : null}
            </div>
            <p className="admin-metric-value">{tagsWithoutPosts}</p>
          </Link>
        </div>
        <form action={createTag} className="admin-panel mb-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <input type="hidden" name="page" value={currentPage} />
          <input type="hidden" name="take" value={currentTake} />
          <input type="hidden" name="sort" value={currentSort ?? ""} />
          <input type="hidden" name="dir" value={currentDir} />
          <input type="hidden" name="empty" value={currentFilter === "empty" ? "1" : ""} />
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">
              Nome <span className="text-red-700">*</span>
            </span>
            <input name="name" className="admin-input min-w-0 flex-1" placeholder="Nome da tag" required minLength={2} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">Slug</span>
            <input name="slug" className="admin-input min-w-0 flex-1" placeholder="Slug opcional" />
          </label>
          <button type="submit" className="admin-icon-button self-end" title="Adicionar tag" aria-label="Adicionar tag">
            <FaIcon name="fa-plus" />
          </button>
        </form>
        {searchParams.error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {searchParams.error === "duplicate_name"
              ? "Já existe uma tag com esse nome."
              : searchParams.error === "duplicate_slug"
                ? "Já existe uma tag com esse slug."
                : searchParams.error === "required_name"
                  ? "O nome da tag é obrigatório."
                  : searchParams.error === "required_slug"
                    ? "O slug da tag é inválido."
                    : "Não foi possível salvar a tag."}
          </div>
        ) : searchParams.notice ? (
          <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${searchParams.notice === "deleted" ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "border border-sky-200 bg-sky-50 text-sky-800"}`}>
            {searchParams.notice === "deleted" ? "A tag foi excluída com sucesso." : "A tag foi salva com sucesso."}
          </div>
        ) : null}
        <div className="admin-surface">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead className="admin-table-head">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap font-semibold">
                    <Link href={buildSortHref({ field: "name", currentSort, currentDir, currentTake, currentFilter })} className="inline-flex items-center gap-2 whitespace-nowrap hover:text-ink">
                      Nome
                      {currentSort === "name" ? <FaIcon name={currentDir === "asc" ? "fa-arrow-up-wide-short" : "fa-arrow-down-wide-short"} /> : null}
                    </Link>
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap font-semibold">
                    <Link href={buildSortHref({ field: "slug", currentSort, currentDir, currentTake, currentFilter })} className="inline-flex items-center gap-2 whitespace-nowrap hover:text-ink">
                      Slug
                      {currentSort === "slug" ? <FaIcon name={currentDir === "asc" ? "fa-arrow-up-wide-short" : "fa-arrow-down-wide-short"} /> : null}
                    </Link>
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap font-semibold">
                    <Link href={buildSortHref({ field: "postsCount", currentSort, currentDir, currentTake, currentFilter })} className="inline-flex items-center gap-2 whitespace-nowrap hover:text-ink">
                      Posts
                      {currentSort === "postsCount" ? <FaIcon name={currentDir === "asc" ? "fa-arrow-up-wide-short" : "fa-arrow-down-wide-short"} /> : null}
                    </Link>
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap text-right font-semibold">Ações rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efe4da]">
                {tags.map((tag) => (
                  <EditableTagRow
                    key={tag.id}
                    tag={{ ...tag, postsCount: tag._count.posts }}
                    page={currentPage}
                    take={currentTake}
                    sort={currentSort ?? ""}
                    dir={currentDir}
                    saveAction={saveTag}
                    deleteAction={removeTag}
                  />
                ))}
                {tags.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted">
                      Nenhuma tag encontrada.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eaded3] bg-[#f6f7f7]/70 px-4 py-4 text-sm">
            <span className="text-muted">
              Página {currentPage} de {totalPages} · {total} {total === 1 ? "tag" : "tags"}
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <PostsPageSizeSelect value={currentTake} path="/admin/tags" />
              <div className="flex gap-2">
                <Link
                  href={buildPageHref("/admin/tags", { page: previousPage, take: currentTake, sort: currentSort, dir: currentDir, filter: currentFilter })}
                  aria-disabled={currentPage <= 1}
                  className={`admin-button-secondary ${currentPage <= 1 ? "pointer-events-none opacity-45" : ""}`}
                >
                  Anterior
                </Link>
                <Link
                  href={buildPageHref("/admin/tags", { page: nextPage, take: currentTake, sort: currentSort, dir: currentDir, filter: currentFilter })}
                  aria-disabled={!hasMore}
                  className={`admin-button-secondary ${!hasMore ? "pointer-events-none opacity-45" : ""}`}
                >
                  Próxima
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
