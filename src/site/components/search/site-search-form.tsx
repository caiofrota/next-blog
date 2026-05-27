"use client";

import type { Ref } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function SiteSearchForm({
  defaultValue = "",
  className,
  inputClassName,
  buttonClassName,
  placeholder = "Pesquisar no site",
  buttonLabel = "Pesquisar",
  buttonStyle = "primary",
  inputRef
}: {
  defaultValue?: string;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  placeholder?: string;
  buttonLabel?: string;
  buttonStyle?: "primary" | "secondary";
  inputRef?: Ref<HTMLInputElement>;
  }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const value = query.trim();
        startTransition(() => {
          router.push(value ? `/busca?q=${encodeURIComponent(value)}` : "/busca");
        });
      }}
    >
      <input
        name="q"
        type="search"
        aria-label="Pesquisar no site"
        placeholder={placeholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        ref={inputRef}
        className={inputClassName}
      />
      <button
        className={buttonClassName ?? (buttonStyle === "primary" ? "admin-button-primary" : "admin-button-secondary")}
        disabled={isPending}
      >
        {isPending ? "Carregando..." : buttonLabel}
      </button>
    </form>
  );
}
