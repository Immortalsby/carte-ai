import defaultMenuData from "../../data/menu.json";
import type { RestaurantMenu } from "@/types/menu";
import { restaurantMenuSchema, allergenSchema, dietaryTagSchema, builtinCategories } from "./validation";

const VALID_ALLERGENS = new Set(allergenSchema.options);
const VALID_DIETARY_TAGS = new Set(dietaryTagSchema.options);
const BUILTIN_CATEGORIES = new Set<string>(builtinCategories);

/** Ensure zh/fr/en are non-empty, using fallbacks if needed */
function sanitizeLocalizedText(
  text: Record<string, string>,
  fallback: { zh: string; fr: string; en: string },
): Record<string, string> {
  return {
    ...text,
    zh: (typeof text.zh === "string" && text.zh) || fallback.zh,
    fr: (typeof text.fr === "string" && text.fr) || fallback.fr,
    en: (typeof text.en === "string" && text.en) || fallback.en,
  };
}

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

  // Sanitize restaurant-level fields
  const restaurant = (raw.restaurant && typeof raw.restaurant === "object")
    ? raw.restaurant as Record<string, unknown>
    : {} as Record<string, unknown>;
  const sanitizedRestaurant = {
    ...restaurant,
    id: (typeof restaurant.id === "string" && restaurant.id) || "imported",
    slug: (typeof restaurant.slug === "string" && restaurant.slug) || "imported",
    name: (typeof restaurant.name === "string" && restaurant.name) || "Imported Menu",
    cuisine: (typeof restaurant.cuisine === "string" && restaurant.cuisine) || "international",
    city: (typeof restaurant.city === "string" && restaurant.city) || "unknown",
    currency: "EUR" as const,
    welcome: (restaurant.welcome && typeof restaurant.welcome === "object")
      ? sanitizeLocalizedText(restaurant.welcome as Record<string, string>, { zh: "欢迎", fr: "Bienvenue", en: "Welcome" })
      : { zh: "欢迎", fr: "Bienvenue", en: "Welcome" },
  };

  const dishes = Array.isArray(raw.dishes) ? raw.dishes : [];
  return {
    ...raw,
    restaurant: sanitizedRestaurant,
    dishes: dishes.map((dish: Record<string, unknown>) => {
      if (!dish || typeof dish !== "object") return dish;

      // Build a fallback name for descriptions
      const dishName = dish.name && typeof dish.name === "object"
        ? dish.name as Record<string, string>
        : { zh: "", fr: "", en: "" };
      const primaryName = dishName.fr || dishName.en || dishName.zh || "Dish";

      return {
        ...dish,
        // Ensure dish has a valid id
        id: (typeof dish.id === "string" && dish.id) || `dish-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        // Sanitize name — ensure zh/fr/en are non-empty
        name: sanitizeLocalizedText(
          dishName,
          { zh: primaryName, fr: primaryName, en: primaryName },
        ),
        // Sanitize description — fill empty with a dash placeholder
        description: dish.description && typeof dish.description === "object"
          ? sanitizeLocalizedText(
              dish.description as Record<string, string>,
              { zh: "-", fr: "-", en: "-" },
            )
          : { zh: "-", fr: "-", en: "-" },
        // Accept any non-empty string as category (supports custom categories like "beef", "lamb")
        category: typeof dish.category === "string" && dish.category.trim()
          ? dish.category.trim().toLowerCase()
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

const CORE_LANGS = new Set(["zh", "fr", "en"]);

/**
 * Strip all non-core (non zh/fr/en) translations from dish names and descriptions.
 * Called before saving a menu so that on-demand translations are regenerated
 * on the next customer visit, staying in sync with updated content.
 */
export function stripNonCoreTranslations(menu: RestaurantMenu): RestaurantMenu {
  return {
    ...menu,
    dishes: menu.dishes.map((dish) => ({
      ...dish,
      name: Object.fromEntries(
        Object.entries(dish.name).filter(([k]) => CORE_LANGS.has(k)),
      ) as typeof dish.name,
      description: Object.fromEntries(
        Object.entries(dish.description).filter(([k]) => CORE_LANGS.has(k)),
      ) as typeof dish.description,
    })),
  };
}

export function findDishes(menu: RestaurantMenu, ids: string[]) {
  const byId = new Map(menu.dishes.map((dish) => [dish.id, dish]));
  return ids.flatMap((id) => {
    const dish = byId.get(id);
    return dish ? [dish] : [];
  });
}
