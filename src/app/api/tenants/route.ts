import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createTenant, getTenantBySlug } from "@/lib/db/queries/tenants";

const createTenantSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/),
  cuisine_type: z.string().optional(),
  address: z.string().optional(),
  google_place_id: z.string().optional(),
  rating: z.string().optional(),
});

async function findUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let existing = await getTenantBySlug(slug);
  if (!existing) return slug;

  // Try with city suffix if address contains one (FR3)
  // For now, append numeric suffix
  for (let i = 2; i <= 99; i++) {
    slug = `${baseSlug}-${i}`;
    existing = await getTenantBySlug(slug);
    if (!existing) return slug;
  }
  throw new Error("Unable to generate unique slug");
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createTenantSchema.parse(body);

    // Auto-resolve slug collisions by appending numeric suffix (FR3)
    const uniqueSlug = await findUniqueSlug(parsed.slug);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const tenant = await createTenant({
      ...parsed,
      slug: uniqueSlug,
      owner_id: session.user.id,
      plan: "trial",
      trial_ends_at: trialEndsAt,
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", detail: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[API] tenants POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
