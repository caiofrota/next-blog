import { z } from "zod";

const optionalString = z.preprocess((value) => (value === "" ? undefined : value), z.string().min(1).optional());
const optionalUrl = z.preprocess((value) => (value === "" ? undefined : value), z.string().url().optional());
const optionalEmail = z.preprocess((value) => (value === "" ? undefined : value), z.string().email().optional());

const envSchema = z.object({
  DATABASE_URL: optionalString,
  APP_URL: z.string().url().default("http://localhost:3000"),
  CONTACT_EMAIL: z.string().email().default("contato@example.com"),
  SESSION_SECRET: z.string().min(24).default("development-session-secret-change-me"),
  SESSION_MAX_AGE_DAYS: z.coerce.number().int().positive().default(30),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  LOGIN_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(900),
  SMTP_HOST: optionalString,
  SMTP_PORT: z.preprocess((value) => (value === "" ? undefined : value), z.coerce.number().int().positive().default(587)),
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  SMTP_MAIL_TO: optionalEmail,
  SMTP_MAIL_FROM: optionalEmail,
  SMTP_FROM_NAME: z.preprocess((value) => (value === "" ? undefined : value), z.string().min(1).default("Blog Base")),
  R2_ACCOUNT_ID: optionalString,
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  R2_BUCKET: optionalString,
  R2_PUBLIC_BASE_URL: optionalUrl,
  WP_BASE_URL: optionalUrl
});

export const env = envSchema.parse(process.env);
