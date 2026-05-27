"use client";

import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";

type PostSortField = "title" | "status" | "categories" | "tags" | "metaTags" | "publishedAt" | null;
type SortDirection = "asc" | "desc";
type PostStatusFilter = "DRAFT" | "PUBLISHED" | "PENDING_CHANGES" | "SCHEDULED" | null;

export function PostsPagination({
  path,
  currentPage,
  totalPages,
  hasMore,
  take,
  sort,
  dir,
  title,
  statusFilter,
  categories,
  tags
}: {
  path: string;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  take: number;
  sort: PostSortField;
  dir: SortDirection;
  title: string;
  statusFilter: PostStatusFilter;
  categories: string[];
  tags: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (take !== 10) params.set("take", String(take));
    if (sort) {
      params.set("sort", sort);
      params.set("dir", dir);
    }
    if (title) params.set("title", title);
    if (statusFilter) params.set("status", statusFilter);
    if (categories.length > 0) params.set("categories", categories.join(","));
    if (tags.length > 0) params.set("tags", tags.join(","));
    return params;
  }, [categories, dir, sort, statusFilter, tags, take, title]);

  function navigate(page: number) {
    const params = new URLSearchParams(queryString.toString());
    if (page > 1) params.set("page", String(page));
    else params.delete("page");

    const href = params.toString() ? `${path}?${params.toString()}` : path;
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted/80">{isPending ? "Atualizando..." : null}</span>
      <button
        type="button"
        onClick={() => navigate(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1 || isPending}
        className={`admin-button-secondary transition-all duration-200 ${currentPage <= 1 || isPending ? "pointer-events-none opacity-45" : ""}`}
      >
        Anterior
      </button>
      <button
        type="button"
        onClick={() => navigate(Math.min(totalPages, currentPage + 1))}
        disabled={!hasMore || isPending}
        className={`admin-button-secondary transition-all duration-200 ${!hasMore || isPending ? "pointer-events-none opacity-45" : ""}`}
      >
        Próxima
      </button>
    </div>
  );
}
