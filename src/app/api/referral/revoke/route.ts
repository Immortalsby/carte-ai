import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isFounder } from "@/lib/roles";
import { revokeReferral } from "@/lib/db/queries/referrals";

/** POST /api/referral/revoke — Founder-only: revoke a user's referral */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isFounder(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = (await request.json()) as { userId?: string };
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const result = await revokeReferral(userId);
  return NextResponse.json(result);
}
