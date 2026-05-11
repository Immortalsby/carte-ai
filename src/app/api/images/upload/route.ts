import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { cacheDishImage } from "@/lib/db/queries/images";
import { patchDishImageUrl } from "@/lib/db/queries/menus";
import { getTenantBySlug } from "@/lib/db/queries/tenants";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 },
      );
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 5MB)" },
        { status: 400 },
      );
    }

    // Optional fields for AI-generated dish images (DB caching + dish patching)
    const canonicalTag = formData.get("canonicalTag") as string | null;
    const slug = formData.get("slug") as string | null;
    const dishId = formData.get("dishId") as string | null;

    const ext = file.name.split(".").pop() || "jpg";
    const prefix = canonicalTag ? "dish-images" : "dish-uploads";
    const filename = canonicalTag
      ? `${prefix}/${canonicalTag}.${ext}`
      : `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    });

    // Cache in DB if canonical tag provided (AI-generated dish image)
    if (canonicalTag) {
      await cacheDishImage({
        canonical_tag: canonicalTag,
        image_url: blob.url,
        source: "ai_generated",
      });
    }

    // Patch dish image URL in published menu if slug + dishId provided
    if (slug && dishId) {
      const tenant = await getTenantBySlug(slug);
      if (tenant) {
        await patchDishImageUrl(tenant.id, dishId, blob.url);
      }
    }

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("[API] images/upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 },
    );
  }
}
