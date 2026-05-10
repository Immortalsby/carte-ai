import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/db/queries/tenants";
import { getPublishedMenu, createMenuVersion } from "@/lib/db/queries/menus";
import { restaurantMenuSchema } from "@/lib/validation";
import { sanitizeRawMenu } from "@/lib/menu";
import { isFounder } from "@/lib/roles";

// GET — public: fetch published menu by slug
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const tenant = await getTenantBySlug(slug);
    if (!tenant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 },
      );
    }

    const menu = await getPublishedMenu(tenant.id);
    if (!menu) {
      return NextResponse.json(
        { error: "No menu published yet" },
        { status: 404 },
      );
    }

    return NextResponse.json(menu.payload);
  } catch (error) {
    console.error("[API] menus/[slug] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT — authenticated: update/publish menu
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const tenant = await getTenantBySlug(slug);
    if (!tenant || (tenant.owner_id !== session.user.id && !isFounder(session.user.email))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const sanitized = sanitizeRawMenu(body as Record<string, unknown>);
    const parsed = restaurantMenuSchema.parse(sanitized);
    const menu = await createMenuVersion(tenant.id, parsed);

    return NextResponse.json(menu, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as Error & { issues?: Array<{ path: (string | number)[]; message: string }> };
      const fields = (zodError.issues ?? []).map((i) => `${i.path.join(".")}: ${i.message}`);
      return NextResponse.json(
        { error: "Validation failed", fields },
        { status: 400 },
      );
    }
    console.error("[API] menus/[slug] PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
