import { PostStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { getReadingTimeMinutes } from "@/blog-engine/seo/reading-time";
import type { PostInput } from "@/blog-engine/validation/post";
import { normalizeMediaUrlsInHtml, sanitizePostHtml } from "@/blog-engine/storage/html";
import { cleanWordPressExcerpt } from "@/blog-engine/seo/text";
import { EMPTY_TAXONOMY_FILTER } from "@/blog-engine/admin/post-filter-constants";

export const postInclude = {
  author: true,
  coverImage: true,
  ogImage: true,
  categories: true,
  tags: true
} satisfies Prisma.PostInclude;

type AdminPostWithRelations = Prisma.PostGetPayload<{ include: typeof postInclude }>;
type AdminPostSortField = "title" | "status" | "createdAt" | "publishedAt" | "updatedAt" | "categories" | "tags" | "metaTags";
type SortDirection = "asc" | "desc";
export type AdminPostStatusFilter = "PUBLISHED" | "DRAFT" | "PENDING_CHANGES" | "SCHEDULED" | null;
export type AdminPostFilters = {
  title?: string;
  status?: AdminPostStatusFilter;
  categorySlugs?: string[];
  tagSlugs?: string[];
};

function getNow() {
  return new Date();
}

function getLivePublishedPostWhere(now = getNow()): Prisma.PostWhereInput {
  return {
    status: PostStatus.PUBLISHED,
    publishedAt: { lte: now }
  };
}

function getScheduledPostWhere(now = getNow()): Prisma.PostWhereInput {
  return {
    status: PostStatus.PUBLISHED,
    publishedAt: { gt: now }
  };
}

function getPublishedAtForSave(status: PostStatus, publishedAt?: Date | null) {
  if (status !== PostStatus.PUBLISHED) return null;
  return publishedAt ?? getNow();
}

function compareText(a: string, b: string) {
  return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
}

function getTaxonomySortLabel(items: { name: string }[]) {
  return items.map((item) => item.name).join(", ");
}

function buildAdminPostWhere(filters?: AdminPostFilters): Prisma.PostWhereInput {
  const and: Prisma.PostWhereInput[] = [];

  if (filters?.status) {
    if (filters.status === "PENDING_CHANGES") {
      and.push(buildPendingChangesWhere());
    } else if (filters.status === "SCHEDULED") {
      and.push(buildScheduledWhere());
    } else if (filters.status === "PUBLISHED") {
      and.push(getLivePublishedPostWhere());
    } else {
      and.push({ status: PostStatus.DRAFT });
    }
  }

  const categorySlugs = filters?.categorySlugs?.filter((slug) => slug !== EMPTY_TAXONOMY_FILTER) ?? [];
  const includeUncategorized = filters?.categorySlugs?.includes(EMPTY_TAXONOMY_FILTER) ?? false;
  if (categorySlugs.length > 0 || includeUncategorized) {
    const categoryFilters: Prisma.PostWhereInput[] = [];
    if (categorySlugs.length > 0) {
      categoryFilters.push({ categories: { some: { slug: { in: categorySlugs } } } });
    }
    if (includeUncategorized) {
      categoryFilters.push({ categories: { none: {} } });
    }
    and.push(categoryFilters.length === 1 ? categoryFilters[0] : { OR: categoryFilters });
  }

  const tagSlugs = filters?.tagSlugs?.filter((slug) => slug !== EMPTY_TAXONOMY_FILTER) ?? [];
  const includeUntagged = filters?.tagSlugs?.includes(EMPTY_TAXONOMY_FILTER) ?? false;
  if (tagSlugs.length > 0 || includeUntagged) {
    const tagFilters: Prisma.PostWhereInput[] = [];
    if (tagSlugs.length > 0) {
      tagFilters.push({ tags: { some: { slug: { in: tagSlugs } } } });
    }
    if (includeUntagged) {
      tagFilters.push({ tags: { none: {} } });
    }
    and.push(tagFilters.length === 1 ? tagFilters[0] : { OR: tagFilters });
  }

  if (and.length === 0) return {};
  if (and.length === 1) return and[0];
  return { AND: and };
}

function buildPendingChangesWhere(): Prisma.PostWhereInput {
  return {
    OR: [
      { hasUnpublishedChanges: true },
      { draftTitle: { not: null } },
      { draftExcerpt: { not: null } },
      { draftContentHtml: { not: null } }
    ]
  };
}

function buildScheduledWhere(): Prisma.PostWhereInput {
  return getScheduledPostWhere();
}

function rankAdminTitleMatch(title: string, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return { rank: 0, score: 0 };
  }

  const normalizedTitle = normalizeSearchText(title);
  if (!normalizedTitle) return null;

  if (normalizedTitle === normalizedQuery) {
    return { rank: 0, score: 1000 + normalizedQuery.length };
  }

  if (normalizedTitle.includes(normalizedQuery)) {
    return { rank: 1, score: 900 + normalizedQuery.length };
  }

  const queryTerms = normalizedQuery.split(" ").filter(Boolean);
  if (queryTerms.length > 1) {
    const allTermsPresent = queryTerms.every((term) => normalizedTitle.split(" ").some((word) => word.includes(term)));
    if (allTermsPresent) {
      return { rank: 2, score: 800 + queryTerms.length * 10 };
    }
  }

  const fuzzyScore = scoreFuzzyText(normalizedTitle, normalizedQuery, true);
  if (fuzzyScore > 0) {
    return { rank: 3, score: fuzzyScore };
  }

  return null;
}

