import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isFounder } from "@/lib/roles";
import { db } from "@/lib/db";
import { user } from "@/lib/db/auth-schema";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isFounder(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, secret } = (await request.json()) as {
    userId: string;
    secret: string;
  };

  if (!userId || !secret) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify secret matches the DELETE_TENANT_SECRET
  const expectedSecret = process.env.DELETE_TENANT_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
  }

  // Prevent deleting yourself
  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  // Delete user's tenants first (menus cascade via FK)
  await db.delete(tenants).where(eq(tenants.owner_id, userId));

  // Delete user (sessions + accounts cascade via FK)
  await db.delete(user).where(eq(user.id, userId));

  return NextResponse.json({ ok: true });
}
