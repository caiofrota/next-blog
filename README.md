# NextBlog

Reusable Next.js blog starter with a built-in CMS admin, SEO metadata, newsletter flows, media library, and WordPress migration.

NextBlog is a production-minded foundation for launching content sites faster. It combines a public blog, a custom admin panel, Prisma/PostgreSQL, Tiptap editing, S3-compatible media storage, sitemap, robots, structured SEO metadata, contact forms, and newsletter workflows in one reusable codebase.

Use it to build the next blog for a brand, creator, agency, SaaS company, publication, documentation hub, or niche content business without starting from a blank Next.js project.

## Why NextBlog?

- **Built for reusable launches**: keep the blog engine stable and swap the brand, navigation, categories, content, colors, and social links for each new project.
- **Content and admin in one codebase**: publish posts, manage media, edit categories and tags, maintain users, and send newsletters from a custom admin.
- **SEO-ready foundation**: includes canonical URLs, sitemap, robots, Open Graph metadata, Twitter cards, article JSON-LD, site metadata, and searchable category/tag pages.
- **Migration-friendly**: includes a WordPress migration path for posts, categories, tags, featured media, and inline images.
- **Modern full-stack stack**: built with Next.js App Router, React, TypeScript, Prisma, PostgreSQL, Tailwind CSS, Tiptap, and S3-compatible storage.
- **Productizable architecture**: separates reusable blog engine code from site-specific branding, making it easier to turn the base into multiple client projects or a polished product.

## Features

- Public blog pages with posts, categories, tags, search, contact, newsletter, and SEO metadata
- Custom admin for posts, media, categories, tags, users, and newsletter sending
- Rich text post editor powered by Tiptap
- Prisma data model backed by PostgreSQL
- Media storage through Cloudflare R2 or other S3-compatible providers
- SEO helpers for metadata, JSON-LD, canonical URLs, sitemap, and robots
- Optional WordPress migration tooling
- Rebrand workflow for adapting the starter to new blogs
- Neutral visual baseline designed to be customized quickly

## Use Cases

- Personal blogs and creator websites
- Company blogs and SaaS content hubs
- Agency starter kits for recurring client builds
- Editorial sites and niche publications
- Documentation-backed content marketing sites
- WordPress-to-Next.js migration projects
- Reusable internal blog platforms

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Prisma
- PostgreSQL
- Tailwind CSS
- Tiptap editor
- Cloudflare R2 / S3-compatible storage

## Project Structure

- `src/blog-engine`: reusable blog engine, admin services, storage, validation, SEO, and migration code
- `src/site`: site-specific branding, navigation, presentation components, and public configuration
- `src/app/(site)`: public website routes
- `src/app/admin`: private admin routes
- `prisma`: database schema, migrations, and seed data
- `scripts`: operational scripts for admin users, migration, media renaming, Instagram feed, and local proxy helpers
- `skills/blog-rebrand/SKILL.md`: rebrand workflow for future blog implementations

## Main Configuration Points

- `src/site/config/brand.ts`: site name, description, author, social links, logo, profile image, keywords, and bio
- `src/site/config/navigation.ts`: public menu
- `tailwind.config.ts`: neutral color tokens, typography, and design values
- `.env.example`: database, contact, SMTP, storage, and migration variables
- `prisma/seed.ts`: starter categories

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm db:up
pnpm db:migrate
ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="change-me-now" pnpm admin:create
pnpm dev
```

Open the app at:

```text
http://localhost:3000
```

## Useful Scripts

```bash
pnpm dev          # Start local development
pnpm build        # Generate Prisma client and build Next.js
pnpm start        # Start production server
pnpm typecheck    # Run TypeScript checks
pnpm db:up        # Start local database with Docker Compose
pnpm db:migrate   # Run Prisma migrations
pnpm db:studio    # Open Prisma Studio
pnpm admin:create # Create an admin user
pnpm wp:migrate   # Run WordPress migration
```

## Demo Mode

Use `DEMO_MODE=true` to publish a safe public demo of NextBlog.

In demo mode, the app uses in-memory posts, categories, tags, media assets, newsletter subscribers, and an admin user. Admin actions return successful simulated responses, but they do not persist posts, users, categories, tags, newsletter subscriptions, sessions, uploaded images, or sent emails.

```env
DEMO_MODE="true"
DEMO_ADMIN_EMAIL="demo@nextblog.dev"
DEMO_ADMIN_PASSWORD="nextblog-demo"
```

SMTP and R2 variables can stay empty in demo mode. Keep a valid `DATABASE_URL` string available for Prisma tooling during build, but runtime demo reads and writes are served from the demo seed instead of the database.

## Local WSL Access

When running the app inside WSL and accessing it from Windows or another device on the network, use the proxy helpers:

```bash
pnpm proxy:add
pnpm proxy:list
pnpm proxy:remove
```

The default proxy script exposes port `3000`. To expose other ports, set `PROXY_PORTS` in `.env` and run `sh ./scripts/proxy-add.sh` or `sh ./scripts/proxy-remove.sh`.

## Optional WordPress Migration

```bash
pnpm wp:migrate -- --base-url https://example.com --dry-run --verbose --limit 5
pnpm wp:migrate -- --base-url https://example.com --verbose
```

The migrator imports posts, categories, tags, featured media, inline images, and stores migrated post HTML in `contentHtml`.

## Rebranding A New Blog

NextBlog is designed to become the next blog for a new brand or project. Start with:

1. Update `src/site/config/brand.ts`.
2. Update `src/site/config/navigation.ts`.
3. Adjust `tailwind.config.ts` color tokens.
4. Replace icons, images, categories, social links, and public copy.
5. Run `pnpm typecheck` and `pnpm build`.

Reusable code lives in `src/blog-engine`. Site-specific branding and public presentation live in `src/site`.
