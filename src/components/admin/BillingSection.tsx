"use client";

import { useState } from "react";
import { CreditCard, ArrowSquareOut, Warning, DownloadSimple } from "@phosphor-icons/react";
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

const AVAILABLE_PLANS = [
  { code: "alacarte", name: "À La Carte", price: "19€/mois" },
  { code: "prixfixe", name: "Prix Fixe", price: "39€/mois" },
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

      {/* Subscribe buttons — only for users without an active subscription */}
      {!isPaid && !hasStripeSubscription && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {AVAILABLE_PLANS.map((p) => (
            <button
              key={p.code}
              type="button"
              onClick={() => handleCheckout(p.code)}
              disabled={loading !== null}
              className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading === p.code ? "..." : `${labels.subscribeTo} ${p.name} — ${p.price}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
