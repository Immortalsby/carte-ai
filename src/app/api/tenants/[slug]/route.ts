import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getTenantBySlug, updateTenant, deleteTenant } from "@/lib/db/queries/tenants";
import { isFounder } from "@/lib/roles";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const tenant = await getTenantBySlug(slug);
    if (!tenant || (tenant.owner_id !== session.user.id && !isFounder(session.user.email))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { secret } = (await request.json()) as { secret: string };
    const expected = process.env.DELETE_TENANT_SECRET;
    if (!expected || secret !== expected) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
    }

    await deleteTenant(tenant.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API] tenants/[slug] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

const updateTenantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  cuisine_type: z.string().optional(),
  address: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const tenant = await getTenantBySlug(slug);
    if (!tenant || (tenant.owner_id !== session.user.id && !isFounder(session.user.email))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateTenantSchema.parse(body);
    // Merge settings with existing rather than overwrite
    const updateData: Record<string, unknown> = { ...parsed };
    if (parsed.settings) {
      const existing = (tenant.settings ?? {}) as Record<string, unknown>;
      updateData.settings = { ...existing, ...parsed.settings };
    }
    const updated = await updateTenant(tenant.id, updateData);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", detail: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[API] tenants/[slug] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
