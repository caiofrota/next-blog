"use client";

import { useEffect, useId, useState } from "react";
import { ConfirmSubmitButton } from "@/blog-engine/components/admin/confirm-submit-button";
import { FaIcon } from "@/blog-engine/components/admin/fa-icon";

type CategoryRowData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  postsCount: number;
};

export function EditableCategoryRow({
  category,
  page,
  take,
  sort,
  dir,
  saveAction,
  deleteAction
}: {
  category: CategoryRowData;
  page: number;
  take: number;
  sort: string;
  dir: string;
  saveAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");
  const [slug, setSlug] = useState(category.slug);
  const formId = useId();
  const deleteFormId = useId();

  function cancelEdit() {
    setName(category.name);
    setDescription(category.description ?? "");
    setSlug(category.slug);
    setEditing(false);
  }

  function startEdit() {
    setName(category.name);
    setDescription(category.description ?? "");
    setSlug(category.slug);
    setEditing(true);
  }

  useEffect(() => {
    setName(category.name);
    setDescription(category.description ?? "");
    setSlug(category.slug);
    setEditing(false);
  }, [category]);

  return (
    <tr className="admin-table-row">
      <td className="px-4 py-4 align-top" data-label="Nome">
        {editing ? (
          <input form={formId} name="name" value={name} onChange={(event) => setName(event.target.value)} className="admin-input w-full" required />
        ) : (
          <div className="space-y-1">
            <p className="font-semibold text-ink">{category.name}</p>
            <p className="text-xs text-muted">/{category.slug}</p>
          </div>
        )}
      </td>
      <td className="px-4 py-4 align-top" data-label="Descrição">
        {editing ? (
          <textarea
            form={formId}
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="admin-input min-h-24 w-full"
            placeholder="Descrição"
          />
        ) : (
          <p className="max-w-xl text-sm leading-6 text-muted">{category.description || "Sem descrição."}</p>
        )}
      </td>
      <td className="px-4 py-4 align-top" data-label="Slug">
        {editing ? (
          <input form={formId} name="slug" value={slug} onChange={(event) => setSlug(event.target.value)} className="admin-input w-full" placeholder="Slug" />
        ) : (
          <p className="whitespace-nowrap text-xs text-muted">/{category.slug}</p>
        )}
      </td>
      <td className="px-4 py-4 align-top" data-label="Posts">
        <p className="whitespace-nowrap text-sm font-medium text-muted">{category.postsCount} posts</p>
      </td>
      <td className="px-4 py-4 align-top" data-label="Ações">
        <form id={formId} action={saveAction} className="hidden">
          <input type="hidden" name="id" value={category.id} />
          <input type="hidden" name="page" value={page} />
          <input type="hidden" name="take" value={take} />
          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="dir" value={dir} />
        </form>
        <form id={deleteFormId} action={deleteAction} className="hidden">
          <input type="hidden" name="id" value={category.id} />
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
            <button type="button" className="admin-icon-button" title="Editar categoria" aria-label="Editar categoria" onClick={startEdit}>
              <FaIcon name="fa-pen-to-square" />
            </button>
          )}
          <ConfirmSubmitButton
            form={deleteFormId}
            type="submit"
            className="admin-icon-button-danger"
            title="Excluir categoria"
            aria-label="Excluir categoria"
            modalTitle="Confirmar exclusão"
            confirmLabel="Excluir"
            confirmMessage={`Excluir a categoria "${category.name}"? Os posts serão desvinculados, mas a categoria será removida.`}
          >
            <FaIcon name="fa-trash-can" />
          </ConfirmSubmitButton>
        </div>
      </td>
    </tr>
  );
}
