import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export type AdminUserSortField = "name" | "email" | "role" | "postsCount" | "createdAt";
export type SortDirection = "asc" | "desc";

export type AdminUserWithCount = Prisma.UserGetPayload<{
  include: { _count: { select: { posts: true } } };
}>;

function normalizeUserRole(value: string) {
  return value === UserRole.EDITOR ? UserRole.EDITOR : UserRole.ADMIN;
}

function normalizeUserInput(input: { name: string; email: string; role: string; password?: string | null }, options: { passwordRequired: boolean }) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password?.trim() ?? "";

  if (!name) throw new Error("required_name");
  if (!email || !email.includes("@")) throw new Error("invalid_email");
  if (options.passwordRequired && password.length < 8) throw new Error("invalid_password");
  if (!options.passwordRequired && password && password.length < 8) throw new Error("invalid_password");

  return {
    name,
    email,
    role: normalizeUserRole(input.role),
    password
  };
}

async function assertUniqueEmail(email: string, id?: string) {
  const conflict = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      ...(id ? { id: { not: id } } : {})
    },
    select: { id: true }
  });

  if (conflict) throw new Error("duplicate_email");
}

function compareText(left: string, right: string) {
  return left.localeCompare(right, "pt-BR", { sensitivity: "base" });
}

export async function listAdminUsers() {
  return prisma.user.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { name: "asc" }
  });
}

export function sortAdminUsers(users: AdminUserWithCount[], sort: AdminUserSortField | null, dir: SortDirection) {
  const factor = dir === "asc" ? 1 : -1;

  return [...users].sort((left, right) => {
    let result = 0;
    if (!sort || sort === "name") {
      result = compareText(left.name, right.name);
    } else if (sort === "email") {
      result = compareText(left.email, right.email);
    } else if (sort === "role") {
      result = compareText(left.role, right.role);
    } else if (sort === "postsCount") {
      result = left._count.posts - right._count.posts;
    } else if (sort === "createdAt") {
      result = left.createdAt.getTime() - right.createdAt.getTime();
    }

    if (result === 0) {
      result = compareText(left.name, right.name);
    }

    return result * factor;
  });
}

export async function createAdminUser(input: { name: string; email: string; role: string; password?: string | null }) {
  const normalized = normalizeUserInput(input, { passwordRequired: true });
  await assertUniqueEmail(normalized.email);

  return prisma.user.create({
    data: {
      name: normalized.name,
      email: normalized.email,
      role: normalized.role,
      passwordHash: await hashPassword(normalized.password)
    }
  });
}

export async function updateAdminUser(id: string, input: { name: string; email: string; role: string; password?: string | null }) {
  const normalized = normalizeUserInput(input, { passwordRequired: false });
  await assertUniqueEmail(normalized.email, id);

  return prisma.user.update({
    where: { id },
    data: {
      name: normalized.name,
      email: normalized.email,
      role: normalized.role,
      ...(normalized.password ? { passwordHash: await hashPassword(normalized.password) } : {})
    }
  });
}

export async function deleteAdminUser(id: string, currentUserId: string) {
  if (id === currentUserId) throw new Error("cannot_delete_self");

  const user = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { posts: true } } }
  });

  if (!user) throw new Error("not_found");
  if (user._count.posts > 0) throw new Error("user_has_posts");

  return prisma.user.delete({ where: { id } });
}
