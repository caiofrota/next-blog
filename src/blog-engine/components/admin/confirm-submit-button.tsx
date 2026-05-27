"use client";

import { type ButtonHTMLAttributes, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaIcon } from "@/blog-engine/components/admin/fa-icon";

type ConfirmSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  modalTitle: string;
  confirmMessage: string;
  confirmLabel?: string;
  mode?: "single" | "double";
  doubleConfirmMessage?: string;
  doubleConfirmLabel?: string;
  children: ReactNode;
};

export function ConfirmSubmitButton({
  modalTitle,
  confirmMessage,
  confirmLabel = "Confirmar",
  mode = "single",
  doubleConfirmMessage,
  doubleConfirmLabel = "Excluir agora",
  children,
  onClick,
  ...props
}: ConfirmSubmitButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<1 | 2>(1);
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        setPhase(1);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function closeModal() {
    setOpen(false);
    setPhase(1);
    setSubmitting(false);
  }

  function submitForm() {
    const form = buttonRef.current?.form;
    if (!form) return;
    form.requestSubmit();
  }

  const body = useMemo(() => {
    if (mode === "double" && phase === 2) {
      return doubleConfirmMessage ?? confirmMessage;
    }

    return confirmMessage;
  }, [confirmMessage, doubleConfirmMessage, mode, phase]);

  return (
    <>
      <button
        {...props}
        ref={buttonRef}
        type="button"
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          setOpen(true);
          setPhase(1);
        }}
      >
        {children}
      </button>

      {mounted && open
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d1f18]/45 px-4 py-8 backdrop-blur-[2px]">
              <div className="w-full max-w-lg rounded-2xl border border-[#eaded3] bg-[#fffaf5] p-5 shadow-[0_24px_80px_rgba(72,50,36,0.22)]">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                    <FaIcon name="fa-triangle-exclamation" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h2 className="text-lg font-semibold text-ink">{modalTitle}</h2>
                    <p className="text-sm leading-6 text-muted">{body}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  <button type="button" className="admin-button-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  {mode === "double" && phase === 1 ? (
                    <button
                      type="button"
                      className="admin-button-primary"
                      onClick={() => setPhase(2)}
                      disabled={submitting}
                    >
                      {confirmLabel}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-button-danger whitespace-nowrap px-4 py-2.5"
                      onClick={() => {
                        setSubmitting(true);
                        closeModal();
                        submitForm();
                      }}
                      disabled={submitting}
                    >
                      <span className="inline-flex items-center gap-2 whitespace-nowrap">
                        {submitting ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" /> : null}
                        {mode === "double" ? doubleConfirmLabel : confirmLabel}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
