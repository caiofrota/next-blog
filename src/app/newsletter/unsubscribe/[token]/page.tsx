import type { Metadata } from "next";
import Link from "next/link";
import { unsubscribeNewsletterByToken } from "@/blog-engine/services/newsletter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Descadastro da newsletter",
  robots: {
    index: false,
    follow: false
  }
};

export default async function NewsletterUnsubscribePage({ params }: { params: { token: string } }) {
  const result = await unsubscribeNewsletterByToken(params.token);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-12">
      <section className="w-full rounded-3xl border border-[#eaded3] bg-white p-8 shadow-[0_20px_60px_rgba(72,50,36,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted/60">Newsletter</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">{result ? "Você saiu da newsletter" : "Não foi possível confirmar o descadastro"}</h1>
        <p className="mt-4 text-sm leading-7 text-muted">
          {result
            ? "Seu email foi removido da lista de recebimento. Se quiser voltar depois, basta se cadastrar novamente no site."
            : "O link pode ter expirado, já ter sido usado ou estar inválido."}
        </p>
        <div className="mt-6">
          <Link href="/" className="admin-button-primary">
            Voltar para o site
          </Link>
        </div>
      </section>
    </main>
  );
}
