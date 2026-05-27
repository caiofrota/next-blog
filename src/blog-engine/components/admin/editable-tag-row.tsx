"use client";

import { useEffect, useId, useState } from "react";
import { ConfirmSubmitButton } from "@/blog-engine/components/admin/confirm-submit-button";
import { FaIcon } from "@/blog-engine/components/admin/fa-icon";

type TagRowData = {
  id: string;
  name: string;
  slug: string;
  postsCount: number;
};

export function EditableTagRow({
  tag,
  page,
  take,
  sort,
  dir,
  saveAction,
  deleteAction
}: {
  tag: TagRowData;
  page: number;
  take: number;
  sort: string;
  dir: string;
  saveAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tag.name);
  const [slug, setSlug] = useState(tag.slug);
  const formId = useId();
  const deleteFormId = useId();

  function cancelEdit() {
    setName(tag.name);
    setSlug(tag.slug);
    setEditing(false);
  }

  function startEdit() {
    setName(tag.name);
    setSlug(tag.slug);
    setEditing(true);
  }

  useEffect(() => {
    setName(tag.name);
    setSlug(tag.slug);
    setEditing(false);
  }, [tag]);

  return (
    <tr className="admin-table-row">
      <td className="px-4 py-4 align-top" data-label="Nome">
        {editing ? (
          <input form={formId} name="name" value={name} onChange={(event) => setName(event.target.value)} className="admin-input w-full" required />
        ) : (
          <p className="font-semibold text-ink">{tag.name}</p>
        )}
      </td>
      <td className="px-4 py-4 align-top" data-label="Slug">
        {editing ? (
          <input form={formId} name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} className="admin-input w-full" placeholder="Slug" />
        ) : (
          <p className="whitespace-nowrap text-xs text-muted">/{tag.slug}</p>
        )}
      </td>
      <td className="px-4 py-4 align-top" data-label="Posts">
        <p className="whitespace-nowrap text-sm font-medium text-muted">{tag.postsCount} posts</p>
      </td>
      <td className="px-4 py-4 align-top" data-label="Ações">
        <form id={formId} action={saveAction} className="hidden">
          <input type="hidden" name="id" value={tag.id} />
          <input type="hidden" name="page" value={page} />
          <input type="hidden" name="take" value={take} />
          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="dir" value={dir} />
        </form>
        <form id={deleteFormId} action={deleteAction} className="hidden">
          <input type="hidden" name="id" value={tag.id} />
          <input type="hidden" name="page" value={page} />
          <input type="hidden" name="take" value={take} />
          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="dir" value={dir} />
        </form>
        <div className="admin-action-group justify-end">
          {editing ? (
            <>
              <button type="button" className="admin-icon-button" title="Cancelar edição" aria-label="Cancelar edição" onClick={cancelEdit}>
                <FaIcon name="fa-xmark" />
              </button>
              <button form={formId} type="submit" className="admin-icon-button" title="Salvar alterações" aria-label="Salvar alterações">
                <FaIcon name="fa-floppy-disk" />
              </button>
            </>
          ) : (
            <button type="button" className="admin-icon-button" title="Editar tag" aria-label="Editar tag" onClick={startEdit}>
              <FaIcon name="fa-pen-to-square" />
            </button>
          )}
          <ConfirmSubmitButton
            form={deleteFormId}
            type="submit"
            className="admin-icon-button-danger"
            title="Excluir tag"
            aria-label="Excluir tag"
            modalTitle="Confirmar exclusão"
            confirmLabel="Excluir"
            confirmMessage={`Excluir a tag "${tag.name}"? Os posts serão desvinculados, mas a tag será removida.`}
          >
            <FaIcon name="fa-trash-can" />
          </ConfirmSubmitButton>
        </div>
      </td>
    </tr>
  );
}
