---
name: blog-rebrand
description: Rebrand this Blog Base project for a new single-site blog by replacing visual identity, names, social links, categories, public copy, and environment defaults while preserving the reusable blog engine and admin functionality.
---

# Blog Rebrand

Use this skill when adapting this repository from the neutral `Blog Base` starter into a branded blog.

## Workflow

1. Read the requested brand/site identity and collect missing essentials only if they are not inferable: site name, domain, description, contact email, palette, social links, author/profile details, categories.
2. Keep reusable behavior in `src/blog-engine` intact unless the request explicitly changes admin or content workflows.
3. Update site-specific files first:
   - `src/site/config/brand.ts`
   - `src/site/config/navigation.ts`
   - `tailwind.config.ts`
   - `prisma/seed.ts`
   - `.env.example`
   - `README.md` and docs that mention the starter identity
4. Replace public-facing copy in:
   - `src/app/(site)`
   - `src/site/components`
   - email templates under `src/lib`
5. Add or update brand assets in `public/brand` only when actual assets are supplied or generated for the new site.
6. Search for leftovers before finishing:
   - `rg -n "Blog Base|example.com|Caio Frota|TODO brand|starter"`
   - also search for the previous project's name/domain if replacing an already branded implementation.
7. Validate with `pnpm typecheck` and `pnpm build`.

## Color Guidance

Keep component classes semantic. Prefer changing values in `tailwind.config.ts` over replacing classes across the app.

Use these tokens consistently:

- `ink`: main text
- `muted`: secondary text
- `canvas`: quiet background
- `primary`: actions and links
- `blush`, `rose`, `mint`: secondary accents

## Boundaries

Do not remove admin, Prisma, storage, newsletter, contact, SEO, media, or migration functionality during a normal rebrand. Treat those as engine features.
