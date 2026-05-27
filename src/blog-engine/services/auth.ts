import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { createSessionToken, hashToken } from "@/lib/security";
import { verifyPassword } from "@/lib/password";
import { demoUser } from "@/blog-engine/demo/data";

export const adminSessionCookieName = "admin_session";
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function buildSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt
  };
}

export function getClientIp(request?: NextRequest) {
  const realIp = request?.headers.get("cf-connecting-ip") ?? headers().get("cf-connecting-ip");
  if (realIp?.trim()) return realIp.trim();

  const forwarded = request?.headers.get("x-forwarded-for") ?? headers().get("x-forwarded-for");
  const forwardedIp = forwarded?.split(",").map((item) => item.trim()).filter(Boolean).at(-1);
  return forwardedIp || request?.headers.get("x-real-ip") || request?.ip || "unknown";
}

export function checkLoginRateLimit(identifier: string) {
  const now = Date.now();
  const windowMs = env.LOGIN_RATE_LIMIT_WINDOW_SECONDS * 1000;
  const current = loginAttempts.get(identifier);

  if (!current || current.resetAt < now) {
    loginAttempts.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  current.count += 1;
  return current.count <= env.LOGIN_RATE_LIMIT_MAX;
}

export async function createSession(userId: string) {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + env.SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

  if (env.DEMO_MODE) {
    cookies().set(adminSessionCookieName, token, buildSessionCookieOptions(expiresAt));
    return { token, expiresAt };
  }

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt
    }
  });

  cookies().set(adminSessionCookieName, token, buildSessionCookieOptions(expiresAt));

  return { token, expiresAt };
}

export async function getCurrentUser() {
  const token = cookies().get(adminSessionCookieName)?.value;
  if (!token) return null;
  if (env.DEMO_MODE) return demoUser;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;
  return session.user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function logout() {
  const token = cookies().get(adminSessionCookieName)?.value;
  if (token && !env.DEMO_MODE) {
    await prisma.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
  cookies().delete(adminSessionCookieName);
}

export async function authMiddleware(request: NextRequest) {
  const token = request.cookies.get(adminSessionCookieName)?.value;
  const loginUrl = new URL("/admin/login", request.url);

  if (!token) return NextResponse.redirect(loginUrl);
  if (env.DEMO_MODE) return NextResponse.next();

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { expiresAt: true, revokedAt: true }
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
