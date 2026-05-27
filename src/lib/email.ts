import "server-only";

import nodemailer from "nodemailer";
import { env } from "@/lib/env";

type EmailAddress = {
  email: string;
  name?: string;
};

type SendEmailInput = {
  to?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  textContent: string;
  htmlContent?: string;
  replyTo?: EmailAddress;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType?: string;
    cid?: string;
  }[];
};

function assertSmtpConfigured() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error("SMTP_HOST, SMTP_USER and SMTP_PASS must be configured.");
  }
}

function formatAddress(address: EmailAddress) {
  return address.name ? `"${address.name.replace(/"/g, "'")}" <${address.email}>` : address.email;
}

function getMailFrom() {
  return formatAddress({
    email: env.SMTP_MAIL_FROM ?? env.SMTP_USER ?? env.CONTACT_EMAIL,
    name: env.SMTP_FROM_NAME
  });
}

function getDefaultRecipients() {
  return [{ email: env.SMTP_MAIL_TO ?? env.CONTACT_EMAIL }];
}

export async function sendEmail(input: SendEmailInput) {
  if (env.DEMO_MODE) {
    console.info("[demo-mode] Email simulated", {
      subject: input.subject,
      to: input.to?.map((recipient) => recipient.email) ?? getDefaultRecipients().map((recipient) => recipient.email),
      bcc: input.bcc?.map((recipient) => recipient.email)
    });
    return;
  }

  assertSmtpConfigured();

  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  await transport.sendMail({
    from: getMailFrom(),
    to: (input.to?.length ? input.to : getDefaultRecipients()).map(formatAddress),
    bcc: input.bcc?.length ? input.bcc.map(formatAddress) : undefined,
    replyTo: input.replyTo ? formatAddress(input.replyTo) : undefined,
    subject: input.subject,
    text: input.textContent,
    html: input.htmlContent,
    attachments: input.attachments?.length ? input.attachments : undefined
  });
}
