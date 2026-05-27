import { NextResponse } from "next/server";
import { z } from "zod";
import { subscribeNewsletter } from "@/blog-engine/services/newsletter";
import { renderNewsletterEmailHtml } from "@/lib/email-template";
import { sendEmail } from "@/lib/email";

const newsletterSchema = z.object({
  email: z.string().trim().email(),
  website: z.string().trim().optional()
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = newsletterSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Informe um email válido." }, { status: 400 });
  }

  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  await subscribeNewsletter(parsed.data.email);

  await sendEmail({
    subject: "[Site] Novo cadastro na newsletter",
    textContent: [`Email: ${parsed.data.email}`, "", "Este email pediu para receber novidades do blog."].join("\n"),
    htmlContent: renderNewsletterEmailHtml({ email: parsed.data.email })
  });

  return NextResponse.json({ ok: true });
}
