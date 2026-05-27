import { NextResponse } from "next/server";
import { z } from "zod";
import { renderContactEmailHtml } from "@/lib/email-template";
import { sendEmail } from "@/lib/email";

const contactSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().min(5).max(4000),
  website: z.string().trim().optional()
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Revise os campos e tente novamente." }, { status: 400 });
  }

  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const subject = parsed.data.subject || "Contato pelo site";
  const textContent = [
    `Nome: ${parsed.data.name}`,
    `Email: ${parsed.data.email}`,
    `Assunto: ${subject}`,
    "",
    parsed.data.message
  ].join("\n");

  await sendEmail({
    replyTo: { email: parsed.data.email, name: parsed.data.name },
    subject: `[Site] ${subject}`,
    textContent,
    htmlContent: renderContactEmailHtml({
      name: parsed.data.name,
      email: parsed.data.email,
      subject,
      message: parsed.data.message
    })
  });

  return NextResponse.json({ ok: true });
}
