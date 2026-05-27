import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminSessionCookieName, checkLoginRateLimit, createSession, getClientIp } from "@/blog-engine/services/auth";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/blog-engine/validation/auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? "")
  });

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Informe um email válido e uma senha com pelo menos 8 caracteres." }, { status: 400 });
  }

  const key = `${getClientIp(request)}:${parsed.data.email.toLowerCase()}`;
  if (!checkLoginRateLimit(key)) {
    await new Promise((resolve) => setTimeout(resolve, 750));
    return NextResponse.json({ ok: false, error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !(await verifyPassword(user.passwordHash, parsed.data.password))) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return NextResponse.json({ ok: false, error: "Email ou senha inválidos." }, { status: 401 });
  }

  const { token, expiresAt } = await createSession(user.id);
  const response = NextResponse.json({ ok: true, redirectTo: "/admin/posts" });
  response.cookies.set(adminSessionCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });
  return response;
}
