import { brand } from "@/site/config/brand";

type EmailField = {
  label: string;
  value: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeText(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function renderField(field: EmailField) {
  return `
    <tr>
      <td style="padding: 0 0 14px 0;">
        <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #50575e; margin-bottom: 6px;">
          ${escapeHtml(field.label)}
        </div>
        <div style="font-size: 15px; line-height: 1.7; color: #1d2327;">
          ${escapeText(field.value)}
        </div>
      </td>
    </tr>
  `;
}

function renderMessage(message: string) {
  return `
    <tr>
      <td style="padding: 4px 0 0 0;">
        <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #50575e; margin-bottom: 6px;">
          Mensagem
        </div>
        <div style="border-left: 4px solid #2271b1; background: #f6f7f7; border-radius: 16px; padding: 18px 18px 18px 16px; font-size: 15px; line-height: 1.85; color: #1d2327; white-space: pre-wrap;">${escapeText(message)}</div>
      </td>
    </tr>
  `;
}

function renderShell(options: {
  eyebrow: string;
  title: string;
  description: string;
  bodyRows: string;
}) {
  return `
    <!doctype html>
    <html lang="pt-BR">
      <body style="margin:0; padding:0; background:#f6f7f7; font-family: Arial, Helvetica, sans-serif;">
        <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
          ${escapeHtml(options.eyebrow)} - ${escapeHtml(options.title)}
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7f7; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; width: 100%;">
                <tr>
                  <td style="padding: 0 0 16px 0;">
                    <div style="display:inline-block; border-radius:999px; background:rgba(138,48,207,0.12); color:#2271b1; font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; padding:8px 14px;">
                      ${escapeHtml(options.eyebrow)}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background:#ffffff; border:1px solid #eaded3; border-radius: 24px; overflow:hidden; box-shadow: 0 14px 40px rgba(72,50,36,0.08);">
                    <div style="background: linear-gradient(135deg, #2271b1 0%, #135e96 100%); padding: 28px 28px 24px 28px;">
                      <div style="font-size: 13px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.85); margin-bottom: 8px;">
                        ${escapeHtml(brand.name)}
                      </div>
                      <div style="font-size: 26px; line-height: 1.2; font-weight: 700; color: #ffffff; margin: 0 0 10px 0;">
                        ${escapeHtml(options.title)}
                      </div>
                      <div style="font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.92); max-width: 520px;">
                        ${escapeHtml(options.description)}
                      </div>
                    </div>
                    <div style="padding: 28px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        ${options.bodyRows}
                      </table>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 6px 0 6px; text-align:center; font-size:12px; line-height:1.6; color:#50575e;">
                    ${escapeHtml(brand.name)} · ${escapeHtml(brand.description)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function renderContactEmailHtml(input: { name: string; email: string; subject: string; message: string }) {
  return renderShell({
    eyebrow: "Novo contato",
    title: "Mensagem enviada pelo site",
    description: "Você recebeu uma nova mensagem do formulário de contato.",
    bodyRows: [
      renderField({ label: "Nome", value: input.name }),
      renderField({ label: "Email", value: input.email }),
      renderField({ label: "Assunto", value: input.subject }),
      renderMessage(input.message)
    ].join("")
  });
}

export function renderNewsletterEmailHtml(input: { email: string }) {
  return renderShell({
    eyebrow: "Newsletter",
    title: "Novo cadastro confirmado",
    description: "Alguém pediu para receber novidades do blog.",
    bodyRows: [
      renderField({ label: "Email", value: input.email }),
      `
        <tr>
          <td style="padding-top: 4px;">
            <div style="border-radius: 18px; background: linear-gradient(135deg, rgba(138,48,207,0.08) 0%, rgba(165,107,232,0.12) 100%); border: 1px solid rgba(138,48,207,0.14); padding: 18px 20px; color:#1d2327; font-size:15px; line-height:1.75;">
              Este contato entrou na lista e quer receber novidades do blog.
            </div>
          </td>
        </tr>
      `
    ].join("")
  });
}
