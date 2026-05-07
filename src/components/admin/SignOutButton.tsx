"use client";

import { signOut } from "@/lib/auth-client";

export function SignOutButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={async () => {
        await signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login"; } } });
      }}
      className={className}
    >
      <span>🚪</span>
      {label}
    </button>
  );
}
