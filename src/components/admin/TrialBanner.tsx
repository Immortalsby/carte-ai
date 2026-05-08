"use client";

import { Clock, Warning, Crown } from "@phosphor-icons/react";
import { planDisplayName } from "@/lib/trial";

interface TrialBannerProps {
  plan: string;
  daysLeft: number | null;
  slug: string;
  isFounder?: boolean;
  isExpired?: boolean;
  labels: {
    trialActive: string;
    trialDaysLeft: string;
    trialExpired: string;
    upgradeNow: string;
  };
}

export function TrialBanner({ plan, daysLeft, slug, isFounder, isExpired, labels }: TrialBannerProps) {
  // Founders see a subtle plan badge instead of trial banner
  if (isFounder) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-purple-500/10 border border-purple-500/20 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400">
        <Crown weight="duotone" className="h-4 w-4 shrink-0" />
        <span>{planDisplayName(plan)}</span>
        {plan === "trial" && daysLeft !== null && (
          <span className="text-xs opacity-70">({daysLeft}d left)</span>
        )}
      </div>
    );
  }

  if (plan !== "trial") return null;

  // Expired trial: full-width blocking banner with upgrade CTA
  if (isExpired) {
    return (
      <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
        <Warning weight="duotone" className="mx-auto h-8 w-8 text-red-500" />
        <p className="mt-2 text-sm font-semibold text-red-600 dark:text-red-400">
          {labels.trialExpired}
        </p>
        <a
          href={`/admin/${slug}/settings#billing`}
          className="mt-3 inline-block rounded-md bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          {labels.upgradeNow}
        </a>
      </div>
    );
  }

  return (
    <div
      className={`mb-4 flex items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-sm font-medium ${
        daysLeft !== null && daysLeft <= 3
          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
      }`}
    >
      <span className="flex items-center gap-2">
        <Clock weight="duotone" className="h-4 w-4 shrink-0" />
        {daysLeft !== null ? labels.trialDaysLeft : labels.trialActive}
      </span>
      <a
        href={`/admin/${slug}/settings#billing`}
        className="shrink-0 rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
      >
        {labels.upgradeNow}
      </a>
    </div>
  );
}
