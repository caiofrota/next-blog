"use client";

import { useState } from "react";

type ContactFormProps = {
  compact?: boolean;
};

export function ContactForm({ compact = false }: ContactFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className={compact ? "grid gap-3" : "grid gap-4 rounded bg-white p-6 shadow-sm"}
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setSubmitting(true);
        setStatus("idle");
        setMessage(null);

        const formData = new FormData(form);
        const name = String(formData.get("name") ?? "").trim();
        const email = String(formData.get("email") ?? "").trim();
        const subject = String(formData.get("subject") ?? "").trim();
        const message = String(formData.get("message") ?? "").trim();
        const website = String(formData.get("website") ?? "").trim();

        try {
          const response = await fetch("/api/contact", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name, email, subject, message, website })
          });
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;

          if (!response.ok) {
            throw new Error(payload?.error ?? "Não foi possível enviar a mensagem.");
          }

          form.reset();
          setStatus("success");
          setMessage("Mensagem enviada com sucesso.");
        } catch (error) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "Não foi possível enviar a mensagem.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="grid gap-3">
        <input className="hidden" name="website" tabIndex={-1} autoComplete="off" />
        <input
          className="rounded border border-[#e7ddd4] px-4 py-3 text-sm outline-none transition focus:border-primary"
          name="name"
          placeholder="Seu nome"
          required
        />
        <input
          className="rounded border border-[#e7ddd4] px-4 py-3 text-sm outline-none transition focus:border-primary"
          type="email"
          name="email"
          placeholder="Seu email"
          required
        />
        {!compact ? (
          <input
            className="rounded border border-[#e7ddd4] px-4 py-3 text-sm outline-none transition focus:border-primary"
            name="subject"
            placeholder="Assunto"
            required
          />
        ) : null}
        <textarea
          className="min-h-32 rounded border border-[#e7ddd4] px-4 py-3 text-sm outline-none transition focus:border-primary"
          name="message"
          placeholder="Mensagem"
          required
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-blush disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Enviando..." : compact ? "Enviar" : "Enviar mensagem"}
      </button>
      {message ? (
        <p className={`text-sm font-medium ${status === "success" ? "text-emerald-700" : "text-red-700"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}

export function NewsletterForm() {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setSubmitting(true);
        setMessage(null);
        setStatus("idle");

        const formData = new FormData(form);
        const email = String(formData.get("email") ?? "").trim();
        const website = String(formData.get("website") ?? "").trim();

        try {
          const response = await fetch("/api/newsletter", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email, website })
          });
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;

          if (!response.ok) {
            throw new Error(payload?.error ?? "Não foi possível cadastrar seu email.");
          }

          form.reset();
          setStatus("success");
          setMessage("Cadastro realizado com sucesso.");
        } catch (error) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "Não foi possível cadastrar seu email.");
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <input className="hidden" name="website" tabIndex={-1} autoComplete="off" />
      <input
        className="rounded border border-[#e7ddd4] px-4 py-3 text-sm outline-none transition focus:border-primary"
        type="email"
        name="email"
        placeholder="Seu email..."
        required
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-blush disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Enviando..." : "Assinar"}
      </button>
      {message ? (
        <p className={`text-sm font-medium ${status === "success" ? "text-emerald-700" : "text-red-700"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
