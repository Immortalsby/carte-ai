/** Plan & trial helpers */

export type PlanStatus =
  | "trial"
  | "trial_expired"
  | "alacarte"
  | "prixfixe"
  | "degustation"
  | "surmesure";

interface Tenant {
  plan: string;
  trial_ends_at: Date | string | null;
}

const PAID_PLANS = new Set<string>(["alacarte", "prixfixe", "degustation", "surmesure"]);
const VALID_PLANS = new Set<string>(["trial", ...PAID_PLANS]);

/** Resolve the effective plan status, accounting for trial expiry */
export function getPlanStatus(tenant: Tenant): PlanStatus {
  if (tenant.plan === "trial") {
    if (!tenant.trial_ends_at) return "trial_expired";
    const ends = new Date(tenant.trial_ends_at);
    return ends > new Date() ? "trial" : "trial_expired";
  }
  if (!VALID_PLANS.has(tenant.plan)) {
    console.error(`[trial] Unknown plan: ${tenant.plan}`);
    return "trial_expired";
  }
  return tenant.plan as PlanStatus;
}

/** Whether the trial has expired */
export function isTrialExpired(tenant: Tenant): boolean {
  return getPlanStatus(tenant) === "trial_expired";
}

/** Days remaining in trial (0 if expired or not on trial) */
export function trialDaysLeft(tenant: Tenant): number {
  if (tenant.plan !== "trial" || !tenant.trial_ends_at) return 0;
  const ends = new Date(tenant.trial_ends_at);
  const now = new Date();
  const diff = Math.ceil((ends.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/** Whether the tenant has an active paid or trial plan */
export function hasActiveAccess(tenant: Tenant): boolean {
  const status = getPlanStatus(tenant);
  return status !== "trial_expired";
}

/** Whether the tenant can use AI features (concierge, recommendations) */
export function canUseAI(tenant: Tenant): boolean {
  return hasActiveAccess(tenant);
}

/** Daily OCR upload limit per plan. Returns 0 for expired trial. */
export function dailyUploadLimit(tenant: Tenant): number {
  const status = getPlanStatus(tenant);
  switch (status) {
    case "trial":
    case "alacarte":
      return 1;
    case "prixfixe":
      return 10;
    case "degustation":
    case "surmesure":
      return 50;
    case "trial_expired":
      return 0;
  }
}

/** Display name for a plan */
export function planDisplayName(plan: string): string {
  const names: Record<string, string> = {
    trial: "Trial",
    alacarte: "À La Carte",
    prixfixe: "Prix Fixe",
    degustation: "Dégustation",
    surmesure: "Sur Mesure",
  };
  return names[plan] ?? plan;
}
