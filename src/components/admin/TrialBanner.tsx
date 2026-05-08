"use client";

import { Clock, Warning } from "@phosphor-icons/react";

interface TrialBannerProps {
  plan: string;
  daysLeft: number | null;
  slug: string;
  labels: {
    trialActive: string;
    trialDaysLeft: string;
    trialExpired: string;
    upgradeNow: string;
  };
}

export function TrialBanner({ plan, daysLeft, slug, labels }: TrialBannerProps) {
  if (plan !== "trial") return null;

  const expired = daysLeft === 0;

  return (
    <div
      className={`mb-4 flex items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-sm font-medium ${
        expired
          ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
          : daysLeft !== null && daysLeft <= 3
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
      }`}
    >
      <span className="flex items-center gap-2">
        {expired ? (
          <Warning weight="duotone" className="h-4 w-4 shrink-0" />
        ) : (
          <Clock weight="duotone" className="h-4 w-4 shrink-0" />
        )}
        {expired
          ? labels.trialExpired
          : daysLeft !== null
            ? labels.trialDaysLeft
            : labels.trialActive}
      </span>
      <a
        href={`/admin/${slug}/settings#billing`}
        className={`shrink-0 rounded-md px-3 py-1 text-xs font-semibold ${
          expired
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-emerald-600 text-white hover:bg-emerald-700"
        }`}
      >
        {labels.upgradeNow}
      </a>
    </div>
  );
}
