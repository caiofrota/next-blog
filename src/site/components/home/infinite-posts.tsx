"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { serializePublicPost } from "@/blog-engine/services/serializers";

type SerializedPost = ReturnType<typeof serializePublicPost>;
const AUTO_LOAD_LIMIT = 1;

export function InfinitePosts({ initialPosts, initialHasMore }: { initialPosts: SerializedPost[]; initialHasMore: boolean }) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [autoLoads, setAutoLoads] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/posts?skip=${posts.length}&take=6`);
      const data = (await response.json()) as { posts: SerializedPost[]; hasMore: boolean };
      setPosts((current) => [...current, ...data.posts]);
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, posts.length]);

  useEffect(() => {
    if (!hasMore || loading || autoLoads >= AUTO_LOAD_LIMIT) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0]?.isIntersecting || loading) return;
        observer.disconnect();
        setAutoLoads((current) => current + 1);
        await loadMore();
      },
      { rootMargin: "700px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [autoLoads, hasMore, loadMore, loading]);

  const [featured, ...rest] = posts;

  return (
    <section className="space-y-8">
      {featured ? <FeaturedPost post={featured} /> : null}
      <div className="grid gap-x-8 gap-y-10 md:grid-cols-2">
        {rest.map((post) => (
          <SmallPost key={post.id} post={post} />
        ))}
      </div>
      <div ref={sentinelRef} className="py-6 text-center text-sm font-semibold text-muted">
        {loading ? "Carregando posts..." : null}
        {!loading && hasMore && autoLoads >= AUTO_LOAD_LIMIT ? (
          <button type="button" onClick={loadMore} className="rounded border border-primary px-5 py-3 text-sm font-semibold text-primary hover:bg-primary hover:text-white">
            Carregar mais posts
          </button>
        ) : null}
        {!loading && !hasMore ? "Todos os posts foram carregados." : null}
      </div>
    </section>
  );
}

function FeaturedPost({ post }: { post: SerializedPost }) {
  return (
    <article className="border-b border-[#eee7df] pb-10">
      {post.coverImage ? (
        <Link href={`/posts/${post.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-canvas">
          <Image src={post.coverImage.url} alt={post.coverImage.altText} fill priority sizes="(max-width: 768px) 100vw, 760px" className="object-cover" />
        </Link>
      ) : null}
      <PostMeta post={post} />
      <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-[34px]">
        <Link href={`/posts/${post.slug}`} className="hover:text-primary">
          {post.title}
        </Link>
      </h2>
      {post.excerpt ? <p className="mt-4 text-[15px] leading-7 text-muted">{post.excerpt}</p> : null}
      <ReadMore slug={post.slug} />
    </article>
  );
}

function SmallPost({ post }: { post: SerializedPost }) {
  return (
    <article className="border-b border-[#eee7df] pb-8">
      {post.coverImage ? (
        <Link href={`/posts/${post.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-canvas">
          <Image src={post.coverImage.url} alt={post.coverImage.altText} fill sizes="(max-width: 768px) 100vw, 360px" className="object-cover" />
        </Link>
      ) : null}
      <PostMeta post={post} />
      <h2 className="mt-2 text-xl font-semibold leading-7">
        <Link href={`/posts/${post.slug}`} className="hover:text-primary">
          {post.title}
        </Link>
      </h2>
      {post.excerpt ? <p className="mt-3 text-sm leading-6 text-muted">{post.excerpt}</p> : null}
      <ReadMore slug={post.slug} />
    </article>
  );
}

function PostMeta({ post }: { post: SerializedPost }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
      {post.publishedLabel ? <span>{post.publishedLabel}</span> : null}
      {post.category ? (
        <>
          <span>|</span>
          <Link href={`/categorias/${post.category.slug}`} className="hover:text-primary">
            {post.category.name}
          </Link>
        </>
      ) : null}
    </div>
  );
}

function ReadMore({ slug }: { slug: string }) {
  return (
    <Link href={`/posts/${slug}`} className="mt-4 inline-block rounded border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-white">
      Ler Mais
    </Link>
  );
}
