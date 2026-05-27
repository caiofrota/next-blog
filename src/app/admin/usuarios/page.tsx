import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { isRedirectError } from "next/dist/client/components/redirect";
import { AdminNav } from "@/blog-engine/components/admin/admin-nav";
import { EditableUserRow } from "@/blog-engine/components/admin/editable-user-row";
import { FaIcon } from "@/blog-engine/components/admin/fa-icon";
import { PostsPageSizeSelect } from "@/blog-engine/components/admin/posts-page-size-select";
import { requireAdmin } from "@/blog-engine/services/auth";
import { createAdminUser, deleteAdminUser, listAdminUsers, sortAdminUsers, updateAdminUser, type AdminUserSortField, type SortDirection } from "@/blog-engine/services/users";
import { formatDate } from "@/lib/dates";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 10;
const USER_SORT_FIELDS = ["name", "email", "role", "postsCount", "createdAt"] as const;

async function createUser(formData: FormData) {
  "use server";
  await requireAdmin();
  const page = getPageNumber(String(formData.get("page") || "1"));
  const take = getPageSize(String(formData.get("take") || String(DEFAULT_PAGE_SIZE)));
  const sort = getSortField(String(formData.get("sort") || ""));
  const dir = getSortDirection(String(formData.get("dir") || ""));

  try {
    await createAdminUser({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      role: String(formData.get("role") ?? UserRole.ADMIN),
      password: String(formData.get("password") ?? "")
    });
    revalidatePath("/admin/usuarios");
    redirectToUsersPage({ page, take, sort, dir, notice: "saved" });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirectToUsersPage({ page, take, sort, dir, error: error instanceof Error ? error.message : "unknown" });
  }
}

async function saveUser(formData: FormData) {
  "use server";
  await requireAdmin();
  const id = String(formData.get("id"));
  const page = getPageNumber(String(formData.get("page") || "1"));
  const take = getPageSize(String(formData.get("take") || String(DEFAULT_PAGE_SIZE)));
  const sort = getSortField(String(formData.get("sort") || ""));
  const dir = getSortDirection(String(formData.get("dir") || ""));

  try {
    await updateAdminUser(id, {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      role: String(formData.get("role") ?? UserRole.ADMIN),
      password: String(formData.get("password") ?? "")
    });
    revalidatePath("/admin/usuarios");
    redirectToUsersPage({ page, take, sort, dir, notice: "saved" });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirectToUsersPage({ page, take, sort, dir, error: error instanceof Error ? error.message : "unknown" });
  }
}

async function removeUser(formData: FormData) {
  "use server";
  const currentUser = await requireAdmin();
  const id = String(formData.get("id"));
  const page = getPageNumber(String(formData.get("page") || "1"));
  const take = getPageSize(String(formData.get("take") || String(DEFAULT_PAGE_SIZE)));
  const sort = getSortField(String(formData.get("sort") || ""));
  const dir = getSortDirection(String(formData.get("dir") || ""));

  try {
    await deleteAdminUser(id, currentUser.id);
    revalidatePath("/admin/usuarios");
    redirectToUsersPage({ page, take, sort, dir, notice: "deleted" });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    redirectToUsersPage({ page, take, sort, dir, error: error instanceof Error ? error.message : "unknown" });
  }
}

