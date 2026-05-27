"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginFormProps = {
  error?: boolean;
  demoCredentials?: {
    email: string;
    password: string;
  } | null;
};

export function LoginForm({ error = false, demoCredentials = null }: LoginFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [hasError, setHasError] = useState(error);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="admin-panel grid w-full max-w-sm gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setHasError(false);
        setMessage(null);
        setSubmitting(true);

        const formData = new FormData(event.currentTarget);
        const response = await fetch("/api/auth/login", {
          method: "POST",
          body: formData,
          credentials: "same-origin"
        });
        const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; redirectTo?: string } | null;

        if (response.ok && payload?.ok && payload.redirectTo) {
          router.replace(payload.redirectTo);
          return;
        }

        setHasError(true);
        setMessage(payload?.error ?? "Login inválido ou bloqueado temporariamente.");
        setSubmitting(false);
      }}
    >
      <div>
        <p className="admin-eyebrow">Acesso restrito</p>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-muted">Entre para gerenciar o conteúdo do blog.</p>
      </div>
      {demoCredentials ? (
        <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-sm leading-6 text-sky-900">
          <p className="font-semibold">Modo demo: alteracoes sao simuladas e nada e persistido.</p>
          <p>Email: {demoCredentials.email}</p>
          <p>Senha: {demoCredentials.password}</p>
        </div>
      ) : null}
      {hasError ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message ?? "Login inválido ou bloqueado temporariamente."}</p> : null}
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-ink">
          Email <span className="text-red-700">*</span>
        </span>
        <input name="email" type="email" className="admin-input" placeholder="seu@email.com" defaultValue={demoCredentials?.email ?? ""} required />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-ink">
          Senha <span className="text-red-700">*</span>
        </span>
        <input name="password" type="password" className="admin-input" placeholder="Sua senha" defaultValue={demoCredentials?.password ?? ""} required />
      </label>
      <button className="admin-button-primary" disabled={submitting}>
        {submitting ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
