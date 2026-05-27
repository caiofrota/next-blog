"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminNav } from "@/blog-engine/components/admin/admin-nav";
import { AdminFormSubmitButton } from "@/blog-engine/components/admin/admin-form-submit-button";
import { AdminMultiSelect } from "@/blog-engine/components/admin/admin-multi-select";
import { FaIcon } from "@/blog-engine/components/admin/fa-icon";
import { RichTextEditor } from "@/blog-engine/components/editor/rich-text-editor";
import { parseMetaTags } from "@/blog-engine/seo/meta-tags";
import { brand } from "@/site/config/brand";
import { slugify } from "@/lib/slug";

const MEDIA_PAGE_SIZE = 24;

type MediaAsset = {
  id: string;
  key: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
  url: string;
};

type SelectOption = {
  id: string;
  label: string;
};

type PostEditorFormProps = {
  mode: "create" | "edit";
  postId?: string;
  initialTitle: string;
  initialSlug?: string;
  initialExcerpt?: string | null;
  initialHtml: string;
  initialSeoDescription?: string | null;
  initialMetaTags?: string | null;
  initialCoverImageId?: string | null;
  initialCoverImage?: MediaAsset | null;
  initialPublishedAt?: string | null;
  initialCategoryIds?: string[];
  initialTagIds?: string[];
  media: MediaAsset[];
  categories: SelectOption[];
  tags: SelectOption[];
  canonicalBaseUrl: string;
  saveDraftAction: (formData: FormData) => void | Promise<void>;
  publishAction: (formData: FormData) => void | Promise<void>;
  revertToDraftAction?: (formData: FormData) => void | Promise<void>;
  showRevertToDraft?: boolean;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatPreviewUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.host + parsed.pathname;
  } catch {
    return url;
  }
}

