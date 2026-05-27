"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FaIcon } from "@/blog-engine/components/admin/fa-icon";
import { EMPTY_TAXONOMY_FILTER } from "@/blog-engine/admin/post-filter-constants";

type Option = {
  id: string;
  name: string;
  slug: string;
};

type PostStatusFilter = "DRAFT" | "PUBLISHED" | "PENDING_CHANGES" | "SCHEDULED" | "";
type OpenPanel = "status" | "categories" | "tags" | null;

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function sortByName(options: Option[]) {
  return [...options].sort((left, right) => left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" }));
}

function summarizeSelection(selected: string[], options: Option[], fallback: string, specialLabels?: Record<string, string>) {
  if (selected.length === 0) return fallback;
  if (selected.length === 1) {
    const selectedValue = selected[0];
    if (specialLabels?.[selectedValue]) return specialLabels[selectedValue];
    return options.find((option) => option.slug === selectedValue)?.name ?? fallback;
  }
  return `${selected.length} selecionados`;
}

function getStatusLabel(status: PostStatusFilter) {
  if (status === "DRAFT") return "Rascunho";
  if (status === "PUBLISHED") return "Publicado";
  if (status === "PENDING_CHANGES") return "Com alterações pendentes";
  if (status === "SCHEDULED") return "Agendado";
  return "Todos os status";
}

function setQueryValue(params: URLSearchParams, key: string, value: string | string[]) {
  params.delete(key);
  if (Array.isArray(value)) {
    if (value.length > 0) params.set(key, value.join(","));
    return;
  }
  if (value.trim()) params.set(key, value.trim());
}

function FilterMenu({
  label,
  summary,
  open,
  selectedCount,
  children,
  onToggle
}: {
  label: string;
  summary: string;
  open: boolean;
  selectedCount: number;
  children: ReactNode;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        className={`admin-input flex min-h-[4.75rem] w-full items-center justify-between gap-4 px-4 py-3 text-left transition ${
          open ? "border-primary/50 bg-[#fffdfb] ring-2 ring-primary/15" : "bg-white"
        }`}
        onClick={onToggle}
        aria-expanded={open}
        aria-label={label}
      >
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted/60">{label}</div>
          <div className="truncate text-sm font-semibold text-ink">{summary}</div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
            selectedCount > 0 ? "border-primary/20 bg-[#f0f6fc] text-primary" : "border-[#e3d5ca] bg-[#fcf8f4] text-muted"
          }`}
        >
          <FaIcon name={open ? "fa-chevron-up" : "fa-chevron-down"} />
          {selectedCount > 0 ? selectedCount : "Todos"}
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full overflow-hidden rounded-xl border border-[#eaded3] bg-white shadow-[0_18px_50px_rgba(72,50,36,0.14)]">
          <div className="border-b border-[#f0e7de] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted/60">
            Selecione um ou mais
          </div>
          <div className="max-h-72 overflow-y-auto p-2">{children}</div>
        </div>
      ) : null}
    </div>
  );
}

export function PostsFilters({
  path,
  title,
  status,
  categorySlugs,
  tagSlugs,
  categories,
  tags
}: {
  path: string;
  title: string;
  status: PostStatusFilter;
  categorySlugs: string[];
  tagSlugs: string[];
  categories: Option[];
  tags: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastHrefRef = useRef<string>("");
  const [isPending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title);
  const [currentStatus, setCurrentStatus] = useState<PostStatusFilter>(status);
  const [currentCategories, setCurrentCategories] = useState<string[]>(categorySlugs);
  const [currentTags, setCurrentTags] = useState<string[]>(tagSlugs);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [isTitleFocused, setIsTitleFocused] = useState(false);

  useEffect(() => {
    if (isTitleFocused) return;
    setCurrentTitle(title);
  }, [isTitleFocused, title]);
  useEffect(() => setCurrentStatus(status), [status]);
  useEffect(() => setCurrentCategories(categorySlugs), [categorySlugs]);
  useEffect(() => setCurrentTags(tagSlugs), [tagSlugs]);

  useEffect(() => {
    const query = searchParams ? searchParams.toString() : "";
    lastHrefRef.current = `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpenPanel(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenPanel(null);
        setMobileOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const sortedCategories = useMemo(() => sortByName(categories), [categories]);
  const sortedTags = useMemo(() => sortByName(tags), [tags]);

  const nextHref = useMemo(() => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    const normalizedTitle = currentTitle.trim();

    setQueryValue(params, "title", normalizedTitle);
    setQueryValue(params, "status", currentStatus);
    setQueryValue(params, "categories", currentCategories);
    setQueryValue(params, "tags", currentTags);
    params.set("page", "1");

    const query = params.toString();
    return query ? `${path}?${query}` : path;
  }, [currentTitle, currentStatus, currentCategories, currentTags, path, searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (nextHref === lastHrefRef.current) return;
      lastHrefRef.current = nextHref;
      startTransition(() => {
        router.replace(nextHref, { scroll: false });
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [nextHref, router, startTransition]);

  function clearFilters() {
    const href = path;
    lastHrefRef.current = href;
    setCurrentTitle("");
    setCurrentStatus("");
    setCurrentCategories([]);
    setCurrentTags([]);
    setOpenPanel(null);
    setMobileOpen(false);
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  return (
    <div ref={containerRef} className="admin-panel relative z-20 mb-6 grid gap-4 overflow-visible" aria-busy={isPending}>
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <div>
          <p className="text-sm font-semibold text-ink">Filtros</p>
          <p className="text-xs text-muted">Refine a lista de posts</p>
        </div>
        <button
          type="button"
          className="admin-icon-button"
          onClick={() => setMobileOpen((current) => !current)}
          aria-expanded={mobileOpen}
          disabled={isPending}
          aria-label={mobileOpen ? "Ocultar filtros" : "Mostrar filtros"}
        >
          <FaIcon name={mobileOpen ? "fa-chevron-up" : "fa-chevron-down"} />
        </button>
      </div>

      <div
        className={`grid gap-4 rounded-2xl border border-[#eaded3] bg-white/95 p-4 shadow-[0_16px_40px_rgba(72,50,36,0.08)] transition-all duration-200 ease-out lg:hidden ${
          mobileOpen ? "max-h-[1200px] opacity-100" : "pointer-events-none max-h-0 overflow-hidden border-transparent p-0 opacity-0 shadow-none"
        }`}
      >
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-ink">Título</span>
          <input
            name="title"
            value={currentTitle}
            onChange={(event) => setCurrentTitle(event.target.value)}
            onFocus={() => setIsTitleFocused(true)}
            onBlur={() => setIsTitleFocused(false)}
            className="admin-input min-h-[4.75rem]"
            placeholder="Filtrar pelo título"
          />
        </label>

        <div className="grid gap-2">
          <span className="text-sm font-semibold text-ink">Status</span>
          <FilterMenu
            label="Status"
            summary={getStatusLabel(currentStatus)}
            open={openPanel === "status"}
            selectedCount={currentStatus ? 1 : 0}
            onToggle={() => setOpenPanel((current) => (current === "status" ? null : "status"))}
          >
            <div className="grid gap-1.5">
              {[
                { value: "", label: "Todos os status" },
                { value: "DRAFT", label: "Rascunho" },
                { value: "PUBLISHED", label: "Publicado" },
                { value: "SCHEDULED", label: "Agendado" },
                { value: "PENDING_CHANGES", label: "Com alterações pendentes" }
              ].map((item) => {
                const active = currentStatus === item.value;

                return (
                  <button
                    key={item.value || "all"}
                    type="button"
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-[#f6f7f7] ${
                      active ? "bg-[#f0f6fc] text-primary" : "text-muted"
                    }`}
                    onClick={() => {
                      setCurrentStatus(item.value as PostStatusFilter);
                      setOpenPanel(null);
                    }}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        active ? "border-primary bg-primary text-white" : "border-[#d8c9bc] bg-white"
                      }`}
                    >
                      {active ? <FaIcon name="fa-check" /> : null}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </FilterMenu>
        </div>

        <div className="grid gap-2">
          <span className="text-sm font-semibold text-ink">Categorias</span>
          <FilterMenu
            label="Categorias"
            summary={summarizeSelection(
              currentCategories,
              sortedCategories,
              "Todas as categorias",
              { [EMPTY_TAXONOMY_FILTER]: "Sem categoria" }
            )}
            open={openPanel === "categories"}
            selectedCount={currentCategories.length}
            onToggle={() => setOpenPanel((current) => (current === "categories" ? null : "categories"))}
          >
            <div className="grid gap-1.5">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-[#f6f7f7]">
                <input
                  type="checkbox"
                  checked={currentCategories.includes(EMPTY_TAXONOMY_FILTER)}
                  onChange={() => setCurrentCategories((current) => toggleValue(current, EMPTY_TAXONOMY_FILTER))}
                  className="h-4 w-4 rounded border-[#cdbcad] text-primary focus:ring-primary"
                />
                <span className="min-w-0 truncate font-medium">Sem categoria</span>
              </label>
              {sortedCategories.map((category) => {
                const active = currentCategories.includes(category.slug);

                return (
                  <label
                    key={category.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-[#f6f7f7] ${
                      active ? "bg-[#fcf8f4] text-ink" : "text-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => setCurrentCategories((current) => toggleValue(current, category.slug))}
                      className="h-4 w-4 rounded border-[#cdbcad] text-primary focus:ring-primary"
                    />
                    <span className="min-w-0 truncate font-medium">{category.name}</span>
                  </label>
                );
              })}
            </div>
          </FilterMenu>
        </div>

        <div className="grid gap-2">
          <span className="text-sm font-semibold text-ink">Tags</span>
          <FilterMenu
            label="Tags"
            summary={summarizeSelection(currentTags, sortedTags, "Todas as tags", { [EMPTY_TAXONOMY_FILTER]: "Sem tag" })}
            open={openPanel === "tags"}
            selectedCount={currentTags.length}
            onToggle={() => setOpenPanel((current) => (current === "tags" ? null : "tags"))}
          >
            <div className="grid gap-1.5">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-[#f6f7f7]">
                <input
                  type="checkbox"
                  checked={currentTags.includes(EMPTY_TAXONOMY_FILTER)}
                  onChange={() => setCurrentTags((current) => toggleValue(current, EMPTY_TAXONOMY_FILTER))}
                  className="h-4 w-4 rounded border-[#cdbcad] text-primary focus:ring-primary"
                />
                <span className="min-w-0 truncate font-medium">Sem tag</span>
              </label>
              {sortedTags.map((tag) => {
                const active = currentTags.includes(tag.slug);

                return (
                  <label
                    key={tag.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-[#f6f7f7] ${
                      active ? "bg-[#fcf8f4] text-ink" : "text-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => setCurrentTags((current) => toggleValue(current, tag.slug))}
                      className="h-4 w-4 rounded border-[#cdbcad] text-primary focus:ring-primary"
                    />
                    <span className="min-w-0 truncate font-medium">{tag.name}</span>
                  </label>
                );
              })}
            </div>
          </FilterMenu>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            className="admin-button-secondary"
            onClick={clearFilters}
            title="Limpar filtros"
            aria-label="Limpar filtros"
            disabled={isPending}
          >
            {isPending ? "Filtrando..." : "Limpar"}
          </button>
        </div>
      </div>

      <div className="hidden gap-4 lg:grid xl:grid-cols-4">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-ink">Título</span>
          <input
            name="title"
            value={currentTitle}
            onChange={(event) => setCurrentTitle(event.target.value)}
            onFocus={() => setIsTitleFocused(true)}
            onBlur={() => setIsTitleFocused(false)}
            className="admin-input min-h-[4.75rem]"
            placeholder="Filtrar pelo título"
          />
        </label>

        <div className="grid gap-2">
          <span className="text-sm font-semibold text-ink">Status</span>
          <FilterMenu
            label="Status"
            summary={getStatusLabel(currentStatus)}
            open={openPanel === "status"}
            selectedCount={currentStatus ? 1 : 0}
            onToggle={() => setOpenPanel((current) => (current === "status" ? null : "status"))}
          >
            <div className="grid gap-1.5">
              {[
                { value: "", label: "Todos os status" },
                { value: "DRAFT", label: "Rascunho" },
                { value: "PUBLISHED", label: "Publicado" },
                { value: "SCHEDULED", label: "Agendado" },
                { value: "PENDING_CHANGES", label: "Com alterações pendentes" }
              ].map((item) => {
                const active = currentStatus === item.value;

                return (
                  <button
                    key={item.value || "all"}
                    type="button"
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-[#f6f7f7] ${
                      active ? "bg-[#f0f6fc] text-primary" : "text-muted"
                    }`}
                    onClick={() => {
                      setCurrentStatus(item.value as PostStatusFilter);
                      setOpenPanel(null);
                    }}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        active ? "border-primary bg-primary text-white" : "border-[#d8c9bc] bg-white"
                      }`}
                    >
                      {active ? <FaIcon name="fa-check" /> : null}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </FilterMenu>
        </div>

        <div className="grid gap-2">
          <span className="text-sm font-semibold text-ink">Categorias</span>
          <FilterMenu
            label="Categorias"
            summary={summarizeSelection(
              currentCategories,
              sortedCategories,
              "Todas as categorias",
              { [EMPTY_TAXONOMY_FILTER]: "Sem categoria" }
            )}
            open={openPanel === "categories"}
            selectedCount={currentCategories.length}
            onToggle={() => setOpenPanel((current) => (current === "categories" ? null : "categories"))}
          >
            <div className="grid gap-1.5">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-[#f6f7f7]">
                <input
                  type="checkbox"
                  checked={currentCategories.includes(EMPTY_TAXONOMY_FILTER)}
                  onChange={() => setCurrentCategories((current) => toggleValue(current, EMPTY_TAXONOMY_FILTER))}
                  className="h-4 w-4 rounded border-[#cdbcad] text-primary focus:ring-primary"
                />
                <span className="min-w-0 truncate font-medium">Sem categoria</span>
              </label>
              {sortedCategories.map((category) => {
                const active = currentCategories.includes(category.slug);

                return (
                  <label
                    key={category.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-[#f6f7f7] ${
                      active ? "bg-[#fcf8f4] text-ink" : "text-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => setCurrentCategories((current) => toggleValue(current, category.slug))}
                      className="h-4 w-4 rounded border-[#cdbcad] text-primary focus:ring-primary"
                    />
                    <span className="min-w-0 truncate font-medium">{category.name}</span>
                  </label>
                );
              })}
            </div>
          </FilterMenu>
        </div>

        <div className="grid gap-2">
          <span className="text-sm font-semibold text-ink">Tags</span>
          <FilterMenu
            label="Tags"
            summary={summarizeSelection(currentTags, sortedTags, "Todas as tags", { [EMPTY_TAXONOMY_FILTER]: "Sem tag" })}
            open={openPanel === "tags"}
            selectedCount={currentTags.length}
            onToggle={() => setOpenPanel((current) => (current === "tags" ? null : "tags"))}
          >
            <div className="grid gap-1.5">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-[#f6f7f7]">
                <input
                  type="checkbox"
                  checked={currentTags.includes(EMPTY_TAXONOMY_FILTER)}
                  onChange={() => setCurrentTags((current) => toggleValue(current, EMPTY_TAXONOMY_FILTER))}
                  className="h-4 w-4 rounded border-[#cdbcad] text-primary focus:ring-primary"
                />
                <span className="min-w-0 truncate font-medium">Sem tag</span>
              </label>
              {sortedTags.map((tag) => {
                const active = currentTags.includes(tag.slug);

                return (
                  <label
                    key={tag.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-[#f6f7f7] ${
                      active ? "bg-[#fcf8f4] text-ink" : "text-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => setCurrentTags((current) => toggleValue(current, tag.slug))}
                      className="h-4 w-4 rounded border-[#cdbcad] text-primary focus:ring-primary"
                    />
                    <span className="min-w-0 truncate font-medium">{tag.name}</span>
                  </label>
                );
              })}
            </div>
          </FilterMenu>
        </div>
      </div>

      <div className="hidden flex-wrap items-center justify-end gap-3 lg:flex">
        <button
          type="button"
          className="admin-button-secondary"
          onClick={clearFilters}
          title="Limpar filtros"
          aria-label="Limpar filtros"
          disabled={isPending}
        >
          {isPending ? "Filtrando..." : "Limpar"}
        </button>
      </div>
    </div>
  );
}
