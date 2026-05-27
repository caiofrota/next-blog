import { brand } from "@/site/config/brand";
import { SiteSidebar } from "@/site/components/sidebar/site-sidebar";

export default function AboutPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <h1 className="text-4xl font-bold">Sobre</h1>
        <p className="mt-6 text-lg leading-8 text-muted">{brand.bio}</p>
      </div>
      <div className="lg:top-6 lg:self-start">
        <SiteSidebar />
      </div>
    </main>
  );
}
