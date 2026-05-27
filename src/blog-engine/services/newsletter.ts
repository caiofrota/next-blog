import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { demoNewsletterSubscribers } from "@/blog-engine/demo/data";

export type NewsletterSubscriberRecord = {
  id: string;
  email: string;
  unsubscribeToken: string;
  subscribedAt: Date;
  unsubscribedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getBaseUrl() {
  return env.APP_URL.replace(/\/$/, "");
}

export function buildNewsletterUnsubscribeUrl(token: string) {
  return `${getBaseUrl()}/newsletter/unsubscribe/${token}`;
}

export async function listNewsletterSubscribers() {
  if (env.DEMO_MODE) return demoNewsletterSubscribers;

  return prisma.$queryRaw<NewsletterSubscriberRecord[]>`
    SELECT
      "id",
      "email",
      "unsubscribeToken",
      "subscribedAt",
      "unsubscribedAt",
      "createdAt",
      "updatedAt"
    FROM "NewsletterSubscriber"
    WHERE "unsubscribedAt" IS NULL
    ORDER BY "email" ASC
  `;
}

export async function countNewsletterSubscribers() {
  if (env.DEMO_MODE) return demoNewsletterSubscribers.length;

  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "NewsletterSubscriber"
    WHERE "unsubscribedAt" IS NULL
  `;

  return Number(rows[0]?.count ?? BigInt(0));
}

export async function subscribeNewsletter(email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (env.DEMO_MODE) {
    return {
      subscriber: {
        id: `demo-subscriber-${normalizedEmail}`,
        email: normalizedEmail,
        unsubscribeToken: randomUUID(),
        subscribedAt: new Date(),
        unsubscribedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      created: true,
      resubscribed: false
    };
  }

  const existing = await prisma.$queryRaw<NewsletterSubscriberRecord[]>`
    SELECT
      "id",
      "email",
      "unsubscribeToken",
      "subscribedAt",
      "unsubscribedAt",
      "createdAt",
      "updatedAt"
    FROM "NewsletterSubscriber"
    WHERE "email" = ${normalizedEmail}
    LIMIT 1
  `;

  if (existing[0] && existing[0].unsubscribedAt === null) {
    return { subscriber: existing[0], created: false, resubscribed: false };
  }

  const token = randomUUID();
  const now = new Date();
  const subscriber = existing[0]
    ? (
        await prisma.$queryRaw<NewsletterSubscriberRecord[]>`
          UPDATE "NewsletterSubscriber"
          SET
            "unsubscribeToken" = ${token},
            "subscribedAt" = ${now},
            "unsubscribedAt" = NULL,
            "updatedAt" = ${now}
          WHERE "email" = ${normalizedEmail}
          RETURNING
            "id",
            "email",
            "unsubscribeToken",
            "subscribedAt",
            "unsubscribedAt",
            "createdAt",
            "updatedAt"
        `
      )[0]
    : (
        await prisma.$queryRaw<NewsletterSubscriberRecord[]>`
          INSERT INTO "NewsletterSubscriber" (
            "id",
            "email",
            "unsubscribeToken",
            "subscribedAt",
            "unsubscribedAt",
            "createdAt",
            "updatedAt"
          ) VALUES (
            ${randomUUID()},
            ${normalizedEmail},
            ${token},
            ${now},
            NULL,
            ${now},
            ${now}
          )
          RETURNING
            "id",
            "email",
            "unsubscribeToken",
            "subscribedAt",
            "unsubscribedAt",
            "createdAt",
            "updatedAt"
        `
      )[0];

  return {
    subscriber,
    created: !existing[0],
    resubscribed: Boolean(existing[0] && existing[0].unsubscribedAt)
  };
}

export async function unsubscribeNewsletterByToken(token: string) {
  if (env.DEMO_MODE) {
    const subscriber = demoNewsletterSubscribers.find((item) => item.unsubscribeToken === token);
    return subscriber ? { ...subscriber, unsubscribedAt: new Date(), updatedAt: new Date() } : null;
  }

  const subscriber = (
    await prisma.$queryRaw<NewsletterSubscriberRecord[]>`
      SELECT
        "id",
        "email",
        "unsubscribeToken",
        "subscribedAt",
        "unsubscribedAt",
        "createdAt",
        "updatedAt"
      FROM "NewsletterSubscriber"
      WHERE "unsubscribeToken" = ${token}
      LIMIT 1
    `
  )[0];

  if (!subscriber || subscriber.unsubscribedAt) {
    return null;
  }

  const now = new Date();
  return (
    await prisma.$queryRaw<NewsletterSubscriberRecord[]>`
      UPDATE "NewsletterSubscriber"
      SET "unsubscribedAt" = ${now}, "updatedAt" = ${now}
      WHERE "id" = ${subscriber.id}
      RETURNING
        "id",
        "email",
        "unsubscribeToken",
        "subscribedAt",
        "unsubscribedAt",
        "createdAt",
        "updatedAt"
    `
  )[0];
}