function compareAdminPostsDefault(left: AdminPostWithRelations, right: AdminPostWithRelations) {
  const statusResult = left.status.localeCompare(right.status);
  if (statusResult !== 0) {
    return statusResult;
  }

  const publishedResult = (right.publishedAt?.getTime() ?? 0) - (left.publishedAt?.getTime() ?? 0);
  if (publishedResult !== 0) {
    return publishedResult;
  }

  const updatedResult = right.updatedAt.getTime() - left.updatedAt.getTime();
  if (updatedResult !== 0) {
    return updatedResult;
  }

  return compareText(left.title, right.title);
}

function compareAdminPostsByField(
  left: AdminPostWithRelations,
  right: AdminPostWithRelations,
  sort: AdminPostSortField,
  dir: SortDirection = "desc"
) {
  const factor = dir === "asc" ? 1 : -1;
  let result = 0;

  switch (sort) {
    case "title":
      result = compareText(left.title, right.title);
      break;
    case "status":
      result = left.status.localeCompare(right.status);
      break;
    case "publishedAt":
      result = (left.publishedAt?.getTime() ?? 0) - (right.publishedAt?.getTime() ?? 0);
      break;
    case "updatedAt":
      result = left.updatedAt.getTime() - right.updatedAt.getTime();
      break;
    case "categories":
      result = compareText(getTaxonomySortLabel(left.categories), getTaxonomySortLabel(right.categories));
      break;
    case "tags":
      result = compareText(getTaxonomySortLabel(left.tags), getTaxonomySortLabel(right.tags));
      break;
    case "metaTags":
      result = compareText(left.metaTags ?? "", right.metaTags ?? "");
      break;
  }

  if (result === 0) {
    result = compareText(left.title, right.title);
  }

  return result * factor;
}

function sortAdminPosts(posts: AdminPostWithRelations[], sort?: AdminPostSortField, dir: SortDirection = "desc") {
  return [...posts].sort((left, right) => {
    if (!sort) {
      return compareAdminPostsDefault(left, right);
    }

    return compareAdminPostsByField(left, right, sort, dir);
  });
}

export async function listPublishedPosts(options: { take?: number; skip?: number; query?: string } = {}) {
  const now = getNow();
  return prisma.post.findMany({
    where: {
      ...getLivePublishedPostWhere(now),
      OR: options.query
        ? [
            { title: { contains: options.query, mode: "insensitive" } },
            { excerpt: { contains: options.query, mode: "insensitive" } },
            { contentHtml: { contains: options.query, mode: "insensitive" } }
          ]
        : undefined
    },
    include: postInclude,
    orderBy: { publishedAt: "desc" },
    take: options.take ?? 10,
    skip: options.skip ?? 0
  });
}

