import {
  markReferralRewardGranted,
  countSuccessfulReferrals,
  extendUserTrials,
  grantPermanentFree,
} from "@/lib/db/queries/referrals";

const REWARD_TRIAL_DAYS = 30;
const PERMANENT_FREE_THRESHOLD = 10;
const MIN_DISHES_FOR_REWARD = 5;

/**
 * Check if a referred tenant qualifies for the referral reward,
 * and grant rewards to the referrer if so.
 *
 * Call this after a menu is saved. It's idempotent — safe to call multiple times.
 */
export async function checkAndGrantReferralReward(
  tenantId: string,
  dishCount: number,
): Promise<void> {
  if (dishCount < MIN_DISHES_FOR_REWARD) return;

  const result = await markReferralRewardGranted(tenantId);
  if (!result) return; // No referral or already granted

  const { referrerUserId } = result;
  console.log(`[referral] Reward triggered: tenant=${tenantId}, referrer=${referrerUserId}`);

  // Extend referrer's trial by 30 days
  await extendUserTrials(referrerUserId, REWARD_TRIAL_DAYS);

  // Check if they've hit the permanent free threshold
  const successCount = await countSuccessfulReferrals(referrerUserId);
  if (successCount >= PERMANENT_FREE_THRESHOLD) {
    await grantPermanentFree(referrerUserId);
    console.log(`[referral] Permanent free granted to user=${referrerUserId} (${successCount} referrals)`);
  }
}
