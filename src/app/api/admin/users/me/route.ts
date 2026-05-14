import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/auth-schema";
import { eq } from "drizzle-orm";

/** GET — read-only check of approved status */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [row] = await db
    .select({ approved: user.approved })
    .from(user)
    .where(eq(user.id, session.user.id));

  return NextResponse.json({ approved: row?.approved ?? false });
}

/** POST — auto-approve users who have verified their email */
export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [row] = await db
    .select({ approved: user.approved })
    .from(user)
    .where(eq(user.id, session.user.id));

  // Auto-approve if email is verified
  if (session.user.emailVerified && row && !row.approved) {
    await db
      .update(user)
      .set({ approved: true })
      .where(eq(user.id, session.user.id));
    return NextResponse.json({ approved: true });
  }

  return NextResponse.json({ approved: row?.approved ?? false });
}
