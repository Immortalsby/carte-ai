"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartBar, ListBullets, ChartLineUp, Image, Gear, CreditCard } from "@phosphor-icons/react";
import type { ReactNode } from "react";

const navIcons: Record<string, ReactNode> = {
  "📊": <ChartBar weight="duotone" className="h-[18px] w-[18px]" />,
  "📋": <ListBullets weight="duotone" className="h-[18px] w-[18px]" />,
  "📈": <ChartLineUp weight="duotone" className="h-[18px] w-[18px]" />,
  "🖼️": <Image weight="duotone" className="h-[18px] w-[18px]" />,
  "💳": <CreditCard weight="duotone" className="h-[18px] w-[18px]" />,
  "⚙️": <Gear weight="duotone" className="h-[18px] w-[18px]" />,
};

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
              <span className="flex items-center">{navIcons[item.icon] ?? item.icon}</span>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
