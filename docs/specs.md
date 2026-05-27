# Project Specs

This document separates the non-technical product expectations from the technical contract.

## Non-technical goals

- the site should feel like a real publication, not a generic CMS demo
- the admin should feel calm, direct, and efficient
- editors should recognize the workflow if they have used WordPress before
- content changes should be explicit
- the public site should prioritize readability and trust

## Editorial behavior

- posts have title, slug, excerpt, content, categories, tags, and SEO fields
- draft and published states are explicit
- published posts can accumulate unpublished changes
- media are shared across the public site and the admin
- featured image is visible in the editor and on the public post when configured

## Technical contract

- Next.js App Router
- React
- TypeScript
- Prisma
- PostgreSQL
- Tailwind CSS
- Tiptap editor
- R2-compatible media storage

## Admin behavior

- filter, sort, and pagination should use the Next router
- destructive actions should require confirmation
- long-running actions should show loading feedback
- status, category, tag, and media operations should be reflected immediately in the list view after save

## SEO contract

- metadata must be generated from the post record
- canonical URLs should resolve to the post URL unless explicitly overridden
- Open Graph and Twitter metadata should use post images when present
- meta tags should be stored in the post record and rendered into SEO output

## Media contract

- store the media key and metadata, not the binary in the database
- derive public URLs at render time
- keep upload and delete operations on the storage provider
- keep the admin media list paginated

## Security contract

- admin is protected by session cookies
- login should be rate limited
- stored HTML should be sanitized before render
- uploads should enforce type and size limits
- target-blank links should not introduce tabnabbing

## Reuse rule

If a change alters the content model, the admin workflow, or the storage contract, treat it as a product change, not a visual tweak.
