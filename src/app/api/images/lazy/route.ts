import { NextResponse } from "next/server";
import { z } from "zod";
import { getDishImage } from "@/lib/db/queries/images";
import { generateCanonicalTag } from "@/lib/canonical-tag";
import { patchDishImageUrl } from "@/lib/db/queries/menus";

const schema = z.object({
  name: z.object({
    en: z.string().optional(),
    fr: z.string().optional(),
    zh: z.string().optional(),
  }),
  cuisine: z.string().optional(),
  /** Optional: if provided, the imageUrl is written back into the menu JSON */
  dishId: z.string().optional(),
  tenantId: z.string().optional(),
});

/**
 * Public endpoint — no auth required.
 * Called by the customer-facing DishCard to lazily load cached images.
 *
 * IMPORTANT: This endpoint only checks the DB cache — it does NOT trigger
 * AI generation. Image generation should only happen from the admin side
 * (batch on publish, or manual generate buttons) to avoid runaway costs.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);

    const tag = generateCanonicalTag(
      parsed.name as { en?: string; fr?: string; zh?: string },
      parsed.cuisine,
    );
    const cached = await getDishImage(tag);

    if (!cached) {
      return NextResponse.json({ imageUrl: null });
    }

    // Write back to menu payload so next page load skips this call
    if (parsed.dishId && parsed.tenantId) {
      patchDishImageUrl(parsed.tenantId, parsed.dishId, cached.image_url).catch(
        (err) => console.error("[LazyImage] patch failed:", err),
      );
    }

    return NextResponse.json({ imageUrl: cached.image_url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ imageUrl: null }, { status: 400 });
    }
    console.error("[API] images/lazy error:", error);
    return NextResponse.json({ imageUrl: null }, { status: 500 });
  }
}
