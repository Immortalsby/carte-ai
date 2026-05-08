import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isFounder } from "@/lib/roles";
import { getTenantBySlug, updateTenant } from "@/lib/db/queries/tenants";

const schema = z.object({
  days: z.number().int().min(1).max(90),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isFounder(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug } = await params;

  try {
    const tenant = await getTenantBySlug(slug);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await request.json();
    const { days } = schema.parse(body);

    // Extend from current trial_ends_at or from now if already expired
    const base = tenant.trial_ends_at && new Date(tenant.trial_ends_at) > new Date()
      ? new Date(tenant.trial_ends_at)
      : new Date();
    const newEnd = new Date(base.getTime() + days * 86400000);

    await updateTenant(tenant.id, {
      plan: "trial",
      trial_ends_at: newEnd,
    });

    return NextResponse.json({ ok: true, trial_ends_at: newEnd.toISOString() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", detail: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[API] extend-trial error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
