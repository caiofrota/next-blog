# WordPress Migration Guide

This repository can ingest content from WordPress and keep the public URLs stable.

## What gets migrated

- posts
- categories
- tags
- featured image
- inline images
- excerpt
- publish state
- SEO metadata when present in the source

## What gets normalized

- WordPress image URLs are converted to the local/R2 storage key model
- legacy `Uncategorized` content is removed from the model and becomes a post without category
- HTML is kept as HTML, not rewritten into editor-specific JSON
- media URLs are resolved at render time, not stored as fixed public URLs

## Recommended migration flow

1. Configure the WordPress REST API base URL.
2. Run a dry run first.
3. Check how many posts, categories, tags, and media items were found.
4. Run the real import.
5. Review the admin for draft/published state, categories, tags, and media references.
6. Re-run only the cleanup or media steps if the source changes.

Example:

```bash
pnpm wp:migrate -- --dry-run --verbose --limit 5
pnpm wp:migrate -- --verbose
```

## Field mapping

Typical mappings:

- WordPress title -> `title`
- WordPress slug -> `slug`
- WordPress excerpt -> `excerpt`
- WordPress rendered content -> `contentHtml`
- WordPress featured media -> `coverImage`
- WordPress category list -> `categories`
- WordPress tag list -> `tags`

If the source has custom SEO fields, map them to:

- `seoTitle`
- `seoDescription`
- `metaTags`
- `canonicalUrl` when needed

## Media handling

Media are stored as storage objects plus metadata.

- image data is uploaded to storage
- only the storage key and metadata are saved in Postgres
- the public URL is derived when the page renders

This keeps the migration portable if the storage domain changes later.

## Known cleanup rules

- legacy `Uncategorized` should not survive as a real category
- empty categories and tags should be removed only if the source no longer uses them
- posts with no real category should remain category-less

## Validation checklist

- public post URLs resolve
- featured images render
- inline images resolve
- admin list counts look correct
- category/tag slugs are unique
- draft posts remain drafts after import
- published posts keep a published timestamp

## Operational note

Migration is a content operation, not a schema migration. Keep the Prisma schema stable unless the content model itself changes.
