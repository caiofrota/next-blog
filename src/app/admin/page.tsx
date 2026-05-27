import { redirect } from "next/navigation";
import { getCurrentUser } from "@/blog-engine/services/auth";

export default async function AdminPage() {
  const user = await getCurrentUser();
  redirect(user ? "/admin/posts" : "/admin/login");
}