export async function searchPublishedPosts(query: string, take = 20) {
  const normalizedQuery = normalizeSearchText(query);
  const terms = normalizedQuery.split(" ").filter(Boolean);
  if (terms.length === 0) return [];

  const posts = await listPublishedPosts({ take: 200 });
  const ranked = posts
    .map((post) => ({ post, ...rankSearchResult(post, terms, normalizedQuery) }))
    .filter((result) => result.rank < Number.POSITIVE_INFINITY);

  const directMatches = ranked.filter((result) => result.rank <= 4);
  const candidates = directMatches.length > 0 ? directMatches : ranked.filter((result) => result.rank >= 5);

  return candidates
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      if (b.score !== a.score) return b.score - a.score;
      return compareText(a.post.title, b.post.title);
    })
    .slice(0, take)
    .map((result) => result.post);
}

export async function listPublishedPostsPage(options: { take: number; skip: number }) {
  const posts = await listPublishedPosts({ take: options.take, skip: options.skip });
  const now = getNow();
  const total = await prisma.post.count({
    where: getLivePublishedPostWhere(now)
  });

  return { posts, total, hasMore: options.skip + posts.length < total };
}

function rankSearchResult(
  post: Awaited<ReturnType<typeof listPublishedPosts>>[number],
  terms: string[],
  normalizedQuery: string
) {
  const title = post.title;
  const excerpt = post.excerpt ?? "";
  const content = stripHtml(post.contentHtml ?? "");
  const taxonomy = [...post.categories.map((category) => category.name), ...post.tags.map((tag) => tag.name)].join(" ");

  const titleExact = scoreSearchField(title, normalizedQuery, 1000, 0, false);
  if (titleExact > 0) {
    return {
      rank: 0,
      score: titleExact * 1000 + scoreSearchField(title, normalizedQuery, 120, 0, false)
    };
  }

  const titleFuzzy = scoreSearchField(title, normalizedQuery, 0, 0, true) + terms.reduce((total, term) => total + scoreSearchField(title, term, 0, 0, true), 0);
  if (titleFuzzy > 0) {
    return {
      rank: 1,
      score: titleFuzzy * 100 + scoreSearchField(title, normalizedQuery, 100, 0, false)
    };
  }

  const excerptExact = scoreSearchField(excerpt, normalizedQuery, 500, 0, false);
  if (excerptExact > 0) {
    return { rank: 2, score: excerptExact };
  }

  const taxonomyExact = scoreSearchField(taxonomy, normalizedQuery, 450, 0, false);
  if (taxonomyExact > 0) {
    return { rank: 3, score: taxonomyExact };
  }

  const contentExact = scoreSearchField(content, normalizedQuery, 300, 0, false);
  if (contentExact > 0) {
    return { rank: 4, score: contentExact };
  }

  const excerptFuzzy = scoreSearchField(excerpt, normalizedQuery, 0, 0, true) + terms.reduce((total, term) => total + scoreSearchField(excerpt, term, 0, 0, true), 0);
  if (excerptFuzzy > 0) {
    return { rank: 5, score: excerptFuzzy };
  }

  const taxonomyFuzzy = scoreSearchField(taxonomy, normalizedQuery, 0, 0, true) + terms.reduce((total, term) => total + scoreSearchField(taxonomy, term, 0, 0, true), 0);
  if (taxonomyFuzzy > 0) {
    return { rank: 6, score: taxonomyFuzzy };
  }

  const contentFuzzy = scoreSearchField(content, normalizedQuery, 0, 0, true) + terms.reduce((total, term) => total + scoreSearchField(content, term, 0, 0, true), 0);
  if (contentFuzzy > 0) {
    return { rank: 7, score: contentFuzzy };
  }

  return { rank: Number.POSITIVE_INFINITY, score: 0 };
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ");
}

