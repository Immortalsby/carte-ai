/** Re-exported from languages.ts — the single source of truth */
export type { LanguageCode } from "@/lib/languages";
import type { LanguageCode } from "@/lib/languages";

/** Built-in categories — always available */
export type BuiltinCategory =
  | "starter"
  | "main"
  | "side"
  | "dessert"
  | "drink"
  | "combo"
  | "sharing"
  | "soup"
  | "pasta"
  | "wine"
  | "cocktail"
  | "brunch";

/** Restaurants can also add custom categories (e.g. "beef", "lamb", "chicken") */
export type MenuCategory = BuiltinCategory | (string & {});

export type Allergen =
  | "gluten"
  | "crustaceans"
  | "eggs"
  | "fish"
  | "peanuts"
  | "soy"
  | "milk"
  | "nuts"
  | "celery"
  | "mustard"
  | "sesame"
  | "sulphites"
  | "lupin"
  | "molluscs"
  | "alcohol"
  | "unknown";

export type DietaryTag =
  | "vegetarian"
  | "vegan"
  | "halal_possible"
  | "contains_pork"
  | "contains_beef"
  | "contains_seafood"
  | "high_protein"
  | "low_calorie"
  | "healthy"
  | "spicy"
  | "signature"
  | "popular"
  | "good_value"
  | "light"
  | "comfort_food";

export type LocalizedText = Partial<Record<LanguageCode, string>> & {
  zh: string;
  fr: string;
  en: string;
};

export interface Dish {
  id: string;
  category: MenuCategory;
  name: LocalizedText;
  description: LocalizedText;
  priceCents: number;
  currency: "EUR";
  ingredients: string[];
  allergens: Allergen[];
  dietaryTags: DietaryTag[];
  caloriesKcal?: number;
  spiceLevel: 0 | 1 | 2 | 3;
  available: boolean;
  imageUrl?: string;
  marginPriority?: 1 | 2 | 3;
  portionScore?: 1 | 2 | 3;
}

export interface RestaurantMenu {
  restaurant: {
    id: string;
    slug: string;
    name: string;
    cuisine: string;
    city: string;
    currency: "EUR";
    languages: LanguageCode[];
    welcome: LocalizedText;
  };
  dishes: Dish[];
  /** Translated labels for custom categories — key is category slug, value is localized text */
  categoryLabels?: Record<string, Partial<Record<LanguageCode, string>>>;
  updatedAt: string;
}
