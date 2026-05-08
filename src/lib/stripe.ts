import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/** Map Stripe Price IDs to internal plan names */
const priceToPlan: Record<string, string> = {
  ...(process.env.STRIPE_PRICE_ALACARTE ? { [process.env.STRIPE_PRICE_ALACARTE]: "alacarte" } : {}),
  ...(process.env.STRIPE_PRICE_PRIXFIXE ? { [process.env.STRIPE_PRICE_PRIXFIXE]: "prixfixe" } : {}),
};

/** Resolve a Stripe Price ID to an internal plan name */
export function planFromPriceId(priceId: string): string | null {
  return priceToPlan[priceId] ?? null;
}

/** Map internal plan names to Stripe Price IDs */
export function priceIdFromPlan(plan: string): string | null {
  if (plan === "alacarte") return process.env.STRIPE_PRICE_ALACARTE ?? null;
  if (plan === "prixfixe") return process.env.STRIPE_PRICE_PRIXFIXE ?? null;
  return null;
}
