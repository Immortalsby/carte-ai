import { db } from "@/lib/db";
import { referrals, tenants } from "@/lib/db/schema";
import { user } from "@/lib/db/auth-schema";
import { eq, and, sql } from "drizzle-orm";

/** Generate a random 8-char alphanumeric code */
function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 to avoid confusion
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Get or create a referral code for a user */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const [row] = await db
    .select({ referralCode: user.referralCode })
    .from(user)
    .where(eq(user.id, userId));

  if (row?.referralCode) return row.referralCode;

  // Generate unique code with retry
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    try {
      await db
        .update(user)
        .set({ referralCode: code })
        .where(and(eq(user.id, userId), sql`${user.referralCode} IS NULL`));

      // Verify it was set (could fail on unique constraint race)
      const [check] = await db
        .select({ referralCode: user.referralCode })
        .from(user)
        .where(eq(user.id, userId));

      if (check?.referralCode) return check.referralCode;
    } catch {
      // Unique constraint violation — retry with new code
      continue;
    }
  }
  throw new Error("Failed to generate unique referral code");
}

/** Find user by referral code */
export async function getUserByReferralCode(code: string) {
  const [row] = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.referralCode, code.toUpperCase()));
  return row ?? null;
}

/** Create a referral record */
export async function createReferral(
  referrerUserId: string,
  referredTenantId: string,
): Promise<void> {
  await db.insert(referrals).values({
    referrer_user_id: referrerUserId,
    referred_tenant_id: referredTenantId,
    reward_granted: false,
  });
}

/** Mark referral reward as granted for a tenant (atomic to prevent TOCTOU race) */
export async function markReferralRewardGranted(
  referredTenantId: string,
): Promise<{ referrerUserId: string } | null> {
  const [row] = await db
    .update(referrals)
    .set({ reward_granted: true })
    .where(
      and(
        eq(referrals.referred_tenant_id, referredTenantId),
        eq(referrals.reward_granted, false),
      ),
    )
    .returning({ referrer_user_id: referrals.referrer_user_id });

  if (!row) return null;
  return { referrerUserId: row.referrer_user_id };
}

/** Count successful (reward_granted) referrals for a user */
export async function countSuccessfulReferrals(
  referrerUserId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(referrals)
    .where(
      and(
        eq(referrals.referrer_user_id, referrerUserId),
        eq(referrals.reward_granted, true),
      ),
    );
  return row?.count ?? 0;
}

/** Count total referrals for a user */
export async function countTotalReferrals(
  referrerUserId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(referrals)
    .where(eq(referrals.referrer_user_id, referrerUserId));
  return row?.count ?? 0;
}

/** Get referral stats for a user */
export async function getReferralStats(userId: string) {
  const [userRow] = await db
    .select({
      referralCode: user.referralCode,
      permanentFree: user.permanentFree,
    })
    .from(user)
    .where(eq(user.id, userId));

  const total = await countTotalReferrals(userId);
  const qualified = await countSuccessfulReferrals(userId);

  return {
    code: userRow?.referralCode ?? null,
    permanentFree: userRow?.permanentFree ?? false,
    totalReferred: total,
    qualifiedReferred: qualified,
  };
}

/** Extend trial for all tenants owned by a user by N days */
export async function extendUserTrials(
  userId: string,
  days: number,
): Promise<void> {
  const userTenants = await db
    .select({ id: tenants.id, plan: tenants.plan, trial_ends_at: tenants.trial_ends_at })
    .from(tenants)
    .where(eq(tenants.owner_id, userId));

  for (const t of userTenants) {
    if (t.plan !== "trial") continue;
    const currentEnd = t.trial_ends_at ? new Date(t.trial_ends_at) : new Date();
    const base = currentEnd > new Date() ? currentEnd : new Date();
    const newEnd = new Date(base.getTime() + days * 86400000);
    await db
      .update(tenants)
      .set({ trial_ends_at: newEnd })
      .where(eq(tenants.id, t.id));
  }
}

/** Check if a user has permanent free access */
export async function isUserPermanentFree(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ permanentFree: user.permanentFree })
    .from(user)
    .where(eq(user.id, userId));
  return row?.permanentFree ?? false;
}

/** Grant permanent free access to a user */
export async function grantPermanentFree(userId: string): Promise<void> {
  // Mark user
  await db
    .update(user)
    .set({ permanentFree: true })
    .where(eq(user.id, userId));

  // Upgrade trial/free tenants to alacarte (don't downgrade paid plans)
  await db
    .update(tenants)
    .set({ plan: "alacarte", trial_ends_at: null })
    .where(
      and(
        eq(tenants.owner_id, userId),
        sql`${tenants.plan} IN ('trial', 'free')`,
      ),
    );
}