function scoreSearchField(value: string, query: string, exactWeight: number, fuzzyWeight: number, allowFuzzy: boolean) {
  const normalizedValue = normalizeSearchText(value);
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedValue || !normalizedQuery) return 0;

  if (normalizedValue === normalizedQuery || normalizedValue.includes(normalizedQuery)) {
    return exactWeight + normalizedQuery.length;
  }

  if (!allowFuzzy) return 0;

  const fuzzyScore = scoreFuzzyText(normalizedValue, normalizedQuery, false);
  return fuzzyScore > 0 ? fuzzyWeight + fuzzyScore : 0;
}

function scoreFuzzyText(normalizedValue: string, normalizedQuery: string, allowShortMatch: boolean) {
  const queryTerms = normalizedQuery.split(" ").filter(Boolean);
  const valueWords = normalizedValue.split(" ").filter(Boolean);
  if (queryTerms.length === 0 || valueWords.length === 0) return 0;

  let score = 0;
  for (const term of queryTerms) {
    const exact = valueWords.some((word) => word.includes(term) || term.includes(word));
    if (exact) {
      score += 3;
      continue;
    }

    const similar = allowShortMatch
      ? valueWords.some((word) => areSimilarSearchTerms(term, word))
      : valueWords.some((word) => areSimilarSearchTerms(term, word) && term.length >= 4 && word.length >= 4);
    if (similar) score += 1;
  }

  return score;
}

function areSimilarSearchTerms(term: string, word: string) {
  if (term.length < 4 || word.length < 4) return false;
  if (word.includes(term) || term.includes(word)) return true;

  const maxDistance = term.length <= 5 ? 1 : 2;
  return getLevenshteinDistance(term, word.slice(0, Math.max(word.length, term.length))) <= maxDistance;
}

function getLevenshteinDistance(a: string, b: string) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length];
}

export async function getPublishedPostBySlug(slug: string) {
  const now = getNow();
  return prisma.post.findFirst({
    where: { slug, ...getLivePublishedPostWhere(now) },
    include: postInclude
  });
}

export async function listAdminPosts(filters?: AdminPostFilters): Promise<AdminPostWithRelations[]> {
  return prisma.post.findMany({
    where: buildAdminPostWhere(filters),
    include: postInclude,
    orderBy: [{ status: "asc" }, { publishedAt: "desc" }, { updatedAt: "desc" }]
  });
}

export async function listAdminPostsPage(options: { take: number; skip: number; sort?: AdminPostSortField; dir?: SortDirection; filters?: AdminPostFilters }) {
  const posts = await listAdminPosts(options.filters);
  const titleQuery = options.filters?.title?.trim() ?? "";
  const hasTitleQuery = titleQuery.length > 0;

  const sortedPosts = hasTitleQuery
    ? posts
        .map((post) => ({ post, match: rankAdminTitleMatch(post.title, titleQuery) }))
        .filter((result): result is { post: AdminPostWithRelations; match: { rank: number; score: number } } => Boolean(result.match))
        .sort((left, right) => {
          if (left.match.rank !== right.match.rank) return left.match.rank - right.match.rank;
          if (right.match.score !== left.match.score) return right.match.score - left.match.score;
          if (options.sort) {
            return compareAdminPostsByField(left.post, right.post, options.sort, options.dir);
          }
          return compareAdminPostsDefault(left.post, right.post);
        })
        .map((result) => result.post)
    : sortAdminPosts(posts, options.sort, options.dir);

  const paginatedPosts = sortedPosts.slice(options.skip, options.skip + options.take);

  return {
    posts: paginatedPosts,
    total: sortedPosts.length,
    hasMore: options.skip + paginatedPosts.length < sortedPosts.length
  };
}

export async function getAdminPostSummary() {
  const now = getNow();
  const [total, published, scheduled, drafts, unpublishedChanges] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: getLivePublishedPostWhere(now) }),
    prisma.post.count({ where: getScheduledPostWhere(now) }),
    prisma.post.count({ where: { status: PostStatus.DRAFT } }),
    prisma.post.count({ where: buildPendingChangesWhere() })
  ]);

  return { total, published, scheduled, drafts, unpublishedChanges };
}

