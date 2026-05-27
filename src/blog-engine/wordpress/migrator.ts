import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { getReadingTimeMinutes } from "@/blog-engine/seo/reading-time";
import { getStorageProvider } from "@/blog-engine/storage/r2-storage";
import { createMediaAsset } from "@/blog-engine/services/media";
import { deleteCategory } from "@/blog-engine/services/categories";
import { sanitizePostHtml } from "@/blog-engine/storage/html";
import { WordPressClient, WordPressRequestError, type WpMedia, type WpPost } from "./client";
import { decodeExcerpt, decodeHtml, extractImageUrls, replaceUrls } from "./mapper";

type MigratorOptions = {
  baseUrl: string;
  dryRun?: boolean;
  limit?: number;
  postId?: number;
  verbose?: boolean;
  authorId: string;
};

export class WordPressMigrator {
  private client: WordPressClient;

  constructor(private options: MigratorOptions) {
    this.client = new WordPressClient(options.baseUrl);
  }

  async run() {
    const posts = this.options.postId ? [await this.client.getPost(this.options.postId)] : await this.collectPosts();
    for (const post of posts) {
      await this.importPost(post);
    }
    await this.cleanupLegacyUncategorizedCategory();
  }

  private async collectPosts() {
    const posts: WpPost[] = [];
    let page = 1;
    const limit = this.options.limit ?? Number.POSITIVE_INFINITY;

    while (posts.length < limit) {
      let batch: WpPost[];
      try {
        batch = await this.client.getPosts(page, Math.min(20, limit - posts.length));
      } catch (error) {
        if (error instanceof WordPressRequestError && error.status === 400 && error.code === "rest_post_invalid_page_number") {
          this.log(`Reached end of WordPress pagination at page ${page}.`);
          break;
        }
        throw error;
      }
      if (!batch.length) break;
      posts.push(...batch);
      page += 1;
    }

    return posts.slice(0, limit);
  }

  private async importPost(wpPost: WpPost) {
    this.log(`Importing post ${wpPost.id}: ${decodeHtml(wpPost.title.rendered)}`);
    const categoryIds = (await Promise.all(wpPost.categories.map((id) => this.importCategory(id)))).filter(
      (value): value is string => Boolean(value)
    );
    const tagIds = await Promise.all(wpPost.tags.map((id) => this.importTag(id)));
    const replacements = new Map<string, string>();

    const featuredMedia = wpPost._embedded?.["wp:featuredmedia"]?.[0] ?? (wpPost.featured_media ? await this.client.getMedia(wpPost.featured_media) : null);
    const coverImageId = featuredMedia ? await this.importMedia(featuredMedia, replacements) : null;

    for (const imageUrl of extractImageUrls(wpPost.content.rendered)) {
      await this.importMediaUrl(imageUrl, replacements);
    }

    const contentHtml = sanitizePostHtml(replaceUrls(wpPost.content.rendered, replacements));
    const createData = {
      title: decodeHtml(wpPost.title.rendered),
      slug: slugify(wpPost.slug || decodeHtml(wpPost.title.rendered)),
      excerpt: decodeExcerpt(wpPost.excerpt.rendered),
      contentHtml,
      status: "PUBLISHED" as const,
      publishedAt: new Date(`${wpPost.date_gmt}Z`),
      readingTimeMinutes: getReadingTimeMinutes(contentHtml),
      legacySource: "wordpress",
      legacyId: String(wpPost.id),
      legacyUrl: wpPost.link,
      authorId: this.options.authorId,
      coverImageId,
      categories: { connect: categoryIds.map((id) => ({ id })) },
      tags: { connect: tagIds.map((id) => ({ id })) }
    };
    const updateData = {
      ...createData,
      categories: { set: categoryIds.map((id) => ({ id })) },
      tags: { set: tagIds.map((id) => ({ id })) }
    };

    if (this.options.dryRun) {
      this.log(`[dry-run] Would upsert ${createData.slug}`);
      return;
    }

    await prisma.post.upsert({
      where: { legacySource_legacyId: { legacySource: "wordpress", legacyId: String(wpPost.id) } },
      create: createData,
      update: updateData
    });
  }

  private async importCategory(id: number) {
    const term = await this.client.getCategory(id);
    if (this.isLegacyUncategorizedTerm(term.slug, term.name)) {
      return null;
    }
    if (this.options.dryRun) return `dry-category-${id}`;
    const category = await prisma.category.upsert({
      where: { slug: slugify(term.slug || term.name) },
      create: { name: term.name, slug: slugify(term.slug || term.name), description: term.description },
      update: { name: term.name, description: term.description }
    });
    return category.id;
  }

  private async importTag(id: number) {
    const term = await this.client.getTag(id);
    if (this.options.dryRun) return `dry-tag-${id}`;
    const tag = await prisma.tag.upsert({
      where: { slug: slugify(term.slug || term.name) },
      create: { name: term.name, slug: slugify(term.slug || term.name) },
      update: { name: term.name }
    });
    return tag.id;
  }

  private async importMedia(media: WpMedia, replacements: Map<string, string>) {
    return this.importMediaUrl(media.source_url, replacements, media.alt_text, media.mime_type);
  }

  private async importMediaUrl(url: string, replacements: Map<string, string>, altText?: string, mimeType?: string) {
    const existing = await prisma.mediaAsset.findUnique({ where: { legacyUrl: url } });
    if (existing) {
      replacements.set(url, existing.key);
      return existing.id;
    }

    if (this.options.dryRun) {
      this.log(`[dry-run] Would upload media ${url}`);
      replacements.set(url, url);
      return null;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download media ${url}`);
    const body = Buffer.from(await response.arrayBuffer());
    const filename = decodeURIComponent(url.split("/").pop() ?? `media-${Date.now()}`);
    const key = `uploads/${Date.now()}-${slugify(filename)}`;
    const storage = getStorageProvider();
    const uploaded = await storage.putObject({ key, body, contentType: mimeType ?? response.headers.get("content-type") ?? "application/octet-stream" });
    const asset = await createMediaAsset({
      key: uploaded.key,
      provider: "r2",
      filename,
      mimeType: mimeType ?? response.headers.get("content-type") ?? "application/octet-stream",
      size: body.byteLength,
      altText: altText || null,
      legacyUrl: url
    });
    replacements.set(url, asset.key);
    return asset.id;
  }

  private log(message: string) {
    if (this.options.verbose || this.options.dryRun) {
      console.log(message);
    }
  }

  private isLegacyUncategorizedTerm(slug: string, name: string) {
    return slug.toLowerCase() === "uncategorized" || name.trim().toLowerCase() === "uncategorized";
  }

  private async cleanupLegacyUncategorizedCategory() {
    if (this.options.dryRun) {
      this.log("[dry-run] Would remove legacy Uncategorized category if it exists.");
      return;
    }

    const legacyCategories = await prisma.category.findMany({
      where: {
        OR: [
          { slug: "uncategorized" },
          {
            name: {
              equals: "uncategorized",
              mode: "insensitive"
            }
          }
        ]
      },
      select: { id: true }
    });

    if (legacyCategories.length === 0) return;

    for (const category of legacyCategories) {
      await deleteCategory(category.id);
    }

    this.log(`Removed ${legacyCategories.length} legacy Uncategorized categor${legacyCategories.length === 1 ? "y" : "ies"}.`);
  }
}
