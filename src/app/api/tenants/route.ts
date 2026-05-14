import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createTenant, getTenantBySlug } from "@/lib/db/queries/tenants";
import { isFounder } from "@/lib/roles";
import { getUserByReferralCode, createReferral } from "@/lib/db/queries/referrals";

const createTenantSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  cuisine_type: z.string().optional(),
  address: z.string().optional(),
  google_place_id: z.string().optional(),
  rating: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  referral_code: z.string().max(16).optional(),
});

async function findUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let existing = await getTenantBySlug(slug);
  if (!existing) return slug;

  // Try with city suffix if address contains one (FR3)
  // For now, append numeric suffix
  for (let i = 2; i <= 99; i++) {
    slug = `${baseSlug}-${i}`;
    existing = await getTenantBySlug(slug);
    if (!existing) return slug;
  }
  throw new Error("Unable to generate unique slug");
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createTenantSchema.parse(body);

    // Auto-resolve slug collisions by appending numeric suffix (FR3)
    const uniqueSlug = await findUniqueSlug(parsed.slug);

    // Validate referral code if provided
    let referrer: { id: string; name: string } | null = null;
    if (parsed.referral_code) {
      referrer = await getUserByReferralCode(parsed.referral_code);
      // Prevent self-referral
      if (referrer && referrer.id === session.user.id) {
        referrer = null;
      }
    }

    // Founders default to alacarte (no trial); regular users get trial
    // Referred users get 30-day trial instead of 14-day
    const founder = isFounder(session.user.email);
    const plan = founder ? "alacarte" : "trial";
    const trialDays = referrer ? 30 : 14;
    const trialEndsAt = founder ? null : new Date(Date.now() + trialDays * 86400000);

    const { settings, referral_code: _refCode, ...tenantData } = parsed;
    const tenant = await createTenant({
      ...tenantData,
      slug: uniqueSlug,
      owner_id: session.user.id,
      plan,
      trial_ends_at: trialEndsAt,
      referred_by_code: referrer ? parsed.referral_code : undefined,
      settings: settings || undefined,
    });

    // Record referral relationship (must succeed for reward to work later)
    if (referrer) {
      await createReferral(referrer.id, tenant.id);
    }

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", detail: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[API] tenants POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
