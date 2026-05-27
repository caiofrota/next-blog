import type { Metadata } from "next";
import "./globals.css";
import { brand } from "@/site/config/brand";

export const metadata: Metadata = {
  title: {
    default: brand.name,
    template: `%s | ${brand.name}`
  },
  description: brand.description,
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
      <body>{children}</body>
    </html>
  );
}
