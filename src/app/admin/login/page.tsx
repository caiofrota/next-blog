import { getCurrentUser } from "@/blog-engine/services/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/blog-engine/components/admin/login-form";

export default async function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const user = await getCurrentUser();
  if (user) redirect("/admin/posts");

  return (
    <main className="admin-shell flex items-center justify-center px-4 py-10">
      <LoginForm error={Boolean(searchParams.error)} />
    </main>
  );
}
