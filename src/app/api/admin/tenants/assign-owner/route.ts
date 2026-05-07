import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isFounder } from "@/lib/roles";
import { db } from "@/lib/db";
import { user } from "@/lib/db/auth-schema";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateTenantOwner } from "@/lib/db/queries/tenants";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isFounder(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { tenantId, userId } = (await request.json()) as {
    tenantId: string;
    userId: string;
  };

  if (!tenantId || !userId) {
    return NextResponse.json({ error: "Missing tenantId or userId" }, { status: 400 });
  }

  // Verify tenant exists
  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Verify target user is email-verified AND approved
  const [targetUser] = await db
    .select({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      approved: user.approved,
    })
    .from(user)
    .where(eq(user.id, userId));

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!targetUser.emailVerified) {
    return NextResponse.json({ error: "User email not verified" }, { status: 400 });
  }

  if (!targetUser.approved) {
    return NextResponse.json({ error: "User not approved" }, { status: 400 });
  }

  const updated = await updateTenantOwner(tenantId, userId);

  return NextResponse.json({ ok: true, tenant: updated });
}
