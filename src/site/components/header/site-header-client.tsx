"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { brand } from "@/site/config/brand";
import { navigation } from "@/site/config/navigation";
import { SocialIconLink } from "@/site/components/social/social-icons";
import { SiteSearchForm } from "@/site/components/search/site-search-form";

export function SiteHeaderClient() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  return (
    <header className="bg-white shadow-[0_12px_16px_-18px_rgba(36,32,29,0.55)]">
      <div className="mx-auto grid max-w-6xl grid-cols-[44px_1fr_44px] items-center gap-4 px-4 py-4 md:grid-cols-[1fr_auto_1fr] md:py-5">
        <div className="md:hidden" />
        <div className="hidden md:block" />
        <Link href="/" className="mx-auto block text-center" aria-label={brand.name}>
          <span className="block text-2xl font-semibold leading-tight text-ink md:text-3xl">{brand.name}</span>
          <span className="mt-1 hidden text-xs font-semibold uppercase tracking-[0.14em] text-muted sm:block">{brand.description}</span>
        </Link>
        <div className="hidden justify-end gap-1 md:flex">
          {brand.facebook !== "#" ? <SocialIconLink href={brand.facebook} label="Facebook" network="facebook" /> : null}
          {brand.instagram !== "#" ? <SocialIconLink href={brand.instagram} label="Instagram" network="instagram" /> : null}
          {brand.x !== "#" ? <SocialIconLink href={brand.x} label="X" network="x" /> : null}
        </div>
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded bg-transparent text-[#2271b1] transition-colors hover:bg-canvas md:hidden"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span className="relative block h-8 w-8">
            <span className={`absolute inset-0 transition-all duration-500 ease-out ${menuOpen ? "rotate-180 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100"}`}>
              <MenuIcon />
            </span>
            <span className={`absolute inset-0 transition-all duration-500 ease-out ${menuOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-180 scale-75 opacity-0"}`}>
              <CloseIcon />
            </span>
          </span>
        </button>
      </div>

      <div className="border-t border-[#f0ebe6]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="hidden min-h-12 items-center justify-center gap-4 md:flex">
            <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2 font-verdana text-[15px] text-[#2f2a26]">
              {navigation.map((item) => (
                <Link key={item.href} href={item.href} className="border-b-2 border-transparent pb-1 hover:border-primary hover:text-primary">
                  {item.label}
                </Link>
              ))}
            </nav>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded text-muted hover:bg-canvas hover:text-primary"
              aria-label="Pesquisar"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((value) => !value)}
            >
              <SearchIcon />
            </button>
          </div>

          <div className={`overflow-hidden transition-all duration-500 ease-out md:hidden ${menuOpen ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className={`transition-transform duration-500 ease-out ${menuOpen ? "translate-y-0" : "-translate-y-3"}`}>
              <nav className="grid gap-1 py-3 font-verdana text-[15px] text-[#2f2a26]">
                {navigation.map((item) => (
                  <Link key={item.href} href={item.href} className="rounded px-2 py-3 hover:bg-canvas hover:text-primary" onClick={() => setMenuOpen(false)}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="border-t border-[#f0ebe6] py-4">
                <SiteSearchForm
                  className="flex gap-2"
                  inputClassName="min-w-0 flex-1 rounded-md border border-[#e7ddd4] px-4 py-3 text-sm outline-none transition focus:border-primary"
                  buttonClassName="rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-blush"
                  inputRef={searchInputRef}
                />
              </div>
            </div>
          </div>

          <div
            className={`overflow-hidden transition-[max-height,opacity,transform,border-width] duration-300 ease-out ${
              searchOpen ? "max-h-24 border-t border-[#f0ebe6] opacity-100 translate-y-0" : "max-h-0 border-t-0 opacity-0 -translate-y-1"
            }`}
          >
            <SiteSearchForm
              defaultValue=""
              className={`flex min-h-0 gap-2 overflow-hidden transition-[padding] duration-300 ease-out ${searchOpen ? "py-4" : "py-0"}`}
              inputClassName="min-w-0 flex-1 rounded-md border border-[#e7ddd4] px-4 py-3 text-sm outline-none transition focus:border-primary"
              buttonClassName="rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-blush"
              inputRef={searchInputRef}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-current stroke-2">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-current stroke-2">
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}
