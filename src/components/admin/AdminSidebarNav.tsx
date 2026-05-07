"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export function AdminSidebarNav({ slug, items }: { slug: string; items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <ul className="flex-1 space-y-1 overflow-y-auto p-3">
      {items.map((item) => {
        const fullHref = `/admin/${slug}${item.href}`;
        const active =
          item.href === ""
            ? pathname === `/admin/${slug}` || pathname === `/admin/${slug}/`
            : pathname.startsWith(fullHref);

        return (
          <li key={item.label}>
            <Link
              href={fullHref}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
