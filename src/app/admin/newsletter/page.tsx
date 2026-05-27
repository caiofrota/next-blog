import { AdminNav } from "@/blog-engine/components/admin/admin-nav";
import { NewsletterComposer } from "@/blog-engine/components/admin/newsletter-composer";
import { requireAdmin } from "@/blog-engine/services/auth";
import { countNewsletterSubscribers, listNewsletterSubscribers } from "@/blog-engine/services/newsletter";

export default async function AdminNewsletterPage() {
  await requireAdmin();
  const [subscribers, total] = await Promise.all([listNewsletterSubscribers(), countNewsletterSubscribers()]);

  return (
    <main className="admin-shell">
      <AdminNav />
      <div className="admin-container space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="admin-eyebrow">Newsletter</p>
            <h1 className="admin-title">Enviar campanha</h1>
            <p className="admin-subtitle">Selecione os inscritos, escreva a mensagem e visualize antes de disparar.</p>
          </div>
          <div className="admin-metric min-w-[12rem]">
            <p className="admin-metric-label">Inscritos ativos</p>
            <p className="admin-metric-value">{total}</p>
          </div>
        </div>

        <NewsletterComposer
          subscribers={subscribers.map((subscriber) => ({
            id: subscriber.id,
            email: subscriber.email,
            unsubscribeToken: subscriber.unsubscribeToken
          }))}
        />
      </div>
    </main>
  );
}
