import Link from "next/link";
import { brand } from "@/site/config/brand";
import { SocialIconLink } from "@/site/components/social/social-icons";

export function SiteFooter() {
  return (
    <footer className="mt-6 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8">
        <Link href="/" className="text-center text-2xl font-semibold text-ink hover:text-primary">
          {brand.name}
        </Link>
        <div className="flex gap-2">
          {brand.facebook !== "#" ? <SocialIconLink href={brand.facebook} label="Facebook" network="facebook" /> : null}
          {brand.instagram !== "#" ? <SocialIconLink href={brand.instagram} label="Instagram" network="instagram" /> : null}
          {brand.x !== "#" ? <SocialIconLink href={brand.x} label="X" network="x" /> : null}
        </div>
      </div>
      <div className="border-t border-[#f0ebe6] px-4 py-5 text-center text-xs text-muted">
        © Copyright {new Date().getFullYear()} | <Link href="/" className="hover:text-primary">{brand.name}</Link> | Todos os direitos reservados | Desenvolvido por{" "}
        <Link href="https://caiofrota.com.br" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
          Caio Frota
        </Link>
      </div>
    </footer>
  );
}
