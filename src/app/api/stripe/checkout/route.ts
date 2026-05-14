import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { stripe, priceIdFromPlan } from "@/lib/stripe";
import { getTenantBySlug, updateTenant } from "@/lib/db/queries/tenants";
import { isFounder } from "@/lib/roles";

/**
 * POST /api/stripe/checkout
 * Body: { slug: string, plan: "alacarte" | "prixfixe" }
 * Creates a Stripe Checkout Session for the given tenant + plan.
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, plan } = await request.json();

    // Validate inputs
    if (!slug || typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }
    if (plan !== "alacarte" && plan !== "prixfixe") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = priceIdFromPlan(plan);
    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const tenant = await getTenantBySlug(slug);
    if (!tenant || (tenant.owner_id !== session.user.id && !isFounder(session.user.email))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Block if already has an active subscription — use portal to change plans
    if (tenant.stripe_subscription_id) {
      return NextResponse.json(
        { error: "Active subscription exists. Use billing portal to change plans." },
        { status: 409 },
      );
    }

    // Reuse or create Stripe customer
    let customerId = tenant.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name ?? undefined,
        metadata: { tenant_id: tenant.id, slug },
      });
      customerId = customer.id;
      await updateTenant(tenant.id, { stripe_customer_id: customerId });
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "https://carte-ai.link";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/admin/${slug}/billing?billing=success`,
      cancel_url: `${origin}/admin/${slug}/billing?billing=cancelled`,
      subscription_data: {
        metadata: { tenant_id: tenant.id, slug, plan },
      },
      locale: "fr",
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[API] stripe checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
