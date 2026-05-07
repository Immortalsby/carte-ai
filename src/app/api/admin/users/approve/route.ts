import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isFounder } from "@/lib/roles";
import { db } from "@/lib/db";
import { user } from "@/lib/db/auth-schema";
import { eq } from "drizzle-orm";

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

  return NextResponse.json({ ok: true });
}
