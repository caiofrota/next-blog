import { SiteFooter } from "@/site/components/footer/site-footer";
import { SiteHeader } from "@/site/components/header/site-header";

export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
