import { NextResponse } from "next/server";
import { requireAdmin } from "@/blog-engine/services/auth";
import { buildNewsletterUnsubscribeUrl, listNewsletterSubscribers } from "@/blog-engine/services/newsletter";
import { renderNewsletterCampaignEmailHtml, renderNewsletterCampaignTextContent } from "@/lib/newsletter-email";
import { sendEmail } from "@/lib/email";

function parseRecipientEmails(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  await requireAdmin();

  const formData = await request.formData();
  const subject = String(formData.get("subject") ?? "").trim();
  const bodyHtml = String(formData.get("bodyHtml") ?? "").trim();
  const recipientEmails = parseRecipientEmails(formData.get("recipients"));

  if (!subject || !bodyHtml) {
    return NextResponse.json({ ok: false, error: "Informe assunto e conteúdo da newsletter." }, { status: 400 });
  }

  const activeSubscribers = await listNewsletterSubscribers();
  const recipientSet = recipientEmails.length > 0 ? new Set(recipientEmails) : null;
  const recipients = activeSubscribers.filter((subscriber) => (recipientSet ? recipientSet.has(subscriber.email) : true));

  if (recipients.length === 0) {
    return NextResponse.json({ ok: false, error: "Selecione ao menos um email válido." }, { status: 400 });
  }

  const attachments = await Promise.all(
    Array.from(formData.entries())
      .filter(([key, value]) => key.startsWith("attachment_") && value instanceof File)
      .map(async ([key, value]) => {
        const file = value as File;
        const cid = key.replace(/^attachment_/, "");
        return {
          filename: file.name,
          contentType: file.type || undefined,
          cid,
          content: Buffer.from(await file.arrayBuffer())
        };
      })
  );

  for (const subscriber of recipients) {
    const unsubscribeUrl = buildNewsletterUnsubscribeUrl(subscriber.unsubscribeToken);
    const htmlContent = renderNewsletterCampaignEmailHtml({ subject, bodyHtml, unsubscribeUrl });
    const textContent = renderNewsletterCampaignTextContent({ subject, bodyHtml, unsubscribeUrl });

    await sendEmail({
      to: [{ email: subscriber.email }],
      subject,
      textContent,
      htmlContent,
      attachments
    });
  }

  return NextResponse.json({ ok: true, sent: recipients.length });
}
