import { brand } from "@/site/config/brand";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlToText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/div>\s*<div>/gi, "\n\n")
    .replace(/<\/h[1-6]>\s*</gi, "\n\n<")
    .replace(/<li>/gi, "\n- ")
    .replace(/<\/li>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function addInlineStyle(attrs: string, style: string) {
  const styleMatch = attrs.match(/\sstyle=(["'])(.*?)\1/i);
  if (!styleMatch) return `${attrs} style="${style}"`;

  const quote = styleMatch[1];
  const currentStyle = styleMatch[2].trim();
  const nextStyle = currentStyle.endsWith(";") ? `${currentStyle} ${style}` : `${currentStyle}; ${style}`;
  return attrs.replace(styleMatch[0], ` style=${quote}${nextStyle}${quote}`);
}

function inlineNewsletterEmailStyles(html: string) {
  return html
    .replace(/<blockquote\b([^>]*)>/gi, (_match, attrs: string) => {
      const style = "margin:18px 0; padding:0 0 0 14px; border-left:3px solid #2271b1; color:#50575e;";
      return `<blockquote${addInlineStyle(attrs, style)}>`;
    })
    .replace(/<img\b([^>]*)>/gi, (_match, attrs: string) => {
      const alignMatch = attrs.match(/\sdata-align=(["'])(.*?)\1/i);
      const align = alignMatch?.[2] ?? "center";
      const base = "height:auto; max-width:100%; border-radius:16px;";
      const layout =
        align === "left"
          ? "float:left; margin:0 18px 16px 0; max-width:280px; width:50%;"
          : align === "right"
            ? "float:right; margin:0 0 16px 18px; max-width:280px; width:50%;"
            : "display:block; margin:18px auto;";
      return `<img${addInlineStyle(attrs, `${base} ${layout}`)}>`;
    });
}

export function renderNewsletterCampaignEmailHtml(input: { subject: string; bodyHtml: string; unsubscribeUrl: string }) {
  const bodyHtml = inlineNewsletterEmailStyles(input.bodyHtml);

  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0; padding:0; background:#f6f7f7; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f6f7f7; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; width: 100%;">
            <tr>
              <td style="padding: 0 0 16px 0;">
                <div style="display:inline-block; border-radius:999px; background:rgba(138,48,207,0.12); color:#2271b1; font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; padding:8px 14px;">
                  ${escapeHtml(brand.name)}
                </div>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff; border:1px solid #eaded3; border-radius:24px; overflow:hidden; box-shadow:0 14px 40px rgba(72,50,36,0.08);">
                <div style="background: linear-gradient(135deg, #2271b1 0%, #135e96 100%); padding: 28px;">
                  <div style="font-size:13px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color: rgba(255,255,255,0.85); margin-bottom:8px;">
                    Newsletter
                  </div>
                  <div style="font-size:26px; line-height:1.2; font-weight:700; color:#ffffff; margin:0;">
                    ${escapeHtml(input.subject)}
                  </div>
                </div>
                <div style="padding: 28px;">
                  <style>
                    .newsletter-body { font-size: 16px; line-height: 1.8; color: #1d2327; }
                    .newsletter-body p { margin: 0 0 16px; }
                    .newsletter-body h1,
                    .newsletter-body h2,
                    .newsletter-body h3,
                    .newsletter-body h4,
                    .newsletter-body h5,
                    .newsletter-body h6 { margin: 24px 0 12px; line-height: 1.25; color: #1d2327; }
                    .newsletter-body ul,
                    .newsletter-body ol { margin: 0 0 16px; padding-left: 22px; }
                    .newsletter-body li { margin: 0 0 8px; }
                    .newsletter-body blockquote {
                      margin: 18px 0;
                      padding: 0 0 0 14px;
                      border-left: 3px solid #2271b1;
                      color: #50575e;
                    }
                    .newsletter-body img {
                      display: block;
                      max-width: 100%;
                      height: auto;
                      margin: 18px 0;
                      border-radius: 16px;
                    }
                    .newsletter-body a { color: #2271b1; text-decoration: underline; }
                  </style>
                  <div class="newsletter-body">${bodyHtml}</div>
                </div>
                <div style="border-top:1px solid #efe4da; padding: 16px 28px 24px 28px; color:#50575e; font-size:12px; line-height:1.6;">
                  <p style="margin: 0;">
                    Se você não deseja mais receber e-mails, <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#2271b1; text-decoration:underline;">clique aqui</a> para se descadastrar.
                  </p>
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
</html>`;
}

export function renderNewsletterCampaignEmailPreviewFragment(input: { subject: string; bodyHtml: string; unsubscribeUrl: string }) {
  const bodyHtml = inlineNewsletterEmailStyles(input.bodyHtml);

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; background:#f6f7f7; padding: 32px 16px;">
      <div style="max-width: 640px; margin: 0 auto;">
        <div style="padding: 0 0 16px 0;">
          <div style="display:inline-block; border-radius:999px; background:rgba(138,48,207,0.12); color:#2271b1; font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; padding:8px 14px;">
            ${escapeHtml(brand.name)}
          </div>
        </div>
        <div style="background:#ffffff; border:1px solid #eaded3; border-radius:24px; overflow:hidden; box-shadow:0 14px 40px rgba(72,50,36,0.08);">
          <div style="background: linear-gradient(135deg, #2271b1 0%, #135e96 100%); padding: 28px;">
            <div style="font-size:13px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color: rgba(255,255,255,0.85); margin-bottom:8px;">
              Newsletter
            </div>
            <div style="font-size:26px; line-height:1.2; font-weight:700; color:#ffffff; margin:0;">
              ${escapeHtml(input.subject)}
            </div>
          </div>
          <div style="padding: 28px;">
            <style>
              .newsletter-body { font-size: 16px; line-height: 1.8; color: #1d2327; }
              .newsletter-body p { margin: 0 0 16px; }
              .newsletter-body h1,
              .newsletter-body h2,
              .newsletter-body h3,
              .newsletter-body h4,
              .newsletter-body h5,
              .newsletter-body h6 { margin: 24px 0 12px; line-height: 1.25; color: #1d2327; }
              .newsletter-body ul,
              .newsletter-body ol { margin: 0 0 16px; padding-left: 22px; }
              .newsletter-body li { margin: 0 0 8px; }
              .newsletter-body blockquote {
                margin: 18px 0;
                padding: 0 0 0 14px;
                border-left: 3px solid #2271b1;
                color: #50575e;
              }
              .newsletter-body img {
                display: block;
                max-width: 100%;
                height: auto;
                margin: 18px 0;
                border-radius: 16px;
              }
              .newsletter-body a { color: #2271b1; text-decoration: underline; }
            </style>
            <div class="newsletter-body">${bodyHtml}</div>
          </div>
          <div style="border-top:1px solid #efe4da; padding: 16px 28px 24px 28px; color:#50575e; font-size:12px; line-height:1.6;">
            <p style="margin: 0;">
              Se você não deseja mais receber e-mails, <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#2271b1; text-decoration:underline;">clique aqui</a> para se descadastrar.
            </p>
          </div>
        </div>
        <div style="padding: 14px 6px 0 6px; text-align:center; font-size:12px; line-height:1.6; color:#50575e;">
          ${escapeHtml(brand.name)} · ${escapeHtml(brand.description)}
        </div>
      </div>
    </div>
  `;
}

export function renderNewsletterCampaignTextContent(input: { subject: string; bodyHtml: string; unsubscribeUrl: string }) {
  const bodyText = htmlToText(input.bodyHtml);
  return [
    input.subject,
    "",
    bodyText,
    "",
    `Se você não deseja mais receber e-mails, acesse ${input.unsubscribeUrl} para se descadastrar.`
  ].join("\n");
}