function getPageNumber(value: string | string[] | undefined) {
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function getPageSize(value: string | string[] | undefined) {
  const take = Number(Array.isArray(value) ? value[0] : value);
  return PAGE_SIZE_OPTIONS.includes(take as (typeof PAGE_SIZE_OPTIONS)[number]) ? take : DEFAULT_PAGE_SIZE;
}

function getSortField(value: string | string[] | undefined): AdminUserSortField | null {
  const sort = String(Array.isArray(value) ? value[0] : value);
  return USER_SORT_FIELDS.includes(sort as AdminUserSortField) ? (sort as AdminUserSortField) : null;
}

function getSortDirection(value: string | string[] | undefined): SortDirection {
  const dir = String(Array.isArray(value) ? value[0] : value).toLowerCase();
  return dir === "desc" ? "desc" : "asc";
}

function redirectToUsersPage(options: {
  page: number;
  take: number;
  sort?: AdminUserSortField | null;
  dir?: SortDirection;
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
  if (options.notice) params.set("notice", options.notice);
  if (options.error) params.set("error", options.error);
  redirect(`/admin/usuarios${params.toString() ? `?${params.toString()}` : ""}`);
}

function buildSortHref(options: {
  field: AdminUserSortField;
  currentSort: AdminUserSortField | null;
  currentDir: SortDirection;
  currentTake: number;
}) {
  const nextDir = options.currentSort === options.field && options.currentDir === "asc" ? "desc" : "asc";
  const params = new URLSearchParams();
  params.set("sort", options.field);
  params.set("dir", nextDir);
  params.set("take", String(options.currentTake));
  params.set("page", "1");
  return `/admin/usuarios?${params.toString()}`;
}

function buildPageHref(options: { page: number; take: number; sort: AdminUserSortField | null; dir: SortDirection }) {
  const params = new URLSearchParams();
  if (options.page > 1) params.set("page", String(options.page));
  if (options.take !== DEFAULT_PAGE_SIZE) params.set("take", String(options.take));
  if (options.sort) {
    params.set("sort", options.sort);
    params.set("dir", options.dir);
  }
  return `/admin/usuarios${params.toString() ? `?${params.toString()}` : ""}`;
}

function getErrorMessage(error: string) {
  if (error === "required_name") return "O nome do usuário é obrigatório.";
  if (error === "invalid_email") return "Informe um email válido.";
  if (error === "invalid_password") return "A senha deve ter pelo menos 8 caracteres.";
  if (error === "duplicate_email") return "Já existe um usuário com esse email.";
  if (error === "cannot_delete_self") return "Você não pode excluir seu próprio usuário.";
  if (error === "user_has_posts") return "Não é possível excluir um usuário que possui posts.";
  return "Não foi possível salvar o usuário.";
}

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: { page?: string; take?: string; sort?: string; dir?: string; notice?: string; error?: string };
}) {
  const currentUser = await requireAdmin();
  const currentPage = getPageNumber(searchParams.page);
  const currentTake = getPageSize(searchParams.take);
  const currentSort = getSortField(searchParams.sort);
  const currentDir = getSortDirection(searchParams.dir);
  const skip = (currentPage - 1) * currentTake;
  const allUsers = await listAdminUsers();
  const sortedUsers = sortAdminUsers(allUsers, currentSort, currentDir);
  const total = sortedUsers.length;
  const users = sortedUsers.slice(skip, skip + currentTake);
  const hasMore = skip + users.length < total;
  const totalPages = Math.max(1, Math.ceil(total / currentTake));
  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);
  const adminCount = allUsers.filter((user) => user.role === UserRole.ADMIN).length;
  const editorCount = allUsers.filter((user) => user.role === UserRole.EDITOR).length;

  return (
    <main className="admin-shell">
      <AdminNav />
      <div className="admin-container">
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="admin-metric">
            <p className="admin-metric-label">Total de usuários</p>
            <p className="admin-metric-value">{allUsers.length}</p>
          </div>
          <div className="admin-metric">
            <p className="admin-metric-label">Administradores</p>
            <p className="admin-metric-value">{adminCount}</p>
          </div>
          <div className="admin-metric">
            <p className="admin-metric-label">Editores</p>
            <p className="admin-metric-value">{editorCount}</p>
          </div>
        </div>

        <form action={createUser} className="admin-panel mb-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto]">
          <input type="hidden" name="page" value={currentPage} />
          <input type="hidden" name="take" value={currentTake} />
          <input type="hidden" name="sort" value={currentSort ?? ""} />
          <input type="hidden" name="dir" value={currentDir} />
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">
              Nome <span className="text-red-700">*</span>
            </span>
            <input name="name" className="admin-input min-w-0" placeholder="Nome do usuário" required minLength={2} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">
              Email <span className="text-red-700">*</span>
            </span>
            <input name="email" type="email" className="admin-input min-w-0" placeholder="email@dominio.com" required />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">Perfil</span>
            <select name="role" className="admin-input min-w-0" defaultValue={UserRole.ADMIN}>
              <option value={UserRole.ADMIN}>Administrador</option>
              <option value={UserRole.EDITOR}>Editor</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-ink">
              Senha <span className="text-red-700">*</span>
            </span>
            <input name="password" type="password" className="admin-input min-w-0" placeholder="Mínimo 8 caracteres" required minLength={8} />
          </label>
          <button type="submit" className="admin-icon-button self-end" title="Adicionar usuário" aria-label="Adicionar usuário">
            <FaIcon name="fa-plus" />
          </button>
        </form>

        {searchParams.error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {getErrorMessage(searchParams.error)}
          </div>
        ) : searchParams.notice ? (
          <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${searchParams.notice === "deleted" ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "border border-sky-200 bg-sky-50 text-sky-800"}`}>
            {searchParams.notice === "deleted" ? "O usuário foi excluído com sucesso." : "O usuário foi salvo com sucesso."}
          </div>
        ) : null}

        <div className="admin-surface">
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead className="admin-table-head">
                <tr>
                  {[
                    ["name", "Nome"],
                    ["email", "Email"],
                    ["role", "Perfil"]
                  ].map(([field, label]) => (
                    <th key={field} className="px-4 py-3 whitespace-nowrap font-semibold">
                      <Link
                        href={buildSortHref({ field: field as AdminUserSortField, currentSort, currentDir, currentTake })}
                        className="inline-flex items-center gap-2 whitespace-nowrap hover:text-ink"
                      >
                        {label}
                        {currentSort === field ? <FaIcon name={currentDir === "asc" ? "fa-arrow-up-wide-short" : "fa-arrow-down-wide-short"} /> : null}
                      </Link>
                    </th>
                  ))}
                  <th className="px-4 py-3 whitespace-nowrap font-semibold">Senha</th>
                  {[
                    ["postsCount", "Posts"],
                    ["createdAt", "Criado em"]
                  ].map(([field, label]) => (
                    <th key={field} className="px-4 py-3 whitespace-nowrap font-semibold">
                      <Link
                        href={buildSortHref({ field: field as AdminUserSortField, currentSort, currentDir, currentTake })}
                        className="inline-flex items-center gap-2 whitespace-nowrap hover:text-ink"
                      >
                        {label}
                        {currentSort === field ? <FaIcon name={currentDir === "asc" ? "fa-arrow-up-wide-short" : "fa-arrow-down-wide-short"} /> : null}
                      </Link>
                    </th>
                  ))}
                  <th className="px-4 py-3 whitespace-nowrap text-right font-semibold">Ações rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efe4da]">
                {users.map((user) => (
                  <EditableUserRow
                    key={user.id}
                    user={{
                      id: user.id,
                      name: user.name,
                      email: user.email,
                      role: user.role,
                      postsCount: user._count.posts,
                      createdAt: formatDate(user.createdAt)
                    }}
                    currentUserId={currentUser.id}
                    page={currentPage}
                    take={currentTake}
                    sort={currentSort ?? ""}
                    dir={currentDir}
                    saveAction={saveUser}
                    deleteAction={removeUser}
                  />
                ))}
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eaded3] bg-[#f6f7f7]/70 px-4 py-4 text-sm">
            <span className="text-muted">
              Página {currentPage} de {totalPages} · {total} {total === 1 ? "usuário" : "usuários"}
            </span>
            <div className="flex flex-wrap items-center gap-4">
              <PostsPageSizeSelect value={currentTake} path="/admin/usuarios" />
              <div className="flex gap-2">
                <Link
                  href={buildPageHref({ page: previousPage, take: currentTake, sort: currentSort, dir: currentDir })}
                  aria-disabled={currentPage <= 1}
                  className={`admin-button-secondary ${currentPage <= 1 ? "pointer-events-none opacity-45" : ""}`}
                >
                  Anterior
                </Link>
                <Link
                  href={buildPageHref({ page: nextPage, take: currentTake, sort: currentSort, dir: currentDir })}
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
