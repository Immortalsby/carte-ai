"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { ThemeToggle } from "./ThemeToggle";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface AdminMobileNavProps {
  slug: string;
  email: string;
  navItems: NavItem[];
  themeLabels?: { light: string; dark: string; system: string };
}

export function AdminMobileNav({ slug, email, navItems, themeLabels }: AdminMobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
        aria-label="Toggle menu"
      >
        {open ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-[57px] z-50 border-b border-border bg-background shadow-lg">
          <ul className="space-y-1 p-3">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={`/admin/${slug}${item.href}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-foreground/80 hover:bg-muted"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-border p-3 space-y-2">
            {themeLabels && (
              <div className="px-3">
                <ThemeToggle labels={themeLabels} />
              </div>
            )}
            <p className="px-3 text-[10px] text-muted-foreground">{email}</p>
            <button
              type="button"
              onClick={async () => {
                await signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login"; } } });
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 dark:text-red-400"
            >
              <span>🚪</span>
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
