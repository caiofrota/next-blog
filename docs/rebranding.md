# Rebranding a New Blog

Use this checklist when turning this neutral base into a branded blog.

## Required Changes

1. Update `src/site/config/brand.ts`.
2. Update `src/site/config/navigation.ts`.
3. Update `tailwind.config.ts` color tokens.
4. Replace or remove public icons and brand images.
5. Update `.env.example` defaults.
6. Update `prisma/seed.ts` category names.
7. Replace public copy in `src/app/(site)` and `src/site/components`.
8. Run `rg -n "Blog Base|example.com|Caio Frota"` and remove leftovers when applying a final brand.

## Color Tokens

Keep public components using semantic Tailwind names:

- `primary`
- `blush`
- `rose`
- `mint`
- `canvas`
- `muted`
- `ink`

That keeps future rebrands mostly limited to `tailwind.config.ts`.

## Validation

Run:

```bash
pnpm typecheck
pnpm build
```

If legacy migration is used, run a dry run first:

```bash
pnpm wp:migrate -- --base-url https://example.com --dry-run --verbose --limit 5
```
