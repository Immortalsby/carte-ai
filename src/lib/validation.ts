import { z } from "zod";
import { supportedLanguageCodes } from "./languages";

export const languageSchema = z.enum(supportedLanguageCodes);
export const categorySchema = z.enum([
  "starter",
  "main",
  "side",
  "dessert",
  "drink",
  "combo",
]);
export const allergenSchema = z.enum([
  "gluten",
  "crustaceans",
  "eggs",
  "fish",
  "peanuts",
  "soy",
  "milk",
  "nuts",
  "celery",
  "mustard",
  "sesame",
  "sulphites",
  "lupin",
  "molluscs",
  "alcohol",
  "unknown",
]);
export const dietaryTagSchema = z.enum([
  "vegetarian",
  "vegan",
  "halal_possible",
  "contains_pork",
  "contains_beef",
  "contains_seafood",
  "high_protein",
  "low_calorie",
  "healthy",
  "spicy",
  "signature",
  "popular",
  "good_value",
  "light",
  "comfort_food",
]);

const localizedTextSchema = z.object({
  zh: z.string().min(1),
  fr: z.string().min(1),
  en: z.string().min(1),
}).catchall(z.string().min(1));

export const dishSchema = z.object({
  id: z.string().min(1),
  category: categorySchema,
  name: localizedTextSchema,
  description: localizedTextSchema,
  priceCents: z.number().int().nonnegative(),
  currency: z.literal("EUR"),
  ingredients: z.array(z.string()),
  allergens: z.array(allergenSchema),
  dietaryTags: z.array(dietaryTagSchema),
  caloriesKcal: z.number().int().positive().optional(),
  spiceLevel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  available: z.boolean(),
  imageUrl: z.string().optional(),
  marginPriority: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  portionScore: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
});

export const restaurantMenuSchema = z.object({
  restaurant: z.object({
    id: z.string().min(1),
    slug: z.string().min(1),
    name: z.string().min(1),
    cuisine: z.string().min(1),
    city: z.string().min(1),
    currency: z.literal("EUR"),
    languages: z.array(languageSchema).min(1),
    welcome: localizedTextSchema,
  }),
  dishes: z.array(dishSchema).min(1),
  updatedAt: z.string().min(1),
});

export const recommendationRequestSchema = z.object({
  language: languageSchema.default("zh"),
  budgetCents: z.number().int().positive().optional(),
  mode: z
    .enum(["not_sure", "cheap", "healthy", "first_time", "signature", "sharing"])
    .default("not_sure"),
  occasion: z.enum(["drinks", "meal", "feast"]).optional(),
  partySize: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).default(1),
  excludedTags: z.array(dietaryTagSchema).default([]),
  excludedAllergens: z.array(allergenSchema).default([]),
  maxSpiceLevel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).optional(),
  userText: z.string().max(500).optional(),
  menu: restaurantMenuSchema.optional(),
});
