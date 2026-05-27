# Reusing the Blog Engine

This repository is a single-site blog/admin stack. The reusable core lives in `src/blog-engine`. The current public site is the thin layer in `src/site` and `src/app/(site)`.

Use this engine when you need:

- a WordPress replacement with a custom admin
- one public site, one admin, one database
- content migration from WordPress without rewriting everything into a CMS model
- a publishing workflow with drafts, published content, tags, categories, featured media, and SEO fields

Do not use it as-is for:

- multi-tenant SaaS
- multiple blogs sharing the same data model
- per-user site ownership
- a page-builder product

## What to copy into a new project

Copy the following pieces first:

- `src/blog-engine`
- `src/lib/prisma.ts`
- `src/lib/env.ts`
- `src/lib/slug.ts`
- `src/lib/security.ts`
- `prisma/schema.prisma`
- the Prisma migrations you want to preserve
- the WordPress migration and maintenance scripts you actually need

Then replace:

- `src/site`
- `src/app/(site)`
- `site/config` values
- brand assets and social metadata

Keep the route contracts unless you have a strong reason to change them:

- `/admin`
- `/admin/posts`
- `/admin/categorias`
- `/admin/tags`
- `/admin/media`
- `/api/admin/*`
- `/api/auth/*`

## Data model contract

The engine expects these core models:

- `User`
- `Session`
- `Post`
- `Category`
- `Tag`
- `MediaAsset`

The important part is not the exact table names. The important part is the behavior:

- `Post` is the source of truth for public content
- `draftTitle`, `draftExcerpt`, and `draftContentHtml` store unpublished work
- `hasUnpublishedChanges` marks a published post that has pending editor changes
- `MediaAsset` stores a storage key plus metadata, not binary image blobs
- categories and tags remain many-to-many relations

## Content model

Posts persist HTML in `contentHtml`. That is deliberate:

- it preserves imported WordPress content
- it keeps inline images and formatting stable
- it avoids locking the database to a specific editor JSON schema

Tiptap is only the editing surface. The database does not depend on Tiptap-specific JSON.

Before content is saved or rendered, the engine:

- normalizes media URLs
- sanitizes risky HTML
- resolves public storage URLs at runtime

That makes the stored post portable and safer to render publicly.

## Storage contract

Storage is S3-compatible. The default implementation targets Cloudflare R2.

Keep this contract intact:

- store keys, not raw file URLs
- store metadata in Postgres
- derive public URLs at runtime
- never depend on the R2 public development domain in database rows

If another project uses a different bucket or CDN, replace the storage adapter, not the content model.

## Workflow contract

The admin flow is manual and explicit:

- create post opens the editor
- nothing is committed until save/publish
- published posts can be reverted to draft
- deletions require confirmation

Search, filters, pagination, and action buttons use `next/navigation` so the URL remains the state carrier.

## Reuse checklist

1. Decide whether the new site is content-only or needs the same admin.
2. Copy the engine and the Prisma schema.
3. Swap brand/theme/site-specific components.
4. Configure storage and environment variables.
5. Decide if WordPress migration is part of the initial import or a later maintenance task.
6. Keep the public route and admin route contracts stable unless you have a migration plan for links and redirects.

## Not a platform

The engine is intentionally not multi-tenant. Do not add ownership fields or tenant IDs unless the target product truly becomes a platform. That change affects every query, every permission check, and every migration.
