import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getOrGenerateDishImage } from "@/lib/dish-image-service";

const schema = z.object({
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
    const { dishes } = schema.parse(body);

    // Process sequentially with delay — Pollinations free tier allows 1 req / 15s
    const results: Record<string, string> = {};
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
          results[dish.id] = result.imageUrl;
        }
        // If this was a fresh AI generation (not cached), wait before next request
        if (result?.isNew && result.source === "ai_generated" && i < dishes.length - 1) {
          await new Promise((r) => setTimeout(r, 16_000));
        }
      } catch (err) {
        console.error(`[BatchImages] Failed for ${dish.id}:`, err);
      }
    }

    return NextResponse.json({ images: results });
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
