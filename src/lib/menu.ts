import defaultMenuData from "../../data/menu.json";
import type { RestaurantMenu } from "@/types/menu";
import { restaurantMenuSchema, allergenSchema, dietaryTagSchema, categorySchema } from "./validation";

const VALID_ALLERGENS = new Set(allergenSchema.options);
const VALID_DIETARY_TAGS = new Set(dietaryTagSchema.options);
const VALID_CATEGORIES = new Set(categorySchema.options);

export function getDefaultMenu(): RestaurantMenu {
  return restaurantMenuSchema.parse(defaultMenuData);
}

export function parseMenu(value: unknown): RestaurantMenu {
  return restaurantMenuSchema.parse(value);
}

/**
 * Sanitize raw AI-extracted menu data by filtering out invalid enum values
 * and applying safe defaults so that Zod strict parsing won't reject the whole menu.
 */
export function sanitizeRawMenu(raw: Record<string, unknown>): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return raw;

  const dishes = Array.isArray(raw.dishes) ? raw.dishes : [];
  return {
    ...raw,
    dishes: dishes.map((dish: Record<string, unknown>) => {
      if (!dish || typeof dish !== "object") return dish;
      return {
        ...dish,
        // Filter invalid category → default to "main"
        category: typeof dish.category === "string" && VALID_CATEGORIES.has(dish.category as never)
          ? dish.category
          : "main",
        // Filter invalid allergens, keep only valid ones
        allergens: Array.isArray(dish.allergens)
          ? dish.allergens.filter((a: unknown) => typeof a === "string" && VALID_ALLERGENS.has(a as never))
          : ["unknown"],
        // Filter invalid dietary tags, keep only valid ones
        dietaryTags: Array.isArray(dish.dietaryTags)
          ? dish.dietaryTags.filter((t: unknown) => typeof t === "string" && VALID_DIETARY_TAGS.has(t as never))
          : [],
        // Ensure spiceLevel is valid
        spiceLevel: [0, 1, 2, 3].includes(dish.spiceLevel as number) ? dish.spiceLevel : 0,
        // Ensure allergens array is not empty
        ...(Array.isArray(dish.allergens) && dish.allergens.filter((a: unknown) => typeof a === "string" && VALID_ALLERGENS.has(a as never)).length === 0
          ? { allergens: ["unknown"] }
          : {}),
      };
    }),
  };
}

export function findDishes(menu: RestaurantMenu, ids: string[]) {
  const byId = new Map(menu.dishes.map((dish) => [dish.id, dish]));
  return ids.flatMap((id) => {
    const dish = byId.get(id);
    return dish ? [dish] : [];
  });
}
