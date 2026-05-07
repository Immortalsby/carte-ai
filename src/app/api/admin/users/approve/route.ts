import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isFounder } from "@/lib/roles";
import { db } from "@/lib/db";
import { user } from "@/lib/db/auth-schema";
import { eq } from "drizzle-orm";
import { sendAccountActivatedEmail } from "@/lib/email";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isFounder(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, approved } = (await request.json()) as {
    userId: string;
    approved: boolean;
  };

  if (!userId || typeof approved !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await db
    .update(user)
    .set({ approved })
    .where(eq(user.id, userId));

  // Send activation email when approving (not when revoking)
  if (approved) {
    const [row] = await db
      .select({ name: user.name, email: user.email })
      .from(user)
      .where(eq(user.id, userId));
    if (row) {
      sendAccountActivatedEmail({ name: row.name, email: row.email }).catch(
        (err) => console.error("[Approve] Failed to send activation email:", err),
      );
    }
  }

  return NextResponse.json({ ok: true });
}
