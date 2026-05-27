"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FaIcon } from "@/blog-engine/components/admin/fa-icon";

const NAV_ITEMS = [
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/media", label: "Mídia" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/usuarios", label: "Usuários" }
] as const;

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [loggingOut, setLoggingOut] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const activeLabel = useMemo(() => NAV_ITEMS.find((item) => isActivePath(pathname, item.href))?.label ?? "Admin", [pathname]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !drawerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen, mounted]);

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function signOut() {
    setLoggingOut(true);
    fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      router.replace("/admin/login");
    });
  }

  function openLogoutConfirm() {
    setLogoutConfirmOpen(true);
  }

  function closeLogoutConfirm() {
    setLogoutConfirmOpen(false);
  }

  return (
    <nav className="sticky top-0 z-[100] border-b border-[#eaded3] bg-white/95 px-4 py-3 shadow-sm shadow-[#eaded3]/30 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 flex-nowrap">
        <Link href="/admin/posts" className="shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-sm font-semibold text-ink hover:text-primary">
          Admin
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-1 rounded-lg border border-[#eaded3] bg-[#f6f7f7] p-1 text-sm font-semibold text-muted lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 transition ${
                  active
                    ? "bg-white text-ink shadow-sm ring-1 ring-primary/15"
                    : "hover:bg-white hover:text-ink hover:shadow-sm"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          className="admin-icon-button ml-auto shrink-0 lg:hidden"
          aria-label="Abrir menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((current) => !current)}
        >
          <FaIcon name={drawerOpen ? "fa-xmark" : "fa-bars"} />
        </button>

        <button type="button" className="admin-button-secondary hidden py-2 lg:inline-flex" disabled={loggingOut} onClick={openLogoutConfirm}>
          {loggingOut ? "Saindo..." : "Sair"}
        </button>
      </div>

      {mounted && drawerOpen
        ? createPortal(
            <div className="fixed inset-0 z-[220] lg:hidden">
              <button
                type="button"
                aria-label="Fechar menu"
                className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                onClick={closeDrawer}
              />
              <aside className="absolute right-0 top-0 z-[230] h-full w-[18rem] overflow-y-auto border-l border-[#eaded3] bg-[#fffaf5] px-4 py-5 shadow-[0_30px_90px_rgba(36,21,14,0.32)]">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted/60">Admin</p>
                    <p className="text-lg font-semibold text-ink">{activeLabel}</p>
                  </div>
                  <button type="button" className="admin-icon-button" aria-label="Fechar menu" onClick={closeDrawer}>
                    <FaIcon name="fa-xmark" />
                  </button>
                </div>

                <div className="grid gap-1">
                  {NAV_ITEMS.map((item) => {
                    const active = isActivePath(pathname, item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeDrawer}
                        className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                          active ? "bg-primary text-white shadow-sm" : "text-muted hover:bg-[#f6f7f7] hover:text-ink"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="admin-button-secondary mt-6 w-full py-2"
                  disabled={loggingOut}
                  onClick={() => {
                    closeDrawer();
                    openLogoutConfirm();
                  }}
                >
                  {loggingOut ? "Saindo..." : "Sair"}
                </button>
              </aside>
            </div>,
            document.body
          )
        : null}

      {mounted && logoutConfirmOpen
        ? createPortal(
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#2d1f18]/45 px-4 py-8 backdrop-blur-[2px]">
              <div className="w-full max-w-md rounded-2xl border border-[#eaded3] bg-[#fffaf5] p-5 shadow-[0_24px_80px_rgba(72,50,36,0.22)]">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                    <FaIcon name="fa-right-from-bracket" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h2 className="text-lg font-semibold text-ink">Sair do admin</h2>
                    <p className="text-sm leading-6 text-muted">Você quer mesmo encerrar a sessão agora?</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  <button type="button" className="admin-button-secondary" onClick={closeLogoutConfirm} disabled={loggingOut}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="admin-button-danger whitespace-nowrap px-4 py-2.5"
                    onClick={() => {
                      closeLogoutConfirm();
                      signOut();
                    }}
                    disabled={loggingOut}
                  >
                    Sair
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </nav>
  );
}
