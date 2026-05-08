"use client";

import { signOut } from "@/lib/auth-client";
import { SignOut } from "@phosphor-icons/react";

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
      <SignOut weight="duotone" className="h-4 w-4" />
      {label}
    </button>
  );
}
