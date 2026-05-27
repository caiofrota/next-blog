import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PostStatus } from "@prisma/client";
import { AdminNav } from "@/blog-engine/components/admin/admin-nav";
import { ConfirmSubmitButton } from "@/blog-engine/components/admin/confirm-submit-button";
import { CreatePostButton } from "@/blog-engine/components/admin/create-post-button";
import { FaIcon } from "@/blog-engine/components/admin/fa-icon";
import { PostsPagination } from "@/blog-engine/components/admin/posts-pagination";
import { PostsFilters } from "@/blog-engine/components/admin/posts-filters";
import { PostsPageSizeSelect } from "@/blog-engine/components/admin/posts-page-size-select";
import { requireAdmin } from "@/blog-engine/services/auth";
import { listCategories } from "@/blog-engine/services/categories";
import { deletePost, getAdminPostSummary, listAdminPostsPage, updatePostStatus } from "@/blog-engine/services/posts";
import { listTags } from "@/blog-engine/services/tags";
import { formatDate } from "@/lib/dates";
import { getPublicStorageUrl } from "@/blog-engine/storage/public-url";
import { parseMetaTags } from "@/blog-engine/seo/meta-tags";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;
const POST_SORT_FIELDS = ["title", "status", "categories", "tags", "metaTags", "publishedAt"] as const;
type PostSortField = (typeof POST_SORT_FIELDS)[number];
type SortDirection = "asc" | "desc";
type PostStatusFilter = "DRAFT" | "PUBLISHED" | "PENDING_CHANGES" | "SCHEDULED" | null;
type PostListFilter = string[];

async function changePostStatus(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id"));
  const page = getPageNumber(String(formData.get("page") || "1"));
  const take = getPageSize(String(formData.get("take") || String(DEFAULT_PAGE_SIZE)));
  const sort = getSortField(String(formData.get("sort") || ""));
  const dir = getSortDirection(String(formData.get("dir") || ""));
  const title = String(formData.get("title") || "");
  const statusFilter = getStatusFilter(String(formData.get("statusFilter") || ""));
  const categories = getListFilter(String(formData.get("categories") || ""));
  const tags = getListFilter(String(formData.get("tags") || ""));
  const status = String(formData.get("status"));
  await updatePostStatus(id, status === "PUBLISHED" ? PostStatus.PUBLISHED : PostStatus.DRAFT);
  revalidatePath("/admin/posts");
  redirectToPostsPage({ page, take, sort, dir, title, statusFilter, categories, tags });
}

async function removePost(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id"));
  const page = getPageNumber(String(formData.get("page") || "1"));
  const take = getPageSize(String(formData.get("take") || String(DEFAULT_PAGE_SIZE)));
  const sort = getSortField(String(formData.get("sort") || ""));
  const dir = getSortDirection(String(formData.get("dir") || ""));
  const title = String(formData.get("title") || "");
  const statusFilter = getStatusFilter(String(formData.get("statusFilter") || ""));
  const categories = getListFilter(String(formData.get("categories") || ""));
  const tags = getListFilter(String(formData.get("tags") || ""));
  await deletePost(id);
  revalidatePath("/admin/posts");
  redirectToPostsPage({ page, take, sort, dir, title, statusFilter, categories, tags });
}

