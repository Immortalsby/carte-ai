import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserByReferralCode } from "@/lib/db/queries/referrals";

/** POST /api/referral/validate — Check if a referral code is valid */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = (await request.json()) as { code?: string };
  if (!code || typeof code !== "string" || code.length < 4 || code.length > 16) {
    return NextResponse.json({ valid: false });
  }

  const referrer = await getUserByReferralCode(code);
  if (!referrer) {
    return NextResponse.json({ valid: false });
  }

  // Prevent self-referral
  if (referrer.id === session.user.id) {
    return NextResponse.json({ valid: false, reason: "self_referral" });
  }

  return NextResponse.json({ valid: true, referrerName: referrer.name });
}
