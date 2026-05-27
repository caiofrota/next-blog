"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { FaIcon } from "@/blog-engine/components/admin/fa-icon";
import { renderNewsletterCampaignEmailPreviewFragment } from "@/lib/newsletter-email";

const NewsletterImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "center",
        parseHTML: (element) => (element as HTMLImageElement).getAttribute("data-align") ?? "center",
        renderHTML: (attributes) => ({ "data-align": attributes.align ?? "center" })
      }
    };
  }
}).configure({
  allowBase64: false,
  HTMLAttributes: { class: "editor-image" }
});

type AlignValue = "left" | "center" | "right";
type TextAlignValue = AlignValue | "justify";

type Subscriber = {
  id: string;
  email: string;
  unsubscribeToken: string;
};

type AttachmentItem = {
  id: string;
  file: File;
  previewUrl: string;
};

type SelectionRange = {
  from: number;
  to: number;
};

function ToolbarButton({
  title,
  active = false,
  disabled = false,
  onClick,
  children
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`admin-icon-button h-9 w-9 ${active ? "border-primary/40 bg-primary/10 text-primary" : ""} ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}

function getBlockValue(editor: ReturnType<typeof useEditor>) {
  if (!editor) return "paragraph";
  if (editor.isActive("heading", { level: 2 })) return "h2";
  if (editor.isActive("heading", { level: 3 })) return "h3";
  if (editor.isActive("blockquote")) return "quote";
  return "paragraph";
}

function htmlToPreviewBody(html: string, attachments: AttachmentItem[]) {
  let resolved = html;
  for (const attachment of attachments) {
    const cidPattern = new RegExp(`cid:${attachment.id}`, "g");
    resolved = resolved.replace(cidPattern, attachment.previewUrl);
  }
  return resolved;
}

function htmlToEditorBody(html: string, attachments: AttachmentItem[]) {
  let resolved = html;
  for (const attachment of attachments) {
    resolved = resolved.split(attachment.previewUrl).join(`cid:${attachment.id}`);
  }
  return resolved;
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function getFileTypeLabel(file: File) {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop();
  return extension ? `.${extension}` : "arquivo";
}

function createAttachmentId() {
  return globalThis.crypto?.randomUUID?.() ?? `attachment-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function NewsletterComposer({ subscribers }: { subscribers: Subscriber[] }) {
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>(subscribers.map((subscriber) => subscriber.email));
  const [recipientsOpen, setRecipientsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "info" | null>(null);
  const [imageActive, setImageActive] = useState(false);
  const [selectedImageAlign, setSelectedImageAlign] = useState<AlignValue>("center");
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentsRef = useRef<AttachmentItem[]>([]);
  const attachmentUrlsRef = useRef<string[]>([]);
  const uploadSelectionRef = useRef<SelectionRange | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] }
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      NewsletterImage
    ],
    content: "",
    onUpdate: ({ editor: currentEditor }) => {
      setBodyHtml(htmlToEditorBody(currentEditor.getHTML(), attachmentsRef.current));
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      const active = currentEditor.isActive("image");
      setImageActive(active);
      if (active) {
        setSelectedImageAlign((currentEditor.getAttributes("image").align as AlignValue | undefined) ?? "center");
      }
    },
    editorProps: {
      attributes: {
        class:
          "min-h-80 rounded-md border border-[#e3d5ca] bg-white p-5 leading-7 shadow-inner shadow-[#f4ebe4] outline-none transition focus:border-primary/50"
      }
    }
  });

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    return () => {
      for (const url of attachmentUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  useEffect(() => {
    if (!editor) return;

    const syncImageState = () => {
      const active = editor.isActive("image");
      setImageActive(active);
      if (active) {
        setSelectedImageAlign((editor.getAttributes("image").align as AlignValue | undefined) ?? "center");
      }
    };

    syncImageState();
    editor.on("selectionUpdate", syncImageState);
    editor.on("transaction", syncImageState);

    return () => {
      editor.off("selectionUpdate", syncImageState);
      editor.off("transaction", syncImageState);
    };
  }, [editor]);

  const allSelected = selectedEmails.length > 0 && selectedEmails.length === subscribers.length;

  const previewHtml = useMemo(
    () =>
      renderNewsletterCampaignEmailPreviewFragment({
        subject: subject || "Prévia da newsletter",
        bodyHtml: htmlToPreviewBody(bodyHtml, attachments),
        unsubscribeUrl: "#"
      }),
    [attachments, bodyHtml, subject]
  );

  function setBlockStyle(value: string) {
    if (!editor) return;

    const chain = editor.chain().focus();
    switch (value) {
      case "h2":
        chain.toggleHeading({ level: 2 }).run();
        break;
      case "h3":
        chain.toggleHeading({ level: 3 }).run();
        break;
      case "quote":
        chain.toggleBlockquote().run();
        break;
      default:
        chain.setParagraph().run();
        break;
    }
  }

  function applyTextAlign(align: TextAlignValue) {
    editor?.chain().focus().setTextAlign(align).run();
  }

  function applyImageAlign(align: AlignValue) {
    editor?.chain().focus().updateAttributes("image", { align }).run();
    setSelectedImageAlign(align);
  }

  function removeSelectedImage() {
    if (!editor?.isActive("image")) return;

    editor.chain().focus().deleteSelection().run();
    setImageActive(false);
  }

  function removeAttachment(attachmentId: string) {
    const attachment = attachmentsRef.current.find((item) => item.id === attachmentId);
    if (!attachment) return;

    const { previewUrl } = attachment;
    const next = attachmentsRef.current.filter((item) => item.id !== attachmentId);
    attachmentsRef.current = next;
    setAttachments(next);
    attachmentUrlsRef.current = attachmentUrlsRef.current.filter((url) => url !== previewUrl);

    if (editor) {
      const { state } = editor;
      const positions: number[] = [];

      state.doc.descendants((node, pos) => {
        if (node.type.name === "image" && node.attrs.src === previewUrl) {
          positions.push(pos);
        }
        return true;
      });

      if (positions.length > 0) {
        const chain = editor.chain().focus();
        for (const position of [...positions].reverse()) {
          chain.deleteRange({ from: position, to: position + 1 });
        }
        chain.run();
      }
    }

    URL.revokeObjectURL(previewUrl);
  }

  function insertLink() {
    if (!editor) return;

    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    const currentHref = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Digite a URL do link", currentHref ?? "https://");
    if (!href) return;

    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }

  function addAttachment(file: File) {
    const id = createAttachmentId();
    const previewUrl = URL.createObjectURL(file);
    const attachment: AttachmentItem = { id, file, previewUrl };

    attachmentUrlsRef.current.push(previewUrl);
    attachmentsRef.current = [...attachmentsRef.current, attachment];
    setAttachments(attachmentsRef.current);

    return attachment;
  }

  function insertAttachmentImage(attachment: AttachmentItem) {
    if (!isImageFile(attachment.file)) return;

    if (editor) {
      const chain = editor.chain().focus();
      const selection = uploadSelectionRef.current;
      if (selection) {
        chain.setTextSelection(selection);
      }
      chain.setImage({ src: attachment.previewUrl, alt: attachment.file.name, title: attachment.file.name, align: "center" } as never).run();
      editor.chain().focus().updateAttributes("image", { align: "center" }).run();
      setImageActive(true);
      setSelectedImageAlign("center");
    }
  }

  function storeEditorSelection() {
    if (editor) {
      uploadSelectionRef.current = {
        from: editor.state.selection.from,
        to: editor.state.selection.to
      };
    }
  }

  function openPicker(input: HTMLInputElement | null) {
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.click();
  }

  function openImagePicker() {
    storeEditorSelection();
    openPicker(imageInputRef.current);
  }

  function openAttachmentPicker() {
    openPicker(attachmentInputRef.current);
  }

  function handleEditorImages(files: File[]) {
    if (files.length === 0) return;
    for (const file of files) {
      if (!isImageFile(file)) continue;
      insertAttachmentImage(addAttachment(file));
    }
  }

  function handleAttachmentFiles(files: File[]) {
    if (files.length === 0) return;
    for (const file of files) {
      addAttachment(file);
    }
  }

  function toggleEmail(email: string) {
    setSelectedEmails((current) => (current.includes(email) ? current.filter((item) => item !== email) : [...current, email]));
  }

  function toggleAll() {
    setSelectedEmails((current) => (current.length === subscribers.length ? [] : subscribers.map((subscriber) => subscriber.email)));
  }

  async function copyEmails() {
    const payload = selectedEmails.join(", ");
    if (!payload) return;
    await navigator.clipboard.writeText(payload);
    setMessageType("success");
    setMessage("Emails copiados para a área de transferência.");
  }

  async function sendNewsletter() {
    if (!subject.trim() || !bodyHtml.trim()) {
      setMessageType("error");
      setMessage("Informe o assunto e o conteúdo da newsletter.");
      return;
    }

    if (selectedEmails.length === 0) {
      setMessageType("error");
      setMessage("Selecione ao menos um email.");
      return;
    }

    setSending(true);
    setMessage(null);
    setMessageType(null);

    try {
      const payloadBodyHtml = htmlToEditorBody(bodyHtml, attachments);
      const formData = new FormData();
      formData.set("subject", subject.trim());
      formData.set("bodyHtml", payloadBodyHtml);
      formData.set("recipients", JSON.stringify(selectedEmails));
      for (const attachment of attachments) {
        formData.set(`attachment_${attachment.id}`, attachment.file);
      }

      const response = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; sent?: number } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Não foi possível enviar a newsletter.");
      }

      setMessageType("success");
      setMessage(`Newsletter enviada para ${payload?.sent ?? selectedEmails.length} emails.`);
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar a newsletter.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)]">
      <aside className="grid gap-4 self-start">
        <div className="admin-panel grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted/60">Destinatários</p>
              <p className="text-sm text-muted">
                {selectedEmails.length} selecionados de {subscribers.length} inscritos
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="admin-button-secondary" onClick={copyEmails} disabled={selectedEmails.length === 0}>
                Copiar emails
              </button>
              <button type="button" className="admin-button-secondary" onClick={toggleAll}>
                {allSelected ? "Desmarcar todos" : "Marcar todos"}
              </button>
            </div>
          </div>

          <div className="xl:hidden">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-2xl border border-[#eaded3] bg-white px-4 py-3 text-left text-sm font-semibold text-ink"
              onClick={() => setRecipientsOpen((current) => !current)}
            >
              <span className="flex items-center gap-3">
                <FaIcon name="fa-envelope" />
                Destinatários
              </span>
              <span className={`transition-transform duration-200 ${recipientsOpen ? "rotate-180" : ""}`}>
                <FaIcon name="fa-chevron-down" />
              </span>
            </button>
          </div>

          <div className={`${recipientsOpen ? "block" : "hidden"} xl:block`}>
            <div className="max-h-[28rem] overflow-y-auto rounded-2xl border border-[#eaded3] bg-white">
              <label className="flex items-center justify-between gap-3 border-b border-[#f0e7de] px-4 py-3 text-sm font-semibold text-ink">
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-[#cdbcad] text-primary focus:ring-primary"
                  />
                  Selecionar todos
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted/55">{subscribers.length} emails</span>
              </label>

              {subscribers.length > 0 ? (
                <div className="divide-y divide-[#f0e7de]">
                  {subscribers.map((subscriber) => (
                    <label key={subscriber.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm transition hover:bg-[#f6f7f7]">
                      <input
                        type="checkbox"
                        checked={selectedEmails.includes(subscriber.email)}
                        onChange={() => toggleEmail(subscriber.email)}
                        className="h-4 w-4 rounded border-[#cdbcad] text-primary focus:ring-primary"
                      />
                      <span className="min-w-0 break-all font-medium text-ink">{subscriber.email}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-sm text-muted">Nenhum inscrito ativo na newsletter no momento.</div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <section className="grid gap-4">
        <div className="admin-panel grid gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted/60">Mensagem</p>
            <p className="text-sm text-muted">Escreva o conteúdo da newsletter abaixo.</p>
          </div>

          <label className="grid gap-2 font-semibold">
            Assunto
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="admin-input"
              placeholder="Digite o assunto da newsletter"
            />
          </label>

          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <ToolbarButton title="Parágrafo" active={getBlockValue(editor) === "paragraph"} onClick={() => setBlockStyle("paragraph")}>
                <span className="text-[11px] font-bold">P</span>
              </ToolbarButton>
              <ToolbarButton title="Título 2" active={editor?.isActive("heading", { level: 2 }) ?? false} onClick={() => setBlockStyle("h2")}>
                <span className="font-bold">H2</span>
              </ToolbarButton>
              <ToolbarButton title="Título 3" active={editor?.isActive("heading", { level: 3 }) ?? false} onClick={() => setBlockStyle("h3")}>
                <span className="font-bold">H3</span>
              </ToolbarButton>
              <ToolbarButton title="Citação" active={editor?.isActive("blockquote") ?? false} onClick={() => setBlockStyle("quote")}>
                <FaIcon name="fa-quote-right" />
              </ToolbarButton>
              <ToolbarButton title="Lista com marcadores" active={editor?.isActive("bulletList") ?? false} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
                <FaIcon name="fa-list-ul" />
              </ToolbarButton>
              <ToolbarButton title="Lista numerada" active={editor?.isActive("orderedList") ?? false} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
                <FaIcon name="fa-list-ol" />
              </ToolbarButton>

              <div className="h-8 w-px bg-[#eaded3]" />

              <ToolbarButton title="Negrito" active={editor?.isActive("bold") ?? false} onClick={() => editor?.chain().focus().toggleBold().run()}>
                <span className="font-bold">B</span>
              </ToolbarButton>
              <ToolbarButton title="Itálico" active={editor?.isActive("italic") ?? false} onClick={() => editor?.chain().focus().toggleItalic().run()}>
                <span className="italic">I</span>
              </ToolbarButton>
              <ToolbarButton title="Sublinhado" active={editor?.isActive("underline") ?? false} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
                <span className="underline">U</span>
              </ToolbarButton>
              <ToolbarButton title="Tachado" active={editor?.isActive("strike") ?? false} onClick={() => editor?.chain().focus().toggleStrike().run()}>
                <span className="line-through">S</span>
              </ToolbarButton>

              <div className="h-8 w-px bg-[#eaded3]" />

              <ToolbarButton title="Inserir link" active={editor?.isActive("link") ?? false} onClick={insertLink}>
                <FaIcon name="fa-link" />
              </ToolbarButton>
              <ToolbarButton title="Remover link" disabled={!(editor?.isActive("link") ?? false)} onClick={() => editor?.chain().focus().unsetLink().run()}>
                <FaIcon name="fa-link-slash" />
              </ToolbarButton>

              <div className="h-8 w-px bg-[#eaded3]" />

              <ToolbarButton title="Alinhar à esquerda" active={editor?.isActive({ textAlign: "left" }) ?? false} onClick={() => applyTextAlign("left")}>
                <FaIcon name="fa-align-left" />
              </ToolbarButton>
              <ToolbarButton title="Centralizar texto" active={editor?.isActive({ textAlign: "center" }) ?? false} onClick={() => applyTextAlign("center")}>
                <FaIcon name="fa-align-center" />
              </ToolbarButton>
              <ToolbarButton title="Alinhar à direita" active={editor?.isActive({ textAlign: "right" }) ?? false} onClick={() => applyTextAlign("right")}>
                <FaIcon name="fa-align-right" />
              </ToolbarButton>
              <ToolbarButton title="Justificar texto" active={editor?.isActive({ textAlign: "justify" }) ?? false} onClick={() => applyTextAlign("justify")}>
                <FaIcon name="fa-align-justify" />
              </ToolbarButton>

              <div className="h-8 w-px bg-[#eaded3]" />

              <ToolbarButton title="Inserir imagem" onClick={openImagePicker}>
                <FaIcon name="fa-image" />
              </ToolbarButton>

              {imageActive ? (
                <>
                  <ToolbarButton title="Remover imagem" onClick={removeSelectedImage}>
                    <FaIcon name="fa-trash" />
                  </ToolbarButton>
                  <ToolbarButton title="Imagem à esquerda" active={selectedImageAlign === "left"} onClick={() => applyImageAlign("left")}>
                    <FaIcon name="fa-align-left" />
                  </ToolbarButton>
                  <ToolbarButton title="Imagem centralizada" active={selectedImageAlign === "center"} onClick={() => applyImageAlign("center")}>
                    <FaIcon name="fa-align-center" />
                  </ToolbarButton>
                  <ToolbarButton title="Imagem à direita" active={selectedImageAlign === "right"} onClick={() => applyImageAlign("right")}>
                    <FaIcon name="fa-align-right" />
                  </ToolbarButton>
                </>
              ) : null}
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only absolute left-[-9999px] top-auto h-px w-px opacity-0"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                handleEditorImages(files);
              }}
            />

            <input
              ref={attachmentInputRef}
              type="file"
              multiple
              className="sr-only absolute left-[-9999px] top-auto h-px w-px opacity-0"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                handleAttachmentFiles(files);
              }}
            />

            <div className="rounded-2xl border border-[#eaded3] bg-white p-1 shadow-inner shadow-[#f4ebe4]">
              <EditorContent editor={editor} />
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-[#eaded3] bg-[#fffaf5] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted/60">Arquivos anexados</p>
                <p className="text-sm text-muted">{attachments.length} arquivo(s)</p>
              </div>
              <button type="button" className="admin-button-secondary" onClick={openAttachmentPicker}>
                Adicionar arquivos
              </button>
            </div>

            {attachments.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="overflow-hidden rounded-2xl border border-[#eaded3] bg-white">
                    {isImageFile(attachment.file) ? (
                      <div className="relative aspect-[4/3] bg-[#f3e7db]">
                        <img src={attachment.previewUrl} alt={attachment.file.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="grid aspect-[4/3] place-items-center bg-[#f3e7db] text-4xl text-muted/55">
                        <FaIcon name="fa-file" />
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{attachment.file.name}</p>
                        <p className="text-xs text-muted">{getFileTypeLabel(attachment.file)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {isImageFile(attachment.file) ? (
                          <button
                            type="button"
                            className="admin-icon-button h-8 w-8"
                            title="Inserir na mensagem"
                            aria-label="Inserir na mensagem"
                            onClick={() => {
                              storeEditorSelection();
                              insertAttachmentImage(attachment);
                            }}
                          >
                            <FaIcon name="fa-image" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="admin-icon-button-danger h-8 w-8"
                          title="Remover arquivo"
                          aria-label="Remover arquivo"
                          onClick={() => removeAttachment(attachment.id)}
                        >
                          <FaIcon name="fa-trash" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Nenhum arquivo anexado.</p>
            )}
          </div>
        </div>

        <div className="admin-panel grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted/60">Prévia</p>
              <p className="text-sm text-muted">Visualização ao vivo do email antes do envio.</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#eaded3] bg-white">
            <div className="max-h-[82vh] overflow-auto" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>

          <button type="button" className="admin-button-primary" onClick={sendNewsletter} disabled={sending || selectedEmails.length === 0}>
            {sending ? "Enviando..." : "Enviar newsletter"}
          </button>
        </div>

        {message ? (
          <p className={`text-sm font-medium ${messageType === "error" ? "text-red-700" : messageType === "success" ? "text-emerald-700" : "text-muted"}`}>
            {message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
