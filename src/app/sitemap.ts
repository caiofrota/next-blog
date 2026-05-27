import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { demoCategories, demoPosts, demoTags } from "@/blog-engine/demo/data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (env.DEMO_MODE) {
    return [
      { url: env.APP_URL, lastModified: new Date() },
      { url: `${env.APP_URL}/sobre`, lastModified: new Date() },
      { url: `${env.APP_URL}/contato`, lastModified: new Date() },
      ...demoPosts.map((post) => ({ url: `${env.APP_URL}/posts/${post.slug}`, lastModified: post.updatedAt })),
      ...demoCategories.map((category) => ({ url: `${env.APP_URL}/categorias/${category.slug}`, lastModified: category.updatedAt })),
      ...demoTags.map((tag) => ({ url: `${env.APP_URL}/tags/${tag.slug}`, lastModified: tag.updatedAt }))
    ];
  }

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
