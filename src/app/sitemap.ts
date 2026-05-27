import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, tags] = await Promise.all([
    prisma.post.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({
        where: {},
        select: { slug: true, updatedAt: true }
      }),
    prisma.tag.findMany({ select: { slug: true, updatedAt: true } })
  ]);

  return [
    { url: env.APP_URL, lastModified: new Date() },
    { url: `${env.APP_URL}/sobre`, lastModified: new Date() },
    { url: `${env.APP_URL}/contato`, lastModified: new Date() },
    ...posts.map((post) => ({ url: `${env.APP_URL}/posts/${post.slug}`, lastModified: post.updatedAt })),
    ...categories.map((category) => ({ url: `${env.APP_URL}/categorias/${category.slug}`, lastModified: category.updatedAt })),
    ...tags.map((tag) => ({ url: `${env.APP_URL}/tags/${tag.slug}`, lastModified: tag.updatedAt }))
  ];
}
