# Blog Base

Next.js App Router blog base for reusable single-site blog projects.

This project is a starter, not a finished branded site. Public naming, colors, imagery, categories, social links, and writing tone should be replaced for each new implementation.

## What This Repo Is For

- public blog pages with posts, categories, tags, search, contact, newsletter, and SEO metadata
- a custom admin for posts, media, categories, tags, users, and newsletters
- optional legacy CMS content migration
- a reusable engine for future single-site blogs
- a neutral visual baseline that can be rebranded quickly

## Stack

- Next.js App Router
- React
- TypeScript
- Prisma
- PostgreSQL
- Tailwind CSS
- Tiptap editor
- Cloudflare R2 / S3-compatible storage

## Main Configuration Points

- `src/site/config/brand.ts`: site name, description, author, social links, logo, profile image, bio
- `src/site/config/navigation.ts`: public menu
- `tailwind.config.ts`: neutral color tokens, typography, and design values
- `.env.example`: database, contact, SMTP, storage, and migration variables
- `prisma/seed.ts`: starter categories
- `skills/blog-rebrand/SKILL.md`: rebrand workflow for future blog implementations

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:up
pnpm db:migrate
ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="change-me-now" pnpm admin:create
pnpm dev
```

## Local WSL Access

When running the app inside WSL and accessing it from Windows or another device on the network, use the proxy helpers:

```bash
pnpm proxy:add
pnpm proxy:list
pnpm proxy:remove
```

The default proxy script exposes port `3000`. To expose other ports, set `PROXY_PORTS` in `.env` and run `sh ./scripts/proxy-add.sh` or `sh ./scripts/proxy-remove.sh`.

## Optional Legacy Migration

```bash
pnpm wp:migrate -- --base-url https://example.com --dry-run --verbose --limit 5
pnpm wp:migrate -- --base-url https://example.com --verbose
```

The migrator imports posts, categories, tags, featured media, inline images, and stores migrated post HTML in `contentHtml`.

## Blog Engine

Reusable code lives in `src/blog-engine`. Site-specific branding and public presentation live in `src/site`.
