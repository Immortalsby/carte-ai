"use client";

import { useState } from "react";
import { CreditCard, ArrowSquareOut, Warning, DownloadSimple, Check } from "@phosphor-icons/react";
import { useToast } from "@/components/ui/Toast";
import type { AdminLocale } from "@/lib/admin-i18n";
import { getAdminDict } from "@/lib/admin-i18n";

interface BillingSectionProps {
  slug: string;
  currentPlan: string;
  hasStripeSubscription: boolean;
  isFounder?: boolean;
  isExpired?: boolean;
  labels: {
    billingTitle: string;
    currentPlan: string;
    subscribeTo: string;
    manageBilling: string;
    billingFree: string;
  };
  locale?: AdminLocale;
}

const PLAN_DISPLAY: Record<string, string> = {
  trial: "Trial (14 jours)",
  alacarte: "À La Carte — 19€/mois",
  prixfixe: "Prix Fixe — 39€/mois",
  degustation: "Dégustation",
  surmesure: "Sur Mesure",
};

type FeatureKey =
  | "planF_1restaurant"
  | "planF_5000scans"
  | "planF_qrPoster"
  | "planF_nLanguages"
  | "planF_14allergens"
  | "planF_basicDashboard"
  | "planF_emailSupport"
  | "planF_unlimitedReco"
  | "planF_smartHighlights"
  | "planF_fullAnalytics"
  | "planF_advancedExtract"
  | "planF_weeklyReports"
  | "planF_prioritySupport";

const ALACARTE_FEATURES: FeatureKey[] = [
  "planF_1restaurant",
  "planF_5000scans",
  "planF_qrPoster",
  "planF_nLanguages",
  "planF_14allergens",
  "planF_basicDashboard",
  "planF_emailSupport",
];

const PRIXFIXE_FEATURES: FeatureKey[] = [
  "planF_unlimitedReco",
  "planF_smartHighlights",
  "planF_fullAnalytics",
  "planF_advancedExtract",
  "planF_weeklyReports",
  "planF_prioritySupport",
];

const AVAILABLE_PLANS = [
  { code: "alacarte", name: "À La Carte", price: "19€/mois", features: ALACARTE_FEATURES, includesFrom: null },
  { code: "prixfixe", name: "Prix Fixe", price: "39€/mois", features: PRIXFIXE_FEATURES, includesFrom: "À La Carte" },
];

export function BillingSection({
  slug,
  currentPlan,
  hasStripeSubscription,
  isFounder,
  isExpired,
  labels,
  locale = "en",
}: BillingSectionProps) {
  const t = getAdminDict(locale);
  const [loading, setLoading] = useState<string | null>(null);
  const [extensionDays, setExtensionDays] = useState("7");
  const { toast } = useToast();

  async function handleCheckout(plan: string) {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast(data.error || "Error creating checkout", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast(data.error || "Error opening portal", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setLoading(null);
    }
  }

  const isPaid = ["alacarte", "prixfixe", "degustation", "surmesure"].includes(currentPlan);

  async function handleExtendTrial() {
    const days = parseInt(extensionDays, 10);
    if (isNaN(days) || days < 1 || days > 90) {
      toast(t.extendTrialInvalid, "error");
      return;
    }
    setLoading("extend");
    try {
      const res = await fetch(`/api/tenants/${slug}/extend-trial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      });
      if (res.ok) {
        toast(t.extendTrialSuccess(days), "success");
        window.location.reload();
      } else {
        const data = await res.json();
        toast(data.error || "Error", "error");
      }
    } catch {
      toast(t.networkError, "error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div id="billing" className="mt-8 scroll-mt-4 rounded-lg border border-border p-6">
      <div className="flex items-center gap-2">
        <CreditCard weight="duotone" className="h-5 w-5 text-foreground" />
        <h2 className="text-lg font-semibold">{labels.billingTitle}</h2>
      </div>

      {/* Expired trial alert */}
      {isExpired && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          <Warning weight="duotone" className="h-5 w-5 shrink-0" />
          <span>Your trial has expired. Subscribe to restore full access.</span>
        </div>
      )}

      {/* Current plan */}
      <div className="mt-4 rounded-md bg-muted/50 px-4 py-3">
        <p className="text-sm text-muted-foreground">{labels.currentPlan}</p>
        <p className="mt-1 text-base font-semibold text-foreground">
          {PLAN_DISPLAY[currentPlan] ?? currentPlan}
        </p>
      </div>

      {/* Founder: trial extension */}
      {isFounder && !isPaid && (
        <div className="mt-4 rounded-md border border-purple-500/20 bg-purple-500/5 px-4 py-3">
          <p className="text-xs font-medium text-purple-600 dark:text-purple-400">{t.founderExtendTrial}</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={90}
              value={extensionDays}
              onChange={(e) => setExtensionDays(e.target.value)}
              className="w-20 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            />
            <span className="text-xs text-muted-foreground">{t.extendTrialDays}</span>
            <button
              type="button"
              onClick={handleExtendTrial}
              disabled={loading !== null}
              className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {loading === "extend" ? t.extendTrialExtending : t.extendTrialButton}
            </button>
          </div>
        </div>
      )}

      {/* Manage existing subscription (upgrade/downgrade/cancel via Stripe Portal) */}
      {hasStripeSubscription && (
        <button
          type="button"
          onClick={handlePortal}
          disabled={loading !== null}
          className="mt-4 flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          <ArrowSquareOut weight="bold" className="h-4 w-4" />
          {loading === "portal" ? "..." : labels.manageBilling}
        </button>
      )}

      {/* Download invoice — available for paid plans */}
      {isPaid && hasStripeSubscription && (
        <button
          type="button"
          onClick={() => handlePortal()}
          disabled={loading !== null}
          className="mt-3 flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          <DownloadSimple weight="bold" className="h-4 w-4" />
          {loading === "portal" ? t.downloadingInvoice : t.downloadInvoice}
        </button>
      )}

      {/* Plan cards with features */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {AVAILABLE_PLANS.map((p) => {
          const isActive = currentPlan === p.code;
          return (
            <div
              key={p.code}
              className={`rounded-lg border p-4 ${
                isActive
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-border bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
                <span className="text-sm font-bold text-foreground">{p.price}</span>
              </div>

              {/* Feature list */}
              <div className="mt-3">
                {p.includesFrom && (
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    {t.planEverythingIn(p.includesFrom)}
                  </p>
                )}
                <ul className="space-y-1">
                  {p.features.map((fKey) => (
                    <li key={fKey} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Check weight="bold" className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                      <span>{t[fKey] as string}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Subscribe / Active badge */}
              {isActive ? (
                <div className="mt-3 rounded-md bg-emerald-500/10 px-3 py-1.5 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {labels.currentPlan}
                </div>
              ) : !isPaid && !hasStripeSubscription ? (
                <button
                  type="button"
                  onClick={() => handleCheckout(p.code)}
                  disabled={loading !== null}
                  className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading === p.code ? "..." : `${labels.subscribeTo} ${p.name}`}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
