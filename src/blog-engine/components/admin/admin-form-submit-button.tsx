"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { FaIcon } from "@/blog-engine/components/admin/fa-icon";

export function AdminFormSubmitButton({
  label,
  pendingLabel,
  icon = "fa-plus",
  className = "admin-button-primary",
  type = "submit",
  ...buttonProps
}: {
  label: string;
  pendingLabel?: string;
  icon?: string;
  className?: string;
  type?: "submit" | "button";
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children" | "type">) {
  const status = useFormStatus();

  return (
    <button type={type} className={className} {...buttonProps} disabled={status.pending || buttonProps.disabled}>
      {status.pending ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
          {pendingLabel ?? label}
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          <FaIcon name={icon} />
          {label}
        </span>
      )}
    </button>
  );
}
