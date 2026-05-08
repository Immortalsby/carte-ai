import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/db/queries/tenants";
import { getMenuVersions, getMenuByVersion, createMenuVersion } from "@/lib/db/queries/menus";
import { isFounder } from "@/lib/roles";

// GET — list available versions
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { slug } = await params;
    const tenant = await getTenantBySlug(slug);
    if (!tenant || (tenant.owner_id !== session.user.id && !isFounder(session.user.email))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const versions = await getMenuVersions(tenant.id);
    return NextResponse.json({ versions, maxVersions: 10 });
  } catch (error) {
    console.error("[API] menu versions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — rollback to a specific version (creates a new version from old payload)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { slug } = await params;
    const tenant = await getTenantBySlug(slug);
    if (!tenant || (tenant.owner_id !== session.user.id && !isFounder(session.user.email))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { version } = await request.json();
    if (typeof version !== "number") {
      return NextResponse.json({ error: "version is required" }, { status: 400 });
    }

    const oldMenu = await getMenuByVersion(tenant.id, version);
    if (!oldMenu) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Create a new version with the old payload (rollback = publish old content as new)
    const restored = await createMenuVersion(tenant.id, oldMenu.payload);
    return NextResponse.json(restored, { status: 201 });
  } catch (error) {
    console.error("[API] menu versions POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
