import { PostStatus, UserRole } from "@prisma/client";
import { slugify } from "@/lib/slug";
import { getReadingTimeMinutes } from "@/blog-engine/seo/reading-time";
import type { PostInput } from "@/blog-engine/validation/post";

const publishedAt = new Date("2026-05-20T12:00:00.000Z");
const updatedAt = new Date("2026-05-27T12:00:00.000Z");

export const demoUser = {
  id: "demo-user-admin",
  name: "NextBlog Demo",
  email: "demo@nextblog.dev",
  passwordHash: "demo",
  role: UserRole.ADMIN,
  createdAt: publishedAt,
  updatedAt
};

export const demoCategories = [
  {
    id: "demo-category-product",
    name: "Produto",
    slug: "produto",
    description: "Guias sobre transformar conteúdo em produto digital.",
    createdAt: publishedAt,
    updatedAt
  },
  {
    id: "demo-category-seo",
    name: "SEO",
    slug: "seo",
    description: "Estratégias para melhorar descoberta, indexação e tráfego orgânico.",
    createdAt: publishedAt,
    updatedAt
  },
  {
    id: "demo-category-engineering",
    name: "Engenharia",
    slug: "engenharia",
    description: "Arquitetura, infraestrutura e decisões técnicas para blogs modernos.",
    createdAt: publishedAt,
    updatedAt
  }
];

export const demoTags = [
  { id: "demo-tag-nextjs", name: "Next.js", slug: "nextjs", createdAt: publishedAt, updatedAt },
  { id: "demo-tag-cms", name: "CMS", slug: "cms", createdAt: publishedAt, updatedAt },
  { id: "demo-tag-newsletter", name: "Newsletter", slug: "newsletter", createdAt: publishedAt, updatedAt },
  { id: "demo-tag-wordpress", name: "WordPress", slug: "wordpress", createdAt: publishedAt, updatedAt }
];

export const demoMediaAssets = [
  {
    id: "demo-media-launch",
    key: "demo/nextblog-launch.svg",
    provider: "demo",
    filename: "nextblog-launch.svg",
    mimeType: "image/svg+xml",
    size: 2048,
    width: 1200,
    height: 800,
    altText: "Tela editorial do NextBlog",
    legacyUrl: null,
    createdAt: publishedAt,
    updatedAt
  },
  {
    id: "demo-media-seo",
    key: "demo/seo-dashboard.svg",
    provider: "demo",
    filename: "seo-dashboard.svg",
    mimeType: "image/svg+xml",
    size: 2048,
    width: 1200,
    height: 800,
    altText: "Painel de SEO e conteúdo",
    legacyUrl: null,
    createdAt: publishedAt,
    updatedAt
  },
  {
    id: "demo-media-migration",
    key: "demo/wordpress-migration.svg",
    provider: "demo",
    filename: "wordpress-migration.svg",
    mimeType: "image/svg+xml",
    size: 2048,
    width: 1200,
    height: 800,
    altText: "Migração de WordPress para Next.js",
    legacyUrl: null,
    createdAt: publishedAt,
    updatedAt
  }
];

export const demoNewsletterSubscribers = [
  makeSubscriber("demo-subscriber-1", "founder@example.com", "demo-token-founder"),
  makeSubscriber("demo-subscriber-2", "editor@example.com", "demo-token-editor"),
  makeSubscriber("demo-subscriber-3", "growth@example.com", "demo-token-growth")
];

export const demoPosts = [
  makePost({
    id: "demo-post-nextblog-product",
    title: "Como transformar um blog Next.js em um produto reutilizavel",
    slug: "como-transformar-um-blog-nextjs-em-produto",
    excerpt: "Uma visão prática de como separar engine, marca, SEO e admin para lançar novos blogs mais rápido.",
    imageId: "demo-media-launch",
    categoryIds: ["demo-category-product"],
    tagIds: ["demo-tag-nextjs", "demo-tag-cms"],
    publishedAt: new Date("2026-05-26T12:00:00.000Z")
  }),
  makePost({
    id: "demo-post-seo-foundation",
    title: "Checklist de SEO para blogs criados com NextBlog",
    slug: "checklist-seo-blogs-nextblog",
    excerpt: "Metadados, sitemap, robots, JSON-LD e taxonomias bem planejadas ajudam o conteúdo a ser encontrado.",
    imageId: "demo-media-seo",
    categoryIds: ["demo-category-seo"],
    tagIds: ["demo-tag-nextjs", "demo-tag-newsletter"],
    publishedAt: new Date("2026-05-24T12:00:00.000Z")
  }),
  makePost({
    id: "demo-post-wordpress-migration",
    title: "Migrando conteudo legado do WordPress para uma base moderna",
    slug: "migrando-conteudo-wordpress-base-moderna",
    excerpt: "O fluxo de migração preserva posts, categorias, tags, imagens destacadas e HTML de conteúdo.",
    imageId: "demo-media-migration",
    categoryIds: ["demo-category-engineering"],
    tagIds: ["demo-tag-wordpress", "demo-tag-cms"],
    publishedAt: new Date("2026-05-22T12:00:00.000Z")
  })
];

