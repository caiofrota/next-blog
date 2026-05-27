"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { FaIcon } from "@/blog-engine/components/admin/fa-icon";
import { slugify } from "@/lib/slug";

const AlignedImage = Image.extend({
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

function ToolbarGroup({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-[#eaded3] bg-[#fffaf5] p-3 shadow-[0_12px_28px_rgba(72,50,36,0.05)]">{children}</div>;
}

function getBlockValue(editor: ReturnType<typeof useEditor>) {
  if (!editor) return "paragraph";
  if (editor.isActive("heading", { level: 2 })) return "h2";
  if (editor.isActive("heading", { level: 3 })) return "h3";
  if (editor.isActive("heading", { level: 4 })) return "h4";
  if (editor.isActive("blockquote")) return "quote";
  if (editor.isActive("codeBlock")) return "code";
  return "paragraph";
}

export function RichTextEditor({
  initialTitle,
  initialSlug,
  initialExcerpt,
  initialHtml,
  defaultSlugMode = "auto",
  onTitleChange,
  onSlugChange,
  onExcerptChange
}: {
  initialTitle: string;
  initialSlug?: string;
  initialExcerpt?: string | null;
  initialHtml: string;
  defaultSlugMode?: "auto" | "manual";
  onTitleChange?: (value: string) => void;
  onSlugChange?: (value: string) => void;
  onExcerptChange?: (value: string) => void;
}) {
  const initialAutoSlug = useMemo(() => slugify(initialTitle), [initialTitle]);
  const [title, setTitle] = useState(initialTitle);
  const initialSlugMode = initialSlug && initialSlug !== initialAutoSlug ? "manual" : defaultSlugMode;
  const [slugMode, setSlugMode] = useState<"auto" | "manual">(initialSlugMode);
  const [slug, setSlug] = useState(initialSlug ?? initialAutoSlug);
  const [excerpt, setExcerpt] = useState(initialExcerpt ?? "");
  const [contentHtml, setContentHtml] = useState(initialHtml);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageAlign, setSelectedImageAlign] = useState<AlignValue>("center");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadSelectionRef = useRef<{ from: number; to: number } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] }
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      AlignedImage
    ],
    content: initialHtml,
    onUpdate: ({ editor: currentEditor }) => {
      setContentHtml(currentEditor.getHTML());
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      if (currentEditor.isActive("image")) {
        const align = currentEditor.getAttributes("image").align as AlignValue | undefined;
        setSelectedImageAlign((align ?? "center") as AlignValue);
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
    if (slugMode === "auto") {
      const nextSlug = slugify(title);
      setSlug(nextSlug);
      onSlugChange?.(nextSlug);
    }
    onTitleChange?.(title);
  }, [slugMode, title, onSlugChange, onTitleChange]);

  useEffect(() => {
    if (!editor) return;

    const syncImageAlign = () => {
      if (!editor.isActive("image")) return;
      const align = editor.getAttributes("image").align as AlignValue | undefined;
      setSelectedImageAlign((align ?? "center") as AlignValue);
    };

    syncImageAlign();
    editor.on("selectionUpdate", syncImageAlign);
    editor.on("transaction", syncImageAlign);

    return () => {
      editor.off("selectionUpdate", syncImageAlign);
      editor.off("transaction", syncImageAlign);
    };
  }, [editor]);

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
      case "h4":
        chain.toggleHeading({ level: 4 }).run();
        break;
      case "quote":
        chain.toggleBlockquote().run();
        break;
      case "code":
        chain.toggleCodeBlock().run();
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

  async function uploadImage(file: File) {
    if (!editor) return;

    setUploadingImage(true);
    setImageUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Não foi possível inserir a imagem.");
      }

      const media = (await response.json()) as { url: string; altText?: string; filename?: string };
      const selection = uploadSelectionRef.current;
      const chain = editor.chain().focus();
      if (selection) {
        chain.setTextSelection(selection);
      }
      chain.setImage({
        src: media.url,
        alt: media.altText ?? media.filename ?? file.name,
        title: media.filename ?? file.name,
        align: "center"
      } as never).run();
      editor
        .chain()
        .focus()
        .setTextSelection({
          from: editor.state.selection.from,
          to: editor.state.selection.to
        })
        .updateAttributes("image", { align: "center" })
        .run();
      setSelectedImageAlign("center");
    } catch (error) {
      setImageUploadError(error instanceof Error ? error.message : "Não foi possível inserir a imagem.");
    } finally {
      setUploadingImage(false);
    }
  }

  function openFilePicker() {
    if (editor) {
      uploadSelectionRef.current = {
        from: editor.state.selection.from,
        to: editor.state.selection.to
      };
    }
    fileInputRef.current?.click();
  }

  const blockValue = getBlockValue(editor);
  const blockSelectValue = blockValue === "h2" || blockValue === "h3" || blockValue === "h4" ? blockValue : "paragraph";
  const imageActive = editor?.isActive("image") ?? false;

  return (
    <div className="admin-panel space-y-4">
      <div className="grid gap-3">
        <label className="grid gap-2 font-semibold">
          <span className="flex items-center gap-1">
            Nome do post <span className="text-red-700">*</span>
          </span>
          <input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="admin-input min-w-0 text-2xl font-semibold"
            placeholder="Título"
            required
          />
        </label>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-ink">Slug</span>
          <button
            type="button"
            className="text-xs font-semibold text-primary transition hover:text-[#135e96]"
            onClick={() => {
              setSlugMode((current) => {
                if (current === "auto") {
                  setSlug(slug || slugify(title));
                  return "manual";
                }

                const nextSlug = slugify(title);
                setSlug(nextSlug);
                onSlugChange?.(nextSlug);
                return "auto";
              });
            }}
          >
            {slugMode === "auto" ? "Editar slug" : "Slug automático"}
          </button>
        </div>
        {slugMode === "auto" ? (
          <>
            <div className="rounded-md border border-[#e3d5ca] bg-[#f6f7f7] px-4 py-3 text-sm font-semibold text-muted shadow-inner shadow-[#f4ebe4]">
              {slug || "Digite um nome para gerar o slug"}
            </div>
            <input type="hidden" name="slug" value={slug} readOnly />
          </>
        ) : (
          <input
            name="slug"
            value={slug}
            onChange={(event) => {
              setSlug(event.target.value);
              onSlugChange?.(event.target.value);
            }}
            className="admin-input"
            placeholder="slug-do-post"
            required
          />
        )}
      </div>

      <textarea
        value={excerpt}
        onChange={(event) => {
          setExcerpt(event.target.value);
          onExcerptChange?.(event.target.value);
        }}
        className="admin-input min-h-24 w-full"
        placeholder="Resumo"
        name="excerpt"
      />

      <input type="hidden" name="contentHtml" value={contentHtml} readOnly />

      <ToolbarGroup>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={blockSelectValue}
            onChange={(event) => setBlockStyle(event.target.value)}
            className="admin-input min-w-44 py-2"
            title="Bloco"
            aria-label="Bloco"
          >
            <option value="paragraph">Parágrafo</option>
            <option value="h2">Título 2</option>
            <option value="h3">Título 3</option>
            <option value="h4">Título 4</option>
          </select>

          <div className="h-8 w-px bg-[#eaded3]" />

          <ToolbarButton title="Código" active={editor?.isActive("codeBlock") ?? false} onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>
            <FaIcon name="fa-code" />
          </ToolbarButton>
          <ToolbarButton title="Lista com marcadores" active={editor?.isActive("bulletList") ?? false} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
            <FaIcon name="fa-list-ul" />
          </ToolbarButton>
          <ToolbarButton title="Lista numerada" active={editor?.isActive("orderedList") ?? false} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
            <FaIcon name="fa-list-ol" />
          </ToolbarButton>
          <ToolbarButton title="Citação" active={editor?.isActive("blockquote") ?? false} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
            <FaIcon name="fa-quote-right" />
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
          <ToolbarButton title="Inserir link" active={editor?.isActive("link") ?? false} onClick={insertLink}>
            <FaIcon name="fa-link" />
          </ToolbarButton>
          <ToolbarButton title="Remover link" disabled={!(editor?.isActive("link") ?? false)} onClick={() => editor?.chain().focus().unsetLink().run()}>
            <FaIcon name="fa-link-slash" />
          </ToolbarButton>
          <ToolbarButton title="Desfazer" disabled={!(editor?.can().chain().focus().undo().run() ?? false)} onClick={() => editor?.chain().focus().undo().run()}>
            <FaIcon name="fa-rotate-left" />
          </ToolbarButton>
          <ToolbarButton title="Refazer" disabled={!(editor?.can().chain().focus().redo().run() ?? false)} onClick={() => editor?.chain().focus().redo().run()}>
            <FaIcon name="fa-rotate-right" />
          </ToolbarButton>
          <ToolbarButton
            title="Limpar formatação"
            onClick={() => {
              editor?.chain().focus().unsetAllMarks().clearNodes().run();
            }}
          >
            <FaIcon name="fa-broom" />
          </ToolbarButton>

          <div className="h-8 w-px bg-[#eaded3]" />

          <ToolbarButton title="Alinhar à esquerda" active={(editor?.isActive({ textAlign: "left" }) ?? false)} onClick={() => applyTextAlign("left")}>
            <FaIcon name="fa-align-left" />
          </ToolbarButton>
          <ToolbarButton title="Centralizar texto" active={(editor?.isActive({ textAlign: "center" }) ?? false)} onClick={() => applyTextAlign("center")}>
            <FaIcon name="fa-align-center" />
          </ToolbarButton>
          <ToolbarButton title="Alinhar à direita" active={(editor?.isActive({ textAlign: "right" }) ?? false)} onClick={() => applyTextAlign("right")}>
            <FaIcon name="fa-align-right" />
          </ToolbarButton>
          <ToolbarButton title="Justificar texto" active={(editor?.isActive({ textAlign: "justify" }) ?? false)} onClick={() => applyTextAlign("justify")}>
            <FaIcon name="fa-align-justify" />
          </ToolbarButton>

          <div className="h-8 w-px bg-[#eaded3]" />

          <button type="button" className="admin-button-secondary gap-2" onClick={openFilePicker} disabled={uploadingImage}>
            <FaIcon name={uploadingImage ? "fa-spinner fa-spin" : "fa-image"} />
            Inserir imagem
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void uploadImage(file);
            }}
          />

          {imageUploadError ? <p className="text-xs font-medium text-rose-700">{imageUploadError}</p> : null}

          {imageActive ? (
            <>
              <div className="h-8 w-px bg-[#eaded3]" />
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
      </ToolbarGroup>

      <EditorContent editor={editor} />
    </div>
  );
}