export async function getAdminPost(id: string) {
  return prisma.post.findUnique({ where: { id }, include: postInclude });
}

export async function createPost(input: PostInput, authorId: string, id?: string) {
  const contentHtml = sanitizePostHtml(normalizeMediaUrlsInHtml(input.contentHtml ?? ""));
  return prisma.post.create({
    data: {
      id,
      title: input.title,
      slug: slugify(input.slug || input.title),
      excerpt: cleanWordPressExcerpt(input.excerpt),
      contentHtml,
      status: input.status,
      publishedAt: getPublishedAtForSave(input.status, input.publishedAt),
      readingTimeMinutes: getReadingTimeMinutes(contentHtml),
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      metaTags: input.metaTags || null,
      canonicalUrl: input.canonicalUrl || null,
      authorId,
      coverImageId: input.coverImageId,
      ogImageId: input.ogImageId,
      categories: { connect: input.categoryIds.map((id) => ({ id })) },
      tags: { connect: input.tagIds.map((id) => ({ id })) }
    },
    include: postInclude
  });
}

export async function updatePost(id: string, input: PostInput) {
  const contentHtml = sanitizePostHtml(normalizeMediaUrlsInHtml(input.contentHtml ?? ""));

  return prisma.post.update({
    where: { id },
    data: {
      title: input.title,
      slug: slugify(input.slug || input.title),
      excerpt: cleanWordPressExcerpt(input.excerpt),
      status: input.status,
      contentHtml,
      draftTitle: null,
      draftExcerpt: null,
      draftContentHtml: null,
      hasUnpublishedChanges: false,
      publishedAt: getPublishedAtForSave(input.status, input.publishedAt),
      readingTimeMinutes: getReadingTimeMinutes(contentHtml),
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      metaTags: input.metaTags || null,
      canonicalUrl: input.canonicalUrl || null,
      coverImageId: input.coverImageId,
      ogImageId: input.ogImageId,
      categories: { set: input.categoryIds.map((categoryId) => ({ id: categoryId })) },
      tags: { set: input.tagIds.map((tagId) => ({ id: tagId })) }
    },
    include: postInclude
  });
}

export async function updatePostStatus(id: string, status: PostStatus) {
  const current = await prisma.post.findUnique({ where: { id } });
  if (!current) throw new Error("Post not found");

  if (status === PostStatus.PUBLISHED) {
    const contentHtml = normalizeMediaUrlsInHtml(current.draftContentHtml ?? current.contentHtml);

    return prisma.post.update({
      where: { id },
      data: {
        title: current.draftTitle ?? current.title,
        excerpt: cleanWordPressExcerpt(current.draftExcerpt ?? current.excerpt),
        contentHtml,
        draftTitle: null,
        draftExcerpt: null,
        draftContentHtml: null,
        hasUnpublishedChanges: false,
        status,
        publishedAt: getNow(),
        readingTimeMinutes: getReadingTimeMinutes(contentHtml)
      },
      include: postInclude
    });
  }

  return prisma.post.update({
    where: { id },
    data: {
      status,
      publishedAt: null,
      draftTitle: null,
      draftExcerpt: null,
      draftContentHtml: null,
      hasUnpublishedChanges: false
    },
    include: postInclude
  });
}

export async function deletePost(id: string) {
  return prisma.post.delete({ where: { id } });
}

export async function postsByCategory(slug: string) {
  return prisma.post.findMany({
    where: { categories: { some: { slug } }, ...getLivePublishedPostWhere() },
    include: postInclude,
    orderBy: { publishedAt: "desc" }
  });
}

export async function postsByTag(slug: string) {
  return prisma.post.findMany({
    where: { tags: { some: { slug } }, ...getLivePublishedPostWhere() },
    include: postInclude,
    orderBy: { publishedAt: "desc" }
  });
}
