"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import type { serializePublicPost } from "@/blog-engine/services/serializers";

type SerializedPost = ReturnType<typeof serializePublicPost>;

export function LatestStrip({ posts }: { posts: SerializedPost[] }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  function scrollByCard(direction: "left" | "right") {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({ left: direction === "left" ? -320 : 320, behavior: "smooth" });
  }

  return (
    <section className="border-b border-[#eee7df] bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5">
        <button
          type="button"
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e7ddd4] text-muted transition-all duration-300 hover:-translate-x-0.5 hover:border-primary hover:bg-canvas hover:text-primary sm:flex"
          aria-label="Posts anteriores"
          onClick={() => scrollByCard("left")}
        >
          ←
        </button>
        <div ref={scrollerRef} className="flex min-w-0 flex-1 snap-x justify-center gap-5 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {posts.slice(0, 20).map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.slug}`}
              className="group relative min-w-[280px] snap-start overflow-hidden rounded-sm bg-canvas shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl sm:min-w-[330px] lg:min-w-[260px]"
            >
              <article className="relative aspect-[4/3]">
                {post.coverImage ? (
                  <Image
                    src={post.coverImage.url}
                    alt={post.coverImage.altText}
                    fill
                    sizes="(max-width: 640px) 280px, 330px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <span className="absolute inset-0 bg-rose" />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/45 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  {post.category ? (
                    <span className="inline-flex rounded bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                      {post.category.name}
                    </span>
                  ) : null}
                  <h2 className="mt-3 line-clamp-3 text-lg font-semibold leading-6">{post.title}</h2>
                  {post.publishedLabel ? <p className="mt-2 text-xs text-white/85">{post.publishedLabel}</p> : null}
                </div>
              </article>
            </Link>
          ))}
        </div>
        <button
          type="button"
          className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e7ddd4] text-muted transition-all duration-300 hover:translate-x-0.5 hover:border-primary hover:bg-canvas hover:text-primary sm:flex"
          aria-label="Próximos posts"
          onClick={() => scrollByCard("right")}
        >
          →
        </button>
      </div>
    </section>
  );
}
