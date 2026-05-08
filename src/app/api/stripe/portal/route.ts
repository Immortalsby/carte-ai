import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { getTenantBySlug } from "@/lib/db/queries/tenants";
import { isFounder } from "@/lib/roles";

/**
 * POST /api/stripe/portal
 * Body: { slug: string }
 * Creates a Stripe Billing Portal session for the tenant to manage subscription.
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await request.json();
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const tenant = await getTenantBySlug(slug);
    if (!tenant || (tenant.owner_id !== session.user.id && !isFounder(session.user.email))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!tenant.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account" }, { status: 400 });
    }

    const origin = request.headers.get("origin") || "https://carte-ai.link";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: tenant.stripe_customer_id,
      return_url: `${origin}/admin/${slug}/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("[API] stripe portal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
