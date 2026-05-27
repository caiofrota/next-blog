import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export async function listCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } }
  });

  return categories;
}

export async function listCategoriesPage(options: { take: number; skip: number }) {
  const categories = await listCategories();
  const total = categories.length;

  return {
    categories: categories.slice(options.skip, options.skip + options.take),
    total,
    hasMore: options.skip + options.take < total
  };
}

export async function countPostsWithoutCategory() {
  return prisma.post.count({
    where: {
      categories: { none: {} }
    }
  });
}

function normalizeCategoryInput(name: string, description?: string | null, slug?: string | null) {
  const normalizedName = name.trim();
  if (!normalizedName) throw new Error("required_name");

  const normalizedSlug = slugify((slug?.trim() || normalizedName).trim());
  if (!normalizedSlug) throw new Error("required_slug");
  const normalizedDescription = description?.trim() || null;

  return {
    name: normalizedName,
    slug: normalizedSlug,
    description: normalizedDescription
  };
}

async function assertUniqueCategory(name: string, slug: string, id?: string) {
  const conflict = await prisma.category.findFirst({
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

export async function createCategory(name: string, description?: string | null, slug?: string | null) {
  const normalized = normalizeCategoryInput(name, description, slug);
  await assertUniqueCategory(normalized.name, normalized.slug);

  return prisma.category.create({
    data: normalized
  });
}

export async function upsertCategory(name: string, description?: string | null, slug?: string | null) {
  const normalized = normalizeCategoryInput(name, description, slug);
  return prisma.category.upsert({
    where: { slug: normalized.slug },
    create: normalized,
    update: { name: normalized.name, description: normalized.description }
  });
}

export async function updateCategory(id: string, name: string, description?: string | null, slug?: string | null) {
  const normalized = normalizeCategoryInput(name, description, slug);
  await assertUniqueCategory(normalized.name, normalized.slug, id);

  return prisma.category.update({
    where: { id },
    data: normalized
  });
}

export async function deleteCategory(id: string) {
  const posts = await prisma.post.findMany({
    where: { categories: { some: { id } } },
    select: { id: true }
  });

  return prisma.$transaction(async (tx) => {
    for (const post of posts) {
      await tx.post.update({
        where: { id: post.id },
        data: { categories: { disconnect: { id } } }
      });
    }

    return tx.category.delete({ where: { id } });
  });
}
