"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmSubmitButton } from "@/blog-engine/components/admin/confirm-submit-button";
import { FaIcon } from "@/blog-engine/components/admin/fa-icon";

type MediaAssetItem = {
  id: string;
  key: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
  createdAt: string;
  updatedAt: string;
  url: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function MediaGallery({
  initialAssets,
  initialHasMore,
  take,
  deleteAction
}: {
  initialAssets: MediaAssetItem[];
  initialHasMore: boolean;
  take: number;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const router = useRouter();
  const [assets, setAssets] = useState(initialAssets);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setAssets(initialAssets);
    setHasMore(initialHasMore);
    setSelectedIds([]);
  }, [initialAssets, initialHasMore]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("skip", String(assets.length));
      params.set("take", String(take));
      const response = await fetch(`/api/admin/media/assets?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to load media");
      const data = (await response.json()) as { assets: MediaAssetItem[]; hasMore: boolean };
      setAssets((current) => [...current, ...data.assets]);
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
    }
  }, [assets.length, hasMore, loading, take]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadMore();
    }, { rootMargin: "600px 0px" });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  async function uploadImage(formData: FormData) {
    setUploadState("uploading");
    setUploadError(null);
    try {
      const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Não foi possível enviar a imagem.");
      }
      router.refresh();
      setUploadState("idle");
    } catch (error) {
      setUploadState("error");
      setUploadError(error instanceof Error ? error.message : "Não foi possível enviar a imagem.");
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleAll() {
    if (selectedIds.length === assets.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(assets.map((asset) => asset.id));
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          void uploadImage(formData);
        }}
        className="admin-panel grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
      >
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-ink">
            Arquivo <span className="text-red-700">*</span>
          </span>
          <input name="file" type="file" accept="image/*" className="admin-input" required />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-ink">Texto alternativo</span>
          <input name="altText" className="admin-input" placeholder="Descrição curta da imagem" />
        </label>
        <button type="submit" className="admin-icon-button self-end" title="Enviar imagem" aria-label="Enviar imagem">
          <FaIcon name={uploadState === "uploading" ? "fa-spinner fa-spin" : "fa-plus"} />
        </button>
      </form>
      {uploadError ? <p className="text-sm font-medium text-rose-700">{uploadError}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" className="admin-button-secondary" onClick={toggleAll}>
            {selectedIds.length === assets.length && assets.length > 0 ? "Desmarcar tudo" : "Selecionar tudo"}
          </button>
          <span className="text-sm text-muted">
            {selectedIds.length} selecionada{selectedIds.length === 1 ? "" : "s"}
          </span>
        </div>
        <form action={deleteAction} className="flex items-center gap-2">
          {selectedIds.map((id) => (
            <input key={id} type="hidden" name="ids" value={id} />
          ))}
          <ConfirmSubmitButton
            type="submit"
            className="admin-icon-button-danger"
            title="Excluir selecionadas"
            aria-label="Excluir selecionadas"
            disabled={selectedIds.length === 0}
            modalTitle="Excluir imagens selecionadas"
            mode="double"
            confirmLabel="Continuar"
            doubleConfirmLabel={`Apagar ${selectedIds.length} imagens`}
            confirmMessage={`Você selecionou ${selectedIds.length} imagem(ns). Esta ação é irreversível.`}
            doubleConfirmMessage={`Confirme novamente: todas as ${selectedIds.length} imagens selecionadas serão apagadas de forma permanente.`}
          >
            <FaIcon name="fa-trash-can" />
          </ConfirmSubmitButton>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {assets.map((asset) => (
          <article key={asset.id} className="rounded-lg border border-[#eaded3] bg-white/95 p-3 shadow-[0_14px_35px_rgba(72,50,36,0.07)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(72,50,36,0.12)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                <input type="checkbox" checked={selectedSet.has(asset.id)} onChange={() => toggleSelected(asset.id)} />
                Selecionar
              </label>
              <form action={deleteAction}>
                <input type="hidden" name="ids" value={asset.id} />
                <ConfirmSubmitButton
                  type="submit"
                  className="admin-icon-button-danger"
                  title="Excluir imagem"
                  aria-label="Excluir imagem"
                  modalTitle="Confirmar exclusão"
                  confirmLabel="Excluir"
                  confirmMessage={`Excluir a imagem "${asset.filename}"? Essa ação não pode ser desfeita.`}
                >
                  <FaIcon name="fa-trash-can" />
                </ConfirmSubmitButton>
              </form>
            </div>
            <div className="relative aspect-square overflow-hidden rounded-md bg-[#f1e6dd]">
              <Image src={asset.url} alt={asset.altText ?? asset.filename} fill sizes="(min-width: 1536px) 25vw, (min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-500 hover:scale-105" />
            </div>
            <div className="mt-3 space-y-1">
              <p className="truncate text-sm font-semibold text-ink">{asset.filename}</p>
              <p className="text-xs text-muted">
                {asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ""}
                {formatBytes(asset.size)} · {formatDate(asset.createdAt)}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div ref={sentinelRef} className="flex items-center justify-center py-6 text-sm text-muted">
        {loading ? "Carregando mais imagens..." : hasMore ? "Role para carregar mais" : "Fim da galeria"}
      </div>
    </div>
  );
}
