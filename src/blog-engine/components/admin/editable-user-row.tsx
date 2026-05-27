"use client";

import { useEffect, useId, useState } from "react";
import { ConfirmSubmitButton } from "@/blog-engine/components/admin/confirm-submit-button";
import { FaIcon } from "@/blog-engine/components/admin/fa-icon";

type UserRole = "ADMIN" | "EDITOR";

type UserRowData = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  postsCount: number;
  createdAt: string;
};

function getRoleLabel(role: UserRole) {
  return role === "ADMIN" ? "Administrador" : "Editor";
}

export function EditableUserRow({
  user,
  currentUserId,
  page,
  take,
  sort,
  dir,
  saveAction,
  deleteAction
}: {
  user: UserRowData;
  currentUserId: string;
  page: number;
  take: number;
  sort: string;
  dir: string;
  saveAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<UserRole>(user.role);
  const [password, setPassword] = useState("");
  const formId = useId();
  const deleteFormId = useId();
  const isCurrentUser = user.id === currentUserId;

  function cancelEdit() {
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword("");
    setEditing(false);
  }

  function startEdit() {
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword("");
    setEditing(true);
  }

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword("");
    setEditing(false);
  }, [user]);

  return (
    <tr className="admin-table-row">
      <td className="px-4 py-4 align-top" data-label="Nome">
        {editing ? (
          <input form={formId} name="name" value={name} onChange={(event) => setName(event.target.value)} className="admin-input w-full" required minLength={2} />
        ) : (
          <div className="space-y-1">
            <p className="font-semibold text-ink">{user.name}</p>
            {isCurrentUser ? <p className="text-xs font-semibold text-primary">Você</p> : null}
          </div>
        )}
      </td>
      <td className="px-4 py-4 align-top" data-label="Email">
        {editing ? (
          <input form={formId} name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="admin-input w-full" required />
        ) : (
          <p className="whitespace-nowrap text-sm text-muted">{user.email}</p>
        )}
      </td>
      <td className="px-4 py-4 align-top" data-label="Perfil">
        {editing ? (
          <select form={formId} name="role" value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="admin-input w-full">
            <option value="ADMIN">Administrador</option>
            <option value="EDITOR">Editor</option>
          </select>
        ) : (
          <span className="inline-flex whitespace-nowrap rounded-full border border-[#e7ddd4] bg-white px-3 py-1 text-xs font-semibold text-muted">
            {getRoleLabel(user.role)}
          </span>
        )}
      </td>
      <td className="px-4 py-4 align-top" data-label="Senha">
        {editing ? (
          <input
            form={formId}
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="admin-input w-full"
            placeholder="Nova senha opcional"
            minLength={8}
          />
        ) : (
          <p className="whitespace-nowrap text-sm text-muted">********</p>
        )}
      </td>
      <td className="px-4 py-4 align-top" data-label="Posts">
        <p className="whitespace-nowrap text-sm font-medium text-muted">{user.postsCount} posts</p>
      </td>
      <td className="px-4 py-4 align-top" data-label="Criado em">
        <p className="whitespace-nowrap text-sm text-muted">{user.createdAt}</p>
      </td>
      <td className="px-4 py-4 align-top" data-label="Ações">
        <form id={formId} action={saveAction} className="hidden">
          <input type="hidden" name="id" value={user.id} />
          <input type="hidden" name="page" value={page} />
          <input type="hidden" name="take" value={take} />
          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="dir" value={dir} />
        </form>
        <form id={deleteFormId} action={deleteAction} className="hidden">
          <input type="hidden" name="id" value={user.id} />
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
              <button form={formId} type="submit" className="admin-icon-button" title="Salvar usuário" aria-label="Salvar usuário">
                <FaIcon name="fa-floppy-disk" />
              </button>
            </>
          ) : (
            <button type="button" className="admin-icon-button" title="Editar usuário" aria-label="Editar usuário" onClick={startEdit}>
              <FaIcon name="fa-pen-to-square" />
            </button>
          )}
          <ConfirmSubmitButton
            form={deleteFormId}
            type="submit"
            className="admin-icon-button-danger"
            title={isCurrentUser ? "Você não pode excluir seu próprio usuário" : "Excluir usuário"}
            aria-label={isCurrentUser ? "Você não pode excluir seu próprio usuário" : "Excluir usuário"}
            disabled={isCurrentUser}
            modalTitle="Confirmar exclusão"
            confirmLabel="Excluir"
            confirmMessage={`Excluir o usuário "${user.name}"? Essa ação não pode ser desfeita.`}
          >
            <FaIcon name="fa-trash-can" />
          </ConfirmSubmitButton>
        </div>
      </td>
    </tr>
  );
}
