import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isFounder } from "@/lib/roles";
import { dailyUploadLimit } from "@/lib/trial";
import { getTenantBySlug } from "@/lib/db/queries/tenants";
import { countTodayUploads, recordUpload } from "@/lib/db/queries/ocr-uploads";

/** GET — check remaining uploads (informational, no side effects) */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const tenant = await getTenantBySlug(slug);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  if (isFounder(session.user.email)) {
    return NextResponse.json({ allowed: true, remaining: 999 });
  }

  if (tenant.owner_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = dailyUploadLimit(tenant);
  if (limit === 0) {
    return NextResponse.json(
      { error: "Trial expired. Please upgrade to continue uploading menus.", allowed: false, remaining: 0 },
      { status: 403 },
    );
  }

  const used = await countTodayUploads(tenant.id);
  const remaining = Math.max(0, limit - used);

  return NextResponse.json({ allowed: remaining > 0, remaining });
}

/** POST — atomically check limit + record an upload (claim a slot) */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const tenant = await getTenantBySlug(slug);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Founders bypass all limits
  if (isFounder(session.user.email)) {
    await recordUpload(tenant.id);
    return NextResponse.json({ allowed: true, remaining: 999 });
  }

  if (tenant.owner_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = dailyUploadLimit(tenant);
  if (limit === 0) {
    return NextResponse.json(
      { error: "Trial expired. Please upgrade to continue uploading menus.", allowed: false, remaining: 0 },
      { status: 403 },
    );
  }

  const used = await countTodayUploads(tenant.id);
  if (used >= limit) {
    return NextResponse.json(
      { error: `Daily upload limit reached (${limit}/day). Upgrade your plan for more.`, allowed: false, remaining: 0 },
      { status: 429 },
    );
  }

  // Record the upload (claim the slot)
  await recordUpload(tenant.id);
  const remaining = Math.max(0, limit - used - 1);

  return NextResponse.json({ allowed: true, remaining });
}