function getPageNumber(value: string | string[] | undefined) {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function redirectToPostsPage(options: {
  page: number;
  take: number;
  sort?: PostSortField | null;
  dir?: SortDirection;
  title?: string;
  statusFilter?: PostStatusFilter;
  categories?: string[];
  tags?: string[];
}) {
  const params = new URLSearchParams();
  if (options.page > 1) params.set("page", String(options.page));
  if (options.take !== DEFAULT_PAGE_SIZE) params.set("take", String(options.take));
  if (options.sort) params.set("sort", options.sort);
  if (options.dir && options.sort) params.set("dir", options.dir);
  if (options.title) params.set("title", options.title);
  if (options.statusFilter) params.set("status", options.statusFilter);
  if (options.categories && options.categories.length > 0) params.set("categories", options.categories.join(","));
  if (options.tags && options.tags.length > 0) params.set("tags", options.tags.join(","));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  redirect(`/admin/posts${suffix}`);
}

function getPageSize(value: string | string[] | undefined) {
  const take = Number(Array.isArray(value) ? value[0] : value);
  return PAGE_SIZE_OPTIONS.includes(take as (typeof PAGE_SIZE_OPTIONS)[number]) ? take : DEFAULT_PAGE_SIZE;
}

function getSortField(value: string | string[] | undefined) {
  const sort = String(Array.isArray(value) ? value[0] : value);
  return POST_SORT_FIELDS.includes(sort as PostSortField) ? (sort as PostSortField) : null;
}

function getSortDirection(value: string | string[] | undefined): SortDirection {
  const dir = String(Array.isArray(value) ? value[0] : value).toLowerCase();
  return dir === "asc" ? "asc" : "desc";
}

function getStatusFilter(value: string | string[] | undefined): PostStatusFilter {
  const status = String(Array.isArray(value) ? value[0] : value).toUpperCase();
  return status === "DRAFT" || status === "PUBLISHED" || status === "PENDING_CHANGES" || status === "SCHEDULED"
    ? (status as PostStatusFilter)
    : null;
}

function getListFilter(value: string | string[] | undefined) {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized) return [];

  const raw = normalized
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(raw));
}

function buildSortHref(options: {
  field: PostSortField;
  currentSort: PostSortField | null;
  currentDir: SortDirection;
  currentPage: number;
  currentTake: number;
  title: string;
  statusFilter: PostStatusFilter;
  categories: PostListFilter;
  tags: PostListFilter;
}) {
  const nextDir = options.currentSort === options.field && options.currentDir === "asc" ? "desc" : "asc";
  const params = new URLSearchParams();
  params.set("sort", options.field);
  params.set("dir", nextDir);
  params.set("take", String(options.currentTake));
  params.set("page", "1");
  if (options.title) params.set("title", options.title);
  if (options.statusFilter) params.set("status", options.statusFilter);
  if (options.categories.length > 0) params.set("categories", options.categories.join(","));
  if (options.tags.length > 0) params.set("tags", options.tags.join(","));
  return `/admin/posts?${params.toString()}`;
}

function buildSummaryHref(status: PostStatusFilter, take: number) {
  const params = new URLSearchParams();
  if (take !== DEFAULT_PAGE_SIZE) params.set("take", String(take));
  if (status) params.set("status", status);
  return params.toString() ? `/admin/posts?${params.toString()}` : "/admin/posts";
}

function getSummaryMetricClassName(active: boolean) {
  return `admin-metric block h-full text-left ${
    active ? "border-primary/40 bg-[#f0f6fc] ring-2 ring-primary/20" : "hover:border-primary/30 hover:bg-[#f6f7f7]"
  }`;
}

function getPostDisplayStatus(post: { status: PostStatus; publishedAt: Date | null }, now: Date) {
  if (post.status === PostStatus.PUBLISHED && post.publishedAt && post.publishedAt.getTime() > now.getTime()) {
    return "SCHEDULED" as const;
  }

  return post.status;
}

function getStatusLabel(status: PostStatus | "SCHEDULED") {
  if (status === "SCHEDULED") return "Agendado";
  return status === PostStatus.PUBLISHED ? "Publicado" : "Rascunho";
}

function getStatusClassName(status: PostStatus | "SCHEDULED") {
  if (status === "SCHEDULED") {
    return "border-sky-200 bg-sky-50 text-sky-800";
  }

  return status === PostStatus.PUBLISHED
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-amber-200 bg-amber-50 text-amber-800";
}

function renderTaxonomy(items: { id: string; name: string; slug: string }[], emptyLabel: string) {
  if (items.length === 0) {
    return <span className="text-sm text-muted">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item.id} className="inline-flex max-w-full rounded-full border border-[#e7ddd4] bg-white px-2.5 py-1 text-xs font-semibold text-muted" title={item.name}>
          <span className="truncate">{item.name}</span>
        </span>
      ))}
    </div>
  );
}

function renderMetaTags(metaTags?: string | null) {
  const tags = parseMetaTags(metaTags);
  if (tags.length === 0) {
    return <span className="text-sm text-muted">Sem meta tags</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex max-w-full rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary" title={tag}>
          <span className="truncate">{tag}</span>
        </span>
      ))}
    </div>
  );
}

