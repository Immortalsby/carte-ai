import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dish_images } from "@/lib/db/schema";

export async function getDishImage(canonicalTag: string) {
  const result = await db
    .select()
    .from(dish_images)
    .where(eq(dish_images.canonical_tag, canonicalTag))
    .limit(1);
  return result[0] ?? null;
}

export async function flagDishImage(canonicalTag: string) {
  await db
    .update(dish_images)
    .set({ status: "flagged" })
    .where(eq(dish_images.canonical_tag, canonicalTag));
}

export async function deleteDishImage(canonicalTag: string) {
  await db
    .delete(dish_images)
    .where(eq(dish_images.canonical_tag, canonicalTag));
}

export async function cacheDishImage(data: {
  canonical_tag: string;
  image_url: string;
  source: string;
  attribution?: string;
  prompt_hash?: string;
}) {
  const result = await db
    .insert(dish_images)
    .values(data)
    .onConflictDoUpdate({
      target: dish_images.canonical_tag,
      set: {
        image_url: data.image_url,
        source: data.source,
        attribution: data.attribution,
        status: "active",
      },
    })
    .returning();
  return result[0];
}
