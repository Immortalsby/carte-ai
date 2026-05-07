import { NextResponse } from "next/server";
import { after } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getOrGenerateDishImage } from "@/lib/dish-image-service";
import { getTenantBySlug } from "@/lib/db/queries/tenants";
import { patchDishImageUrl } from "@/lib/db/queries/menus";

const schema = z.object({
  slug: z.string().min(1),
  dishes: z.array(
    z.object({
      id: z.string(),
      name: z.object({
        en: z.string().optional(),
        fr: z.string().optional(),
        zh: z.string().optional(),
      }),
      description: z.string().optional(),
      cuisine: z.string().optional(),
      ingredients: z.array(z.string()).optional(),
    }),
  ),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, dishes } = schema.parse(body);

    const tenant = await getTenantBySlug(slug);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }
    const tenantId = tenant.id;

    // Return immediately — process images in the background
    after(async () => {
      for (let i = 0; i < dishes.length; i++) {
        const dish = dishes[i];
        try {
          const result = await getOrGenerateDishImage({
            name: dish.name as { en?: string; fr?: string; zh?: string },
            description: dish.description,
            cuisine: dish.cuisine,
            ingredients: dish.ingredients,
          });
          if (result) {
            // Persist each image to DB immediately
            await patchDishImageUrl(tenantId, dish.id, result.imageUrl);
          }
          // Rate limit: Pollinations free tier ~1 req / 15s
          if (result?.isNew && result.source === "ai_generated" && i < dishes.length - 1) {
            await new Promise((r) => setTimeout(r, 16_000));
          }
        } catch (err) {
          console.error(`[BatchImages] Failed for ${dish.id}:`, err);
        }
      }
      console.log(`[BatchImages] Completed ${dishes.length} dishes for tenant ${slug}`);
    });

    return NextResponse.json({
      status: "processing",
      message: `Generating images for ${dishes.length} dishes in the background. Refresh the page to see results.`,
      count: dishes.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", detail: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[API] images/batch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