function renderPublicationDate(publishedAt: Date | null) {
  if (!publishedAt) return <span className="text-muted/70">Sem data</span>;
  return formatDate(publishedAt);
}

export default async function AdminPostsPage({
  searchParams
}: {
  searchParams: { page?: string; take?: string; sort?: string; dir?: string; title?: string; status?: string; categories?: string; tags?: string };
}) {
  await requireAdmin();
  const currentPage = getPageNumber(searchParams.page);
  const currentTake = getPageSize(searchParams.take);
  const currentSort = getSortField(searchParams.sort);
  const currentDir = getSortDirection(searchParams.dir);
  const currentTitle = String(searchParams.title ?? "");
  const currentStatusFilter = getStatusFilter(searchParams.status);
  const currentCategories = getListFilter(searchParams.categories);
  const currentTags = getListFilter(searchParams.tags);
  const skip = (currentPage - 1) * currentTake;
  const now = new Date();
  const [summary, page, categoriesRaw, tagsRaw] = await Promise.all([
    getAdminPostSummary(),
    listAdminPostsPage({
      take: currentTake,
      skip,
      sort: currentSort ?? undefined,
      dir: currentDir,
      filters: {
        title: currentTitle,
        status: currentStatusFilter ?? undefined,
        categorySlugs: currentCategories,
        tagSlugs: currentTags
      }
    }),
    listCategories(),
    listTags()
  ]);
  const categories = categoriesRaw;
  const { posts, total, hasMore } = page;
  const visibleTags = tagsRaw;
  const totalPages = Math.max(1, Math.ceil(total / currentTake));
  const hasActiveFilters = Boolean(currentTitle || currentStatusFilter || currentCategories.length > 0 || currentTags.length > 0);
  const hasNonStatusFilters = Boolean(currentTitle || currentCategories.length > 0 || currentTags.length > 0);

  return (
    <main className="admin-shell">
      <AdminNav />
      <div className="admin-container">
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Link href={buildSummaryHref(null, currentTake)} className={getSummaryMetricClassName(!hasActiveFilters)}>
            <p className="admin-metric-label">Total</p>
            <p className="admin-metric-value">{summary.total}</p>
          </Link>
          <Link href={buildSummaryHref("PUBLISHED", currentTake)} className={getSummaryMetricClassName(currentStatusFilter === "PUBLISHED" && !hasNonStatusFilters)}>
            <p className="admin-metric-label">Publicados</p>
            <p className="admin-metric-value">{summary.published}</p>
          </Link>
          <Link href={buildSummaryHref("SCHEDULED", currentTake)} className={getSummaryMetricClassName(currentStatusFilter === "SCHEDULED" && !hasNonStatusFilters)}>
            <p className="admin-metric-label">Agendados</p>
            <p className="admin-metric-value">{summary.scheduled}</p>
          </Link>
          <Link href={buildSummaryHref("DRAFT", currentTake)} className={getSummaryMetricClassName(currentStatusFilter === "DRAFT" && !hasNonStatusFilters)}>
            <p className="admin-metric-label">Rascunhos</p>
            <p className="admin-metric-value">{summary.drafts}</p>
          </Link>
          <Link href={buildSummaryHref("PENDING_CHANGES", currentTake)} className={getSummaryMetricClassName(currentStatusFilter === "PENDING_CHANGES" && !hasNonStatusFilters)}>
            <p className="admin-metric-label">Pendências</p>
            <p className="admin-metric-value">{summary.unpublishedChanges}</p>
          </Link>
        </div>
        <PostsFilters
          path="/admin/posts"
          title={currentTitle}
          status={currentStatusFilter ?? ""}
          categorySlugs={currentCategories}
          tagSlugs={currentTags}
          categories={categories.map((category) => ({ id: category.id, name: category.name, slug: category.slug }))}
          tags={visibleTags.map((tag) => ({ id: tag.id, name: tag.name, slug: tag.slug }))}
        />
        <div className="mb-4 flex justify-end">
          <CreatePostButton />
        </div>
        <div className="admin-surface transition-opacity duration-200 ease-out">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead className="admin-table-head">
                <tr>
                  <th className="px-4 py-3 font-semibold">Imagem</th>
                  <th className="px-4 py-3 font-semibold">
                    <Link
                      href={buildSortHref({
                        field: "title",
                        currentSort,
                        currentDir,
                        currentPage,
                        currentTake,
                        title: currentTitle,
                        statusFilter: currentStatusFilter,
                        categories: currentCategories,
                        tags: currentTags
                      })}
                      className="inline-flex items-center gap-2 whitespace-nowrap hover:text-ink"
                    >
                      Título
                      {currentSort === "title" ? <FaIcon name={currentDir === "asc" ? "fa-arrow-up-wide-short" : "fa-arrow-down-wide-short"} /> : null}
                    </Link>
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    <Link
                      href={buildSortHref({
                        field: "status",
                        currentSort,
                        currentDir,
                        currentPage,
                        currentTake,
                        title: currentTitle,
                        statusFilter: currentStatusFilter,
                        categories: currentCategories,
                        tags: currentTags
                      })}
                      className="inline-flex items-center gap-2 whitespace-nowrap hover:text-ink"
                    >
                      Status
                      {currentSort === "status" ? <FaIcon name={currentDir === "asc" ? "fa-arrow-up-wide-short" : "fa-arrow-down-wide-short"} /> : null}
                    </Link>
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    <Link
                      href={buildSortHref({
                        field: "categories",
                        currentSort,
                        currentDir,
                        currentPage,
                        currentTake,
                        title: currentTitle,
                        statusFilter: currentStatusFilter,
                        categories: currentCategories,
                        tags: currentTags
                      })}
                      className="inline-flex items-center gap-2 whitespace-nowrap hover:text-ink"
                    >
                      Categorias
                      {currentSort === "categories" ? <FaIcon name={currentDir === "asc" ? "fa-arrow-up-wide-short" : "fa-arrow-down-wide-short"} /> : null}
                    </Link>
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    <Link
                      href={buildSortHref({
                        field: "tags",
                        currentSort,
                        currentDir,
                        currentPage,
                        currentTake,
                        title: currentTitle,
                        statusFilter: currentStatusFilter,
                        categories: currentCategories,
                        tags: currentTags
                      })}
                      className="inline-flex items-center gap-2 whitespace-nowrap hover:text-ink"
                    >
                      Tags
                      {currentSort === "tags" ? <FaIcon name={currentDir === "asc" ? "fa-arrow-up-wide-short" : "fa-arrow-down-wide-short"} /> : null}
                    </Link>
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    <Link
                      href={buildSortHref({
                        field: "metaTags",
                        currentSort,
                        currentDir,
                        currentPage,
                        currentTake,
                        title: currentTitle,
                        statusFilter: currentStatusFilter,
                        categories: currentCategories,
                        tags: currentTags
                      })}
                      className="inline-flex items-center gap-2 whitespace-nowrap hover:text-ink"
                    >
                      Meta tags
                      {currentSort === "metaTags" ? <FaIcon name={currentDir === "asc" ? "fa-arrow-up-wide-short" : "fa-arrow-down-wide-short"} /> : null}
                    </Link>
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    <Link
                      href={buildSortHref({
                        field: "publishedAt",
                        currentSort,
                        currentDir,
                        currentPage,
                        currentTake,
                        title: currentTitle,
                        statusFilter: currentStatusFilter,
                        categories: currentCategories,
                        tags: currentTags
                      })}
                      className="inline-flex items-center gap-2 whitespace-nowrap hover:text-ink"
                    >
                      Publicação
                      {currentSort === "publishedAt" ? <FaIcon name={currentDir === "asc" ? "fa-arrow-up-wide-short" : "fa-arrow-down-wide-short"} /> : null}
                    </Link>
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">Ações rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efe4da]">
                {posts.map((post) => {
                  const targetStatus = post.status === PostStatus.PUBLISHED ? PostStatus.DRAFT : PostStatus.PUBLISHED;

                  return (
                    <tr key={post.id} className="admin-table-row">
                      <td className="px-4 py-4 align-middle" data-label="Imagem">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-[#eaded3] bg-[#f1e6dd] sm:h-16 sm:w-16">
                          {post.coverImage ? (
                            <Image
                              src={getPublicStorageUrl(post.coverImage.key)}
                              alt={post.coverImage.altText ?? post.title}
                              fill
                              sizes="64px"
                              quality={90}
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted/50">
                              <FaIcon name="fa-image" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle" data-label="Título">
                        <div className="min-w-0">
                          <Link href={`/admin/posts/${post.id}`} className="font-semibold text-ink underline-offset-4 hover:text-primary hover:underline">
                            {post.title}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle" data-label="Status">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClassName(getPostDisplayStatus(post, now))}`}>
                          {getStatusLabel(getPostDisplayStatus(post, now))}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-middle" data-label="Categorias">
                        {renderTaxonomy(post.categories, "Sem categoria")}
                      </td>
                      <td className="px-4 py-4 align-middle" data-label="Tags">
                        {renderTaxonomy(post.tags, "Sem tags")}
                      </td>
                      <td className="px-4 py-4 align-middle" data-label="Meta tags">
                        {renderMetaTags(post.metaTags)}
                      </td>
                      <td className="px-4 py-4 align-middle text-muted" data-label="Publicação">{renderPublicationDate(post.publishedAt)}</td>
                      <td className="px-4 py-4 align-middle" data-label="Ações rápidas">
                        <div className="admin-action-group justify-end">
                          <Link href={`/admin/posts/${post.id}`} className="admin-icon-button" title="Editar post" aria-label="Editar post">
                            <FaIcon name="fa-pen-to-square" />
                          </Link>
                          <form action={changePostStatus}>
                            <input type="hidden" name="id" value={post.id} />
                            <input type="hidden" name="page" value={currentPage} />
                            <input type="hidden" name="take" value={currentTake} />
                            <input type="hidden" name="sort" value={currentSort ?? ""} />
                            <input type="hidden" name="dir" value={currentDir} />
                            <input type="hidden" name="title" value={currentTitle} />
                            <input type="hidden" name="statusFilter" value={currentStatusFilter ?? ""} />
                            <input type="hidden" name="categories" value={currentCategories.join(",")} />
                            <input type="hidden" name="tags" value={currentTags.join(",")} />
                            <input type="hidden" name="status" value={targetStatus} />
                            <button
                              className="admin-icon-button"
                              title={targetStatus === PostStatus.PUBLISHED ? "Publicar post" : "Voltar para rascunho"}
                              aria-label={targetStatus === PostStatus.PUBLISHED ? "Publicar post" : "Voltar para rascunho"}
                            >
                              <FaIcon name={targetStatus === PostStatus.PUBLISHED ? "fa-paper-plane" : "fa-file-circle-xmark"} />
                            </button>
                          </form>
                          <form action={removePost}>
                            <input type="hidden" name="id" value={post.id} />
                            <input type="hidden" name="page" value={currentPage} />
                            <input type="hidden" name="take" value={currentTake} />
                            <input type="hidden" name="sort" value={currentSort ?? ""} />
                            <input type="hidden" name="dir" value={currentDir} />
                            <input type="hidden" name="title" value={currentTitle} />
                            <input type="hidden" name="statusFilter" value={currentStatusFilter ?? ""} />
                            <input type="hidden" name="categories" value={currentCategories.join(",")} />
                            <input type="hidden" name="tags" value={currentTags.join(",")} />
                            <ConfirmSubmitButton
                              confirmLabel="Excluir"
                              confirmMessage={`Excluir o post "${post.title}"? Essa ação não pode ser desfeita.`}
                              modalTitle="Confirmar exclusão"
                              className="admin-icon-button-danger"
                              title="Excluir post"
                              aria-label="Excluir post"
                            >
                              <FaIcon name="fa-trash-can" />
                            </ConfirmSubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted">
                      Nenhum post encontrado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eaded3] bg-[#f6f7f7]/70 px-4 py-4 text-sm transition-opacity duration-200 ease-out">
            <span className="text-muted">
              Página {currentPage} de {totalPages} · {total} {total === 1 ? "post" : "posts"}
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <PostsPageSizeSelect value={currentTake} path="/admin/posts" />
              <PostsPagination
                path="/admin/posts"
                currentPage={currentPage}
                totalPages={totalPages}
                hasMore={hasMore}
                take={currentTake}
                sort={currentSort}
                dir={currentDir}
                title={currentTitle}
                statusFilter={currentStatusFilter}
                categories={currentCategories}
                tags={currentTags}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