function truncateWithEllipsis(value: string, maxChars: number) {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

function formatDateTimeLocalValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (input: number) => String(input).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function CoverImagePicker({
  media,
  selectedId,
  onSelectedIdChange,
  onMediaChange
}: {
  media: MediaAsset[];
  selectedId: string;
  onSelectedIdChange: (value: string) => void;
  onMediaChange: (items: MediaAsset[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [visibleAssets, setVisibleAssets] = useState(media.slice(0, MEDIA_PAGE_SIZE));
  const [hasMore, setHasMore] = useState(media.length > MEDIA_PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setVisibleAssets(media.slice(0, MEDIA_PAGE_SIZE));
    setHasMore(media.length > MEDIA_PAGE_SIZE);
  }, [media]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const selectedAsset = useMemo(() => media.find((asset) => asset.id === selectedId) ?? null, [media, selectedId]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      params.set("skip", String(visibleAssets.length));
      params.set("take", String(MEDIA_PAGE_SIZE));
      const response = await fetch(`/api/admin/media/assets?${params.toString()}`);
      if (!response.ok) throw new Error("Falha ao carregar mídia");
      const data = (await response.json()) as { assets: MediaAsset[]; hasMore: boolean };
      setVisibleAssets((current) => [...current, ...data.assets]);
      setHasMore(data.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, visibleAssets.length]);

  useEffect(() => {
    if (!open || !mounted) return;

    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
          void loadMore();
        }
      },
      { root, rootMargin: "0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loadingMore, mounted, open]);

  async function uploadFile(file: File) {
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Não foi possível enviar a imagem.");
      }

      const uploaded = (await response.json()) as MediaAsset;
      onMediaChange([uploaded, ...media]);
      onSelectedIdChange(uploaded.id);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="coverImageId" value={selectedId} readOnly />

      <div className="grid gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void uploadFile(file);
          }}
        />

        {uploadError ? <p className="text-xs font-medium text-rose-700">{uploadError}</p> : null}

        {selectedAsset ? (
          <div className="overflow-hidden rounded-2xl border border-[#eaded3] bg-white shadow-[0_16px_40px_rgba(72,50,36,0.08)]">
            <div className="relative aspect-[4/3] bg-[#f3e7db]">
              <Image
                src={selectedAsset.url}
                alt={selectedAsset.altText ?? selectedAsset.filename}
                fill
                sizes="(max-width: 1024px) 100vw, 22rem"
                className="object-cover"
              />
            </div>
            <div className="space-y-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{selectedAsset.filename}</p>
                  <p className="text-xs text-muted">
                    {selectedAsset.width && selectedAsset.height ? `${selectedAsset.width}×${selectedAsset.height} · ` : ""}
                    {formatBytes(selectedAsset.size)}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs font-semibold text-primary transition hover:text-[#135e96]"
                  onClick={() => onSelectedIdChange("")}
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border border-dashed border-[#d9c7b7] bg-[#fffaf5] p-4 text-sm text-muted">
              Nenhuma imagem de capa selecionada.
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                className="admin-button-secondary justify-start gap-2"
                onClick={() => setOpen(true)}
              >
                <FaIcon name="fa-photo-film" />
                Das mídias do site
              </button>
              <button
                type="button"
                className="admin-button-secondary justify-start gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <FaIcon name={uploading ? "fa-spinner fa-spin" : "fa-upload"} />
                Fazer upload
              </button>
            </div>
          </div>
        )}
      </div>

      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[120] flex items-center justify-center bg-[#2d1f18]/55 px-4 py-6 backdrop-blur-[2px]"
              role="dialog"
              aria-modal="true"
              onClick={() => setOpen(false)}
            >
              <div
                className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-[#eaded3] bg-[#fffaf5] shadow-[0_28px_90px_rgba(72,50,36,0.24)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3 border-b border-[#eaded3] px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted/60">Imagem de capa</p>
                    <h2 className="text-lg font-semibold text-ink">Escolha na galeria do site</h2>
                  </div>
                  <button
                    type="button"
                    className="admin-icon-button"
                    aria-label="Fechar"
                    title="Fechar"
                    onClick={() => setOpen(false)}
                  >
                    <FaIcon name="fa-xmark" />
                  </button>
                </div>

                <div ref={scrollRef} className="grid flex-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {visibleAssets.map((asset) => {
                    const active = asset.id === selectedId;

                    return (
                      <button
                        key={asset.id}
                        type="button"
                        className={`flex min-h-[22rem] flex-col overflow-hidden rounded-2xl border text-left transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(72,50,36,0.12)] ${
                          active ? "border-primary ring-2 ring-primary/30" : "border-[#eaded3] bg-white"
                        }`}
                        onClick={() => {
                          onSelectedIdChange(asset.id);
                          setOpen(false);
                        }}
                      >
                        <div className="relative min-h-0 flex-1 bg-[#f3e7db]">
                          <Image
                            src={asset.url}
                            alt={asset.altText ?? asset.filename}
                            fill
                            sizes="(max-width: 1280px) 50vw, 25vw"
                            className="object-cover"
                          />
                        </div>
                        <div className="space-y-1 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-ink">{asset.filename}</p>
                            {active ? (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                Selecionada
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted">
                            {asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ""}
                            {formatBytes(asset.size)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                  <div ref={sentinelRef} className="col-span-full flex items-center justify-center py-3 text-sm text-muted">
                    {loadingMore ? "Carregando mais imagens..." : hasMore ? "Role para carregar mais" : "Fim da galeria"}
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

function SeoPreview({
  title,
  slug,
  description,
  metaTags,
  canonicalBaseUrl,
  coverImage
}: {
  title: string;
  slug: string;
  description: string;
  metaTags: string;
  canonicalBaseUrl: string;
  coverImage: MediaAsset | null;
}) {
  const cleanBase = canonicalBaseUrl.replace(/\/$/, "");
  const previewUrl = slug ? `${cleanBase}/posts/${slug}` : `${cleanBase}/posts/slug-do-post`;
  const domain = (() => {
    try {
      return new URL(cleanBase).host;
    } catch {
      return cleanBase;
    }
  })();
  const previewTags = parseMetaTags(metaTags);
  const previewDescription = truncateWithEllipsis(description || "A descrição do post vai aparecer aqui.", 155);
  const previewTitle = truncateWithEllipsis(title || "Título do post", 60);

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-[#e3d5ca] bg-white p-4 shadow-[0_12px_30px_rgba(72,50,36,0.06)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted/60">Prévia no Google</p>
          </div>
        </div>
        <div className="space-y-1 rounded-2xl border border-[#eaded3] bg-[#fffaf5] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted/55">{domain}</p>
          <p className="text-sm font-medium text-[#1a73e8] hover:underline">{previewTitle}</p>
          <p className="text-sm leading-6 text-muted">{previewDescription}</p>
          <p className="break-all text-xs text-[#188038]">{formatPreviewUrl(previewUrl)}</p>
        </div>
        {previewTags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {previewTags.map((tag) => (
              <span key={tag} className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-[#e3d5ca] bg-white p-4 shadow-[0_12px_30px_rgba(72,50,36,0.06)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted/60">Prévia no WhatsApp</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-[#eaded3] bg-white">
          <div className="relative aspect-[16/9] bg-[#f3e7db]">
            {coverImage ? (
              <Image
                src={coverImage.url}
                alt={coverImage.altText ?? coverImage.filename}
                fill
                sizes="(max-width: 768px) 100vw, 40rem"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted">Sem imagem de capa</div>
            )}
          </div>
          <div className="space-y-2 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted/55">{brand.name}</p>
            <p className="text-base font-semibold leading-6 text-ink">{previewTitle}</p>
            <p className="text-sm leading-6 text-muted">{previewDescription}</p>
            <p className="break-all text-xs text-muted/70">{formatPreviewUrl(previewUrl)}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export function PostEditorForm({
  mode,
  postId,
  initialTitle,
  initialSlug,
  initialExcerpt,
  initialHtml,
  initialSeoDescription,
  initialMetaTags,
  initialCoverImageId,
  initialCoverImage,
  initialPublishedAt,
  initialCategoryIds = [],
  initialTagIds = [],
  media,
  categories,
  tags,
  canonicalBaseUrl,
  saveDraftAction,
  publishAction,
  revertToDraftAction,
  showRevertToDraft = false
}: PostEditorFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug ?? slugify(initialTitle));
  const [excerpt, setExcerpt] = useState(initialExcerpt ?? "");
  const [seoDescription, setSeoDescription] = useState(initialSeoDescription ?? "");
  const [metaTags, setMetaTags] = useState(initialMetaTags ?? "");
  const [selectedCoverId, setSelectedCoverId] = useState(initialCoverImageId ?? initialCoverImage?.id ?? "");
  const [publishedAt, setPublishedAt] = useState(formatDateTimeLocalValue(initialPublishedAt));
  const [mediaItems, setMediaItems] = useState(media);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    setSlug(initialSlug ?? slugify(initialTitle));
  }, [initialSlug, initialTitle]);

  useEffect(() => {
    setExcerpt(initialExcerpt ?? "");
  }, [initialExcerpt]);

  useEffect(() => {
    setSeoDescription(initialSeoDescription ?? "");
  }, [initialSeoDescription]);

  useEffect(() => {
    setMetaTags(initialMetaTags ?? "");
  }, [initialMetaTags]);

  useEffect(() => {
    setSelectedCoverId(initialCoverImageId ?? initialCoverImage?.id ?? "");
  }, [initialCoverImage, initialCoverImageId]);

  useEffect(() => {
    setPublishedAt(formatDateTimeLocalValue(initialPublishedAt));
  }, [initialPublishedAt]);

  useEffect(() => {
    setMediaItems(media);
  }, [media]);

  const selectedCover = useMemo(
    () => mediaItems.find((asset) => asset.id === selectedCoverId) ?? initialCoverImage ?? null,
    [initialCoverImage, mediaItems, selectedCoverId]
  );

  const scheduledPublication = useMemo(() => {
    if (!publishedAt) return false;
    const parsed = new Date(publishedAt);
    return !Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now();
  }, [publishedAt]);

  const publishButtonLabel = mode === "edit" ? (scheduledPublication ? "Agendar alterações" : "Publicar alterações") : scheduledPublication ? "Agendar" : "Publicar";
  const publishButtonPendingLabel =
    mode === "edit" ? (scheduledPublication ? "Agendando alterações..." : "Publicando alterações...") : scheduledPublication ? "Agendando..." : "Publicando...";

  return (
    <main className="admin-shell">
      <AdminNav />
      <form action={saveDraftAction} className="admin-container grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {postId ? <input type="hidden" name="id" value={postId} /> : null}

        <aside className="order-1 h-fit space-y-4 lg:order-2 lg:sticky lg:top-24">
          <div className="admin-panel space-y-3">
            <AdminFormSubmitButton label="Salvar rascunho" pendingLabel="Salvando..." icon="fa-floppy-disk" className="admin-button-secondary w-full" />
            <AdminFormSubmitButton
              label={publishButtonLabel}
              pendingLabel={publishButtonPendingLabel}
              icon="fa-paper-plane"
              className="admin-button-primary w-full"
              formAction={publishAction}
            />
            {showRevertToDraft && revertToDraftAction ? (
              <AdminFormSubmitButton
                label="Voltar para rascunho"
                pendingLabel="Atualizando..."
                icon="fa-file-circle-xmark"
                className="admin-button-secondary w-full"
                formAction={revertToDraftAction}
              />
            ) : null}
          </div>

          <div className="admin-panel grid gap-2">
            <label className="grid gap-2 font-semibold">
              Data da Publicação
              <input
                type="datetime-local"
                name="publishedAt"
                value={publishedAt}
                onChange={(event) => setPublishedAt(event.target.value)}
                className="admin-input"
              />
            </label>
          </div>

          <div className="admin-panel grid gap-4">
            <div className="grid gap-2 font-semibold">
              <span>Imagem de capa</span>
              <CoverImagePicker
                media={mediaItems}
                selectedId={selectedCoverId}
                onSelectedIdChange={setSelectedCoverId}
                onMediaChange={setMediaItems}
              />
            </div>
            <AdminMultiSelect
              label="Categorias"
              name="categoryIds"
              options={categories}
              defaultSelectedIds={initialCategoryIds}
              emptyLabel="Nenhuma categoria selecionada"
            />
            <AdminMultiSelect
              label="Tags"
              name="tagIds"
              options={tags}
              defaultSelectedIds={initialTagIds}
              emptyLabel="Nenhuma tag selecionada"
            />
          </div>
        </aside>

        <div className="order-2 space-y-6 lg:order-1">
          <RichTextEditor
            initialTitle={initialTitle}
            initialSlug={initialSlug}
            initialExcerpt={initialExcerpt ?? ""}
            initialHtml={initialHtml}
            defaultSlugMode={mode === "edit" ? "manual" : "auto"}
            onTitleChange={setTitle}
            onSlugChange={setSlug}
            onExcerptChange={setExcerpt}
          />

          <section className="admin-panel grid gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted/60">SEO</p>
            </div>

            <label className="grid gap-2 font-semibold">
              Descrição
              <textarea
                name="seoDescription"
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
                className="admin-input min-h-28 font-normal"
              />
            </label>
            <label className="grid gap-2 font-semibold">
              Meta tags
              <textarea
                name="metaTags"
                value={metaTags}
                onChange={(event) => setMetaTags(event.target.value)}
                className="admin-input min-h-24 font-normal"
                placeholder="palavra-chave 1, palavra-chave 2"
              />
            </label>

            <SeoPreview
              title={title}
              slug={slug}
              description={seoDescription || excerpt}
              metaTags={metaTags}
              canonicalBaseUrl={canonicalBaseUrl}
              coverImage={selectedCover}
            />
          </section>
        </div>
      </form>
    </main>
  );
}
