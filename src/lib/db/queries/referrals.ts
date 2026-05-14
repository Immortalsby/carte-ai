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

/** Get referral overview for all users (founder dashboard) */
export async function getAllReferralStats(): Promise<
  Map<string, { totalInvited: number; qualifiedInvited: number; referredByName: string | null; permanentFree: boolean }>
> {
  // Count referrals per referrer
  const referrerStats = await db
    .select({
      referrer_user_id: referrals.referrer_user_id,
      total: sql<number>`count(*)::int`,
      qualified: sql<number>`count(*) filter (where ${referrals.reward_granted} = true)::int`,
    })
    .from(referrals)
    .groupBy(referrals.referrer_user_id);

  // Get referred_by_code for all tenants that have one
  const referredTenants = await db
    .select({
      owner_id: tenants.owner_id,
      referred_by_code: tenants.referred_by_code,
    })
    .from(tenants)
    .where(sql`${tenants.referred_by_code} IS NOT NULL`);

  // Map referral codes to user names
  const codes = [...new Set(referredTenants.map((t) => t.referred_by_code!))];
  const codeToName = new Map<string, string>();
  if (codes.length > 0) {
    const codeUsers = await db
      .select({ referralCode: user.referralCode, name: user.name })
      .from(user)
      .where(sql`${user.referralCode} IN (${sql.join(codes.map((c) => sql`${c}`), sql`, `)})`);
    for (const cu of codeUsers) {
      if (cu.referralCode) codeToName.set(cu.referralCode, cu.name);
    }
  }

  // Get permanentFree status
  const allUsers = await db
    .select({ id: user.id, permanentFree: user.permanentFree })
    .from(user);

  const result = new Map<string, { totalInvited: number; qualifiedInvited: number; referredByName: string | null; permanentFree: boolean }>();

  // Init all users
  for (const u of allUsers) {
    result.set(u.id, { totalInvited: 0, qualifiedInvited: 0, referredByName: null, permanentFree: u.permanentFree });
  }

  // Fill referrer stats
  for (const rs of referrerStats) {
    const existing = result.get(rs.referrer_user_id);
    if (existing) {
      existing.totalInvited = rs.total;
      existing.qualifiedInvited = rs.qualified;
    }
  }

  // Fill "referred by" info (use first tenant's referred_by_code per owner)
  for (const rt of referredTenants) {
    const existing = result.get(rt.owner_id);
    if (existing && !existing.referredByName && rt.referred_by_code) {
      existing.referredByName = codeToName.get(rt.referred_by_code) ?? null;
    }
  }

  return result;
}

/** Revoke a referral for a user (delete referral record + undo rewards if granted) */
export async function revokeReferral(
  referredUserId: string,
): Promise<{ revoked: boolean; referrerUserId?: string; wasRewarded?: boolean }> {
  // Find referral via the user's tenants
  const userTenants = await db
    .select({ id: tenants.id, referred_by_code: tenants.referred_by_code })
    .from(tenants)
    .where(eq(tenants.owner_id, referredUserId));

  const referredTenant = userTenants.find((t) => t.referred_by_code);
  if (!referredTenant) return { revoked: false };

  // Find the referral record
  const [ref] = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referred_tenant_id, referredTenant.id));

  if (!ref) return { revoked: false };

  const wasRewarded = ref.reward_granted;
  const referrerUserId = ref.referrer_user_id;

  // Delete referral record
  await db.delete(referrals).where(eq(referrals.id, ref.id));

  // Clear referred_by_code on tenant
  await db
    .update(tenants)
    .set({ referred_by_code: null })
    .where(eq(tenants.id, referredTenant.id));

  // If reward was granted, check if referrer should lose permanent_free
  if (wasRewarded) {
    const remaining = await countSuccessfulReferrals(referrerUserId);
    if (remaining < 10) {
      await db
        .update(user)
        .set({ permanentFree: false })
        .where(
          and(eq(user.id, referrerUserId), eq(user.permanentFree, true)),
        );
    }
  }

  return { revoked: true, referrerUserId, wasRewarded };
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
