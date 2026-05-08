import { NextResponse } from "next/server";
import { stripe, planFromPriceId } from "@/lib/stripe";
import { getTenantByStripeCustomerId, updateTenant } from "@/lib/db/queries/tenants";
import type Stripe from "stripe";

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events for subscription lifecycle.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, err);
    // Return 500 so Stripe retries on transient errors (DB down, network)
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription" || !session.customer || !session.subscription) return;

  const customerId = typeof session.customer === "string" ? session.customer : session.customer.id;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;

  const tenant = await getTenantByStripeCustomerId(customerId);
  if (!tenant) {
    console.error("[Stripe Webhook] No tenant for customer:", customerId);
    return;
  }

  // Fetch subscription to get the plan
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price?.id;
  const plan = priceId ? planFromPriceId(priceId) : null;

  await updateTenant(tenant.id, {
    stripe_subscription_id: subscriptionId,
    ...(plan ? { plan } : {}),
  });

  console.log(`[Stripe Webhook] Checkout completed: tenant=${tenant.id} plan=${plan}`);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const tenant = await getTenantByStripeCustomerId(customerId);
  if (!tenant) return;

  const priceId = subscription.items.data[0]?.price?.id;
  const plan = priceId ? planFromPriceId(priceId) : null;
  const status = subscription.status;

  if (status === "active" || status === "trialing") {
    await updateTenant(tenant.id, {
      stripe_subscription_id: subscription.id,
      ...(plan ? { plan } : {}),
    });
    console.log(`[Stripe Webhook] Subscription active: tenant=${tenant.id} plan=${plan}`);
  } else if (status === "past_due") {
    // Keep current plan but log warning
    console.warn(`[Stripe Webhook] Subscription past_due: tenant=${tenant.id}`);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const tenant = await getTenantByStripeCustomerId(customerId);
  if (!tenant) return;

  await updateTenant(tenant.id, {
    plan: "free",
    stripe_subscription_id: null,
  });

  console.log(`[Stripe Webhook] Subscription cancelled: tenant=${tenant.id} → free`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.customer) return;
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer.id;

  const tenant = await getTenantByStripeCustomerId(customerId);
  if (!tenant) return;

  console.log(`[Stripe Webhook] Invoice paid: tenant=${tenant.id} amount=${invoice.amount_paid}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.customer) return;
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer.id;

  const tenant = await getTenantByStripeCustomerId(customerId);
  if (!tenant) return;

  // TODO: Send email notification to tenant owner via alerts@carte-ai.link
  console.error(`[Stripe Webhook] Payment failed: tenant=${tenant.id} invoice=${invoice.id}`);
}
