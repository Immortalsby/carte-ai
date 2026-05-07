import type { Allergen, DietaryTag, LanguageCode } from "./menu";

export type RecommendationMode =
  | "not_sure"
  | "cheap"
  | "healthy"
  | "first_time"
  | "signature"
  | "sharing";

/** Dining occasion determines dish composition in set recommendations */
export type DiningOccasion = "drinks" | "meal" | "feast";

export interface RecommendationRequest {
  language: LanguageCode;
  budgetCents?: number;
  mode: RecommendationMode;
  occasion?: DiningOccasion;
  partySize: 1 | 2 | 3 | 4;
  excludedTags: DietaryTag[];
  excludedAllergens: Allergen[];
  maxSpiceLevel?: 0 | 1 | 2 | 3;
  userText?: string;
}

export interface RecommendationItem {
  id: string;
  type: "single_dish" | "combo" | "set";
  dishIds: string[];
  title: string;
  totalPriceCents: number;
  reason: string;
  healthNote?: string;
  budgetNote?: string;
  allergenWarning?: string;
  confidence: number;
}

export interface RecommendationResponse {
  recommendations: RecommendationItem[];
  fallbackUsed: boolean;
  safetyNotice: string;
}
