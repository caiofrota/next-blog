import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { env } from "@/lib/env";
import { demoPosts, demoTags } from "@/blog-engine/demo/data";

export async function listTags() {
  if (env.DEMO_MODE) {
    return demoTags
      .map((tag) => ({
        ...tag,
        _count: { posts: demoPosts.filter((post) => post.tags.some((item) => item.id === tag.id)).length }
      }))
      .sort((left, right) => left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" }));
  }

  return prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } }
  });
}

export async function getTagBySlug(slug: string) {
  if (env.DEMO_MODE) {
    const tag = demoTags.find((item) => item.slug === slug);
    if (!tag) return null;
    return {
      ...tag,
      _count: { posts: demoPosts.filter((post) => post.tags.some((item) => item.id === tag.id)).length }
    };
  }

  return prisma.tag.findUnique({
    where: { slug },
    include: { _count: { select: { posts: true } } }
  });
}

export async function listTagsPage(options: { take: number; skip: number }) {
  if (env.DEMO_MODE) {
    const tags = await listTags();
    return { tags: tags.slice(options.skip, options.skip + options.take), total: tags.length, hasMore: options.skip + options.take < tags.length };
  }

  const [tags, total] = await Promise.all([
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { posts: true } } },
      take: options.take,
      skip: options.skip
    }),
    prisma.tag.count()
  ]);

  return { tags, total, hasMore: options.skip + tags.length < total };
}

export async function countPostsWithoutTag() {
  if (env.DEMO_MODE) return demoPosts.filter((post) => post.tags.length === 0).length;

  return prisma.post.count({
    where: { tags: { none: {} } }
  });
}

function normalizeTagInput(name: string, slug?: string | null) {
  const normalizedName = name.trim();
  if (!normalizedName) throw new Error("required_name");

  const normalizedSlug = slugify((slug?.trim() || normalizedName).trim());
  if (!normalizedSlug) throw new Error("required_slug");

  return {
    name: normalizedName,
    slug: normalizedSlug
  };
}

async function assertUniqueTag(name: string, slug: string, id?: string) {
  const conflict = await prisma.tag.findFirst({
    where: {
      AND: [
        id ? { id: { not: id } } : {},
        {
          OR: [{ name: { equals: name, mode: "insensitive" } }, { slug }]
        }
      ]
    },
    select: { id: true, name: true, slug: true }
  });

  if (!conflict) return;
  if (conflict.name.toLowerCase() === name.toLowerCase()) throw new Error("duplicate_name");
  throw new Error("duplicate_slug");
}

export async function createTag(name: string, slug?: string | null) {
  const normalized = normalizeTagInput(name, slug);
  if (env.DEMO_MODE) {
    return {
      id: `demo-tag-${normalized.slug}`,
      ...normalized,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  await assertUniqueTag(normalized.name, normalized.slug);

  return prisma.tag.create({
    data: normalized
  });
}

export async function upsertTag(name: string, slug?: string | null) {
  const normalized = normalizeTagInput(name, slug);
  if (env.DEMO_MODE) {
    return {
      id: `demo-tag-${normalized.slug}`,
      ...normalized,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  return prisma.tag.upsert({
    where: { slug: normalized.slug },
    create: normalized,
    update: { name: normalized.name }
  });
}

export async function updateTag(id: string, name: string, slug?: string | null) {
  const normalized = normalizeTagInput(name, slug);
  if (env.DEMO_MODE) {
    return {
      id,
      ...normalized,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  await assertUniqueTag(normalized.name, normalized.slug, id);

  return prisma.tag.update({
    where: { id },
    data: normalized
  });
}

export async function deleteTag(id: string) {
  if (env.DEMO_MODE) return demoTags.find((tag) => tag.id === id) ?? null;

  const posts = await prisma.post.findMany({
    where: { tags: { some: { id } } },
    select: { id: true }
  });

  return prisma.$transaction(async (tx) => {
    for (const post of posts) {
      await tx.post.update({
        where: { id: post.id },
        data: { tags: { disconnect: { id } } }
      });
    }

    return tx.tag.delete({ where: { id } });
  });
}
