import { z } from "zod";

export const postInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().optional().nullable(),
  contentHtml: z.string().default(""),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  publishedAt: z.date().optional().nullable(),
  categoryIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  coverImageId: z.string().optional().nullable(),
  ogImageId: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  metaTags: z.string().optional().nullable(),
  canonicalUrl: z.string().url().optional().or(z.literal("")).nullable()
});

export type PostInput = z.infer<typeof postInputSchema>;
