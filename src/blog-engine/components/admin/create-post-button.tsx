import Link from "next/link";
import { FaIcon } from "@/blog-engine/components/admin/fa-icon";

export function CreatePostButton() {
  return (
    <Link href="/admin/posts/new" className="admin-button-primary">
      <span className="inline-flex items-center gap-2">
        <FaIcon name="fa-plus" />
        Criar post
      </span>
    </Link>
  );
}
