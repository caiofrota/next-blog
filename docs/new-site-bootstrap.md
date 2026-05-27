# Bootstrapping a New Site

Use this project as a starting point for a new single-site publication when you want the same admin and content model, but different branding.

## What to keep

- the blog engine
- the admin routes and services
- the Prisma data model
- the storage abstraction
- the SEO helpers
- the WordPress migration tooling if you need it
- the local rebrand skill at `skills/blog-rebrand/SKILL.md`

## What to replace

- the public design
- the brand config
- the author/profile imagery
- social links
- home page layout
- category/tag names and writing voice

## Start-from-zero checklist

1. Copy the engine and the shared lib files.
2. Update environment variables.
3. Configure the database and storage.
4. Create the first admin user.
5. Decide whether to seed sample content.
6. Replace the public-facing components.
7. Keep the admin workflow intact unless the new project has a different publishing process.
8. Use `skills/blog-rebrand/SKILL.md` as the checklist for future identity updates.

## Product assumptions

- one blog owner or publishing team, not many tenants
- one post database
- one media library
- one authentication boundary for admin work
- explicit save/publish actions

## Recommended environment setup

- PostgreSQL for the database
- R2 or another S3-compatible storage provider
- a public base URL for canonical links and metadata
- a secret session cookie name only when deploying to another environment

## Local setup commands

```bash
pnpm install
cp .env.example .env
pnpm db:up
pnpm db:migrate
ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="change-me-now" pnpm admin:create
pnpm dev
```

For WSL development, use `pnpm proxy:add`, `pnpm proxy:list`, and `pnpm proxy:remove` to manage Windows port proxy entries for the app port.

## What makes this stack reusable

- content is stored as HTML
- media is storage-key based
- metadata is generated from the post record
- the public site is only a presentation layer

That makes it practical to copy the engine into a new project without rewriting the content model.

## What usually changes first

- typography
- article layout
- hero/header/footer
- sidebars
- category/tag naming
- writing tone and SEO defaults

## If the new project needs more

If the new project becomes multi-author, multi-site, or multi-tenant, treat that as a platform change. It is not a small refactor.
