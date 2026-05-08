"use client";

import { useState } from "react";
import { CreditCard, ArrowSquareOut } from "@phosphor-icons/react";
import { useToast } from "@/components/ui/Toast";

interface BillingSectionProps {
  slug: string;
  currentPlan: string;
  hasStripeSubscription: boolean;
  labels: {
    billingTitle: string;
    currentPlan: string;
    subscribeTo: string;
    manageBilling: string;
    billingFree: string;
  };
}

const PLAN_DISPLAY: Record<string, string> = {
  trial: "Trial (14 jours)",
  alacarte: "À La Carte — 19€/mois",
  prixfixe: "Prix Fixe — 39€/mois",
  surmesure: "Sur Mesure",
  free: "Free",
};

const AVAILABLE_PLANS = [
  { code: "alacarte", name: "À La Carte", price: "19€/mois" },
  { code: "prixfixe", name: "Prix Fixe", price: "39€/mois" },
];

export function BillingSection({
  slug,
  currentPlan,
  hasStripeSubscription,
  labels,
}: BillingSectionProps) {
  const [loading, setLoading] = useState<string | null>(null);
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

  const isPaid = currentPlan === "alacarte" || currentPlan === "prixfixe" || currentPlan === "surmesure";

  return (
    <div id="billing" className="mt-8 scroll-mt-4 rounded-lg border border-border p-6">
      <div className="flex items-center gap-2">
        <CreditCard weight="duotone" className="h-5 w-5 text-foreground" />
        <h2 className="text-lg font-semibold">{labels.billingTitle}</h2>
      </div>

      {/* Current plan */}
      <div className="mt-4 rounded-md bg-muted/50 px-4 py-3">
        <p className="text-sm text-muted-foreground">{labels.currentPlan}</p>
        <p className="mt-1 text-base font-semibold text-foreground">
          {PLAN_DISPLAY[currentPlan] ?? currentPlan}
        </p>
        {!isPaid && currentPlan !== "trial" && (
          <p className="mt-1 text-xs text-muted-foreground">{labels.billingFree}</p>
        )}
      </div>

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
