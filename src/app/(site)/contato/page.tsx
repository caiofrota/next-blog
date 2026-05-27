import type { Metadata } from "next";
import { env } from "@/lib/env";
import { ContactForm } from "@/site/components/contact/contact-form";
import { SiteSidebar } from "@/site/components/sidebar/site-sidebar";
import { brand } from "@/site/config/brand";

const description = `Fale com o ${brand.name} para parcerias, pautas, sugestões e mensagens sobre o projeto.`;

export const metadata: Metadata = {
  title: "Contato",
  description,
  alternates: {
    canonical: "/contato"
  },
  openGraph: {
    title: `Contato | ${brand.name}`,
    description,
    url: "/contato"
  }
};

export default function ContactPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-8">
        <section className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Contato</p>
            <h1 className="text-4xl font-bold text-ink">Entre em contato</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted">
              Para parcerias, pautas, sugestões ou mensagens sobre o blog, escreva para{" "}
              <a href={`mailto:${env.CONTACT_EMAIL}`} className="font-semibold text-primary hover:text-ink">
                {env.CONTACT_EMAIL}
              </a>
              .
            </p>
          </div>
          <ContactForm />
        </section>
      </div>
      <div className="lg:top-6 lg:self-start">
        <SiteSidebar />
      </div>
    </main>
  );
}
