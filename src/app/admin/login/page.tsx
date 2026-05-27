import { getCurrentUser } from "@/blog-engine/services/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/blog-engine/components/admin/login-form";
import { env } from "@/lib/env";

export default async function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const user = await getCurrentUser();
  if (user) redirect("/admin/posts");

  return (
    <main className="admin-shell flex items-center justify-center px-4 py-10">
      <LoginForm
        error={Boolean(searchParams.error)}
        demoCredentials={env.DEMO_MODE ? { email: env.DEMO_ADMIN_EMAIL, password: env.DEMO_ADMIN_PASSWORD } : null}
      />
    </main>
  );
}
