import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getOrCreateReferralCode, getReferralStats } from "@/lib/db/queries/referrals";

/** GET /api/referral — Get or create referral code + stats */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = await getOrCreateReferralCode(session.user.id);
  const stats = await getReferralStats(session.user.id);

  return NextResponse.json({
    code,
    permanentFree: stats.permanentFree,
    totalReferred: stats.totalReferred,
    qualifiedReferred: stats.qualifiedReferred,
  });
}
