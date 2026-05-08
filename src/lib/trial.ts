/** Plan & trial helpers */

export type PlanStatus =
  | "trial"
  | "trial_expired"
  | "alacarte"
  | "prixfixe"
  | "surmesure"
  | "free";

interface Tenant {
  plan: string;
  trial_ends_at: Date | string | null;
}

/** Resolve the effective plan status, accounting for trial expiry */
export function getPlanStatus(tenant: Tenant): PlanStatus {
  if (tenant.plan === "trial") {
    if (!tenant.trial_ends_at) return "trial_expired";
    const ends = new Date(tenant.trial_ends_at);
    return ends > new Date() ? "trial" : "trial_expired";
  }
  return tenant.plan as PlanStatus;
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
  return status === "trial" || status === "alacarte" || status === "prixfixe" || status === "surmesure";
}

/** Display name for a plan */
export function planDisplayName(plan: string): string {
  const names: Record<string, string> = {
    trial: "Trial",
    alacarte: "À La Carte",
    prixfixe: "Prix Fixe",
    surmesure: "Sur Mesure",
    free: "Free",
  };
  return names[plan] ?? plan;
}
