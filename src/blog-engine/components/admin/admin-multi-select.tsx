"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { FaIcon } from "@/blog-engine/components/admin/fa-icon";

type Option = {
  id: string;
  label: string;
};

export function AdminMultiSelect({
  label,
  name,
  options,
  defaultSelectedIds = [],
  emptyLabel
}: {
  label: string;
  name: string;
  options: Option[];
  defaultSelectedIds?: string[];
  emptyLabel: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultSelectedIds);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setPanelStyle(null);
      return;
    }

    function updatePosition() {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 16;
      const spaceAbove = rect.top - 16;
      const openAbove = spaceBelow < 240 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(160, Math.min(288, openAbove ? spaceAbove : spaceBelow));

      setPanelStyle({
        position: "fixed",
        left: Math.max(8, rect.left),
        width: rect.width,
        zIndex: 200,
        ...(openAbove
          ? { bottom: Math.max(8, window.innerHeight - rect.top + 8), maxHeight }
          : { top: rect.bottom + 8, maxHeight })
      });
    }

    updatePosition();

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      const inContainer = containerRef.current?.contains(target) ?? false;
      const inPanel = panelRef.current?.contains(target) ?? false;
      if (!inContainer && !inPanel) {
        setOpen(false);
      }
    }

    function onResize() {
      updatePosition();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open]);

  const selectedLabels = useMemo(
    () => options.filter((option) => selectedIds.includes(option.id)).map((option) => option.label),
    [options, selectedIds]
  );

  return (
    <div ref={containerRef} className="relative">
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      <div className="grid gap-2">
        <button
          ref={buttonRef}
          type="button"
          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-[#eaded3] bg-white px-4 py-3 text-left text-sm font-semibold text-ink shadow-inner shadow-[#f4ebe4] transition hover:border-primary/40 hover:shadow-sm"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate">{label}</span>
            <span className="rounded-full bg-[#f6f7f7] px-2 py-0.5 text-xs font-semibold text-muted">{selectedIds.length}</span>
          </span>
          <FaIcon name={open ? "fa-chevron-up" : "fa-chevron-down"} />
        </button>

        <div className="min-h-5 text-xs text-muted">
          {selectedLabels.length > 0 ? (
            <span>
              Selecionadas: <span className="font-semibold text-ink">{selectedLabels.join(", ")}</span>
            </span>
          ) : (
            emptyLabel
          )}
        </div>
      </div>

      {mounted && open && panelStyle
        ? createPortal(
            <div
              ref={panelRef}
              className="overflow-hidden rounded-xl border border-[#eaded3] bg-white shadow-[0_18px_50px_rgba(72,50,36,0.14)]"
              style={panelStyle}
            >
              <div className="max-h-full overflow-y-auto p-2">
                {options.map((option) => {
                  const checked = selectedIds.includes(option.id);

                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                        checked ? "bg-primary/5 text-ink" : "hover:bg-[#f6f7f7] text-muted"
                      }`}
                    >
                      <input
                        type="checkbox"
                        value={option.id}
                        checked={checked}
                        onChange={() => {
                          setSelectedIds((current) =>
                            current.includes(option.id) ? current.filter((id) => id !== option.id) : [...current, option.id]
                          );
                        }}
                        className="h-4 w-4 rounded border-[#cdbcae] text-primary focus:ring-primary"
                      />
                      <span className="min-w-0 truncate">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
