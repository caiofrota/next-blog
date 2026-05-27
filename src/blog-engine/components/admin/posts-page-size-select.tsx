"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export function PostsPageSizeSelect({ value, path }: { value: number; path: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState(String(value));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSelected(String(value));
  }, [value]);

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-semibold text-muted" htmlFor="posts-page-size">
        Itens por página
      </label>
      <select
        id="posts-page-size"
        name="take"
        value={selected}
        onChange={(event) => {
          const take = event.target.value;
          setSelected(take);
          const params = new URLSearchParams(searchParams?.toString() ?? "");
          params.set("take", take);
          params.set("page", "1");
          startTransition(() => {
            router.push(`${path || pathname}?${params.toString()}`);
          });
        }}
        className="admin-input min-w-[90px] py-2.5"
        disabled={isPending}
      >
        {PAGE_SIZE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
