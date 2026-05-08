"use client";

import { usePathname } from "next/navigation";

interface ExpiredGateProps {
  slug: string;
  children: React.ReactNode;
}

/** When trial is expired, only the settings page is accessible (for billing/upgrade). All other pages are blurred. */
export function ExpiredGate({ slug, children }: ExpiredGateProps) {
  const pathname = usePathname();
  const isAllowed = pathname === `/admin/${slug}/settings` || pathname === `/admin/${slug}/billing`;

  if (isAllowed) return <>{children}</>;

  return (
    <div className="pointer-events-none select-none opacity-30 blur-[2px]" aria-hidden>
      {children}
    </div>
  );
}
