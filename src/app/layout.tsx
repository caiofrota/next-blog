import type { Metadata } from "next";
import "./globals.css";
import { brand } from "@/site/config/brand";
import { env } from "@/lib/env";
import { softwareApplicationJsonLd, websiteJsonLd } from "@/blog-engine/seo/json-ld";

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  applicationName: brand.name,
  title: {
    default: brand.name,
    template: `%s | ${brand.name}`
  },
  description: brand.description,
  keywords: brand.keywords,
  authors: [{ name: brand.author }],
  creator: brand.author,
  publisher: brand.name,
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: brand.name,
    title: brand.name,
    description: brand.description
  },
  twitter: {
    card: "summary",
    title: brand.name,
    description: brand.description
  },
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([websiteJsonLd(), softwareApplicationJsonLd()]) }}
        />
        {children}
      </body>
    </html>
  );
}