function makePost(input: {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  imageId: string;
  categoryIds: string[];
  tagIds: string[];
  publishedAt: Date;
}) {
  const contentHtml = [
    `<p>${input.excerpt}</p>`,
    `<p>Este conteudo faz parte do seed demonstrativo do NextBlog. Ele existe para mostrar a experiencia publica e administrativa sem gravar dados reais.</p>`,
    `<img src="${demoMediaAssets.find((asset) => asset.id === input.imageId)?.key}" alt="${input.title}" />`,
    "<p>No modo demo, criar posts, editar taxonomias, enviar newsletter e fazer upload de imagens retorna sucesso simulado, mas nada e persistido.</p>"
  ].join("");

  return {
    id: input.id,
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    contentHtml,
    draftTitle: null,
    draftExcerpt: null,
    draftContentHtml: null,
    hasUnpublishedChanges: false,
    status: PostStatus.PUBLISHED as PostStatus,
    coverImageId: input.imageId,
    ogImageId: input.imageId,
    authorId: demoUser.id,
    publishedAt: input.publishedAt,
    seoTitle: input.title,
    seoDescription: input.excerpt,
    metaTags: "Next.js, blog, SEO, CMS",
    canonicalUrl: null,
    readingTimeMinutes: getReadingTimeMinutes(contentHtml),
    legacySource: null,
    legacyId: null,
    legacyUrl: null,
    createdAt: input.publishedAt,
    updatedAt,
    author: demoUser,
    coverImage: demoMediaAssets.find((asset) => asset.id === input.imageId) ?? null,
    ogImage: demoMediaAssets.find((asset) => asset.id === input.imageId) ?? null,
    categories: demoCategories.filter((category) => input.categoryIds.includes(category.id)),
    tags: demoTags.filter((tag) => input.tagIds.includes(tag.id))
  };
}

function makeSubscriber(id: string, email: string, unsubscribeToken: string) {
  return {
    id,
    email,
    unsubscribeToken,
    subscribedAt: publishedAt,
    unsubscribedAt: null,
    createdAt: publishedAt,
    updatedAt
  };
}

export function createDemoPostFromInput(input: PostInput) {
  const contentHtml = input.contentHtml || "<p>Post simulado no modo demo.</p>";
  return {
    ...demoPosts[0],
    id: demoPosts[0].id,
    title: input.title,
    slug: slugify(input.slug || input.title) || "post-demo-nao-persistido",
    excerpt: input.excerpt || "Alteracao simulada no modo demo.",
    contentHtml,
    status: input.status,
    publishedAt: input.status === PostStatus.PUBLISHED ? input.publishedAt ?? updatedAt : null,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    metaTags: input.metaTags || null,
    canonicalUrl: input.canonicalUrl || null,
    readingTimeMinutes: getReadingTimeMinutes(contentHtml),
    updatedAt
  };
}

export function createDemoMediaAsset(filename: string, mimeType: string, size: number, altText?: string | null) {
  return {
    id: `demo-upload-${slugify(filename) || "image"}`,
    key: `demo/upload-${slugify(filename.replace(/\.[^.]+$/, "")) || "image"}.svg`,
    provider: "demo",
    filename,
    mimeType: mimeType || "image/svg+xml",
    size,
    width: 1200,
    height: 800,
    altText: altText || "Imagem simulada no modo demo",
    legacyUrl: null,
    createdAt: updatedAt,
    updatedAt
  };
}

export function demoImageSvg(key: string) {
  const label = key.includes("seo") ? "SEO" : key.includes("migration") ? "WordPress" : key.includes("upload") ? "Upload demo" : "NextBlog";
  const accent = key.includes("seo") ? "#2f6f73" : key.includes("migration") ? "#7c4d8b" : "#b75d3b";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-label="${label}">
    <rect width="1200" height="800" fill="#f6f1ea"/>
    <rect x="96" y="96" width="1008" height="608" rx="18" fill="#ffffff" stroke="#eaded3" stroke-width="4"/>
    <rect x="146" y="156" width="908" height="96" rx="10" fill="${accent}"/>
    <rect x="146" y="310" width="420" height="42" rx="8" fill="#1d2327" opacity="0.9"/>
    <rect x="146" y="380" width="780" height="28" rx="7" fill="#6b5b4d" opacity="0.42"/>
    <rect x="146" y="436" width="680" height="28" rx="7" fill="#6b5b4d" opacity="0.32"/>
    <rect x="146" y="530" width="260" height="72" rx="12" fill="${accent}" opacity="0.9"/>
    <text x="600" y="214" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="#ffffff">${label}</text>
    <text x="276" y="576" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#ffffff">DEMO</text>
  </svg>`;
}
