import type { LanguageCode } from "@/types/menu";

/**
 * Maps cuisine types (Google Places format) to their "home" language codes.
 * When the user's browser language matches, the system switches to
 * "group meal advisor" mode instead of "foreign tourist" mode (FR16).
 */
const cuisineLanguageMap: Record<string, LanguageCode[]> = {
  chinese_restaurant: ["zh", "zh-Hant"],
  chinese: ["zh", "zh-Hant"],
  japanese_restaurant: ["ja"],
  japanese: ["ja"],
  korean_restaurant: ["ko"],
  korean: ["ko"],
  vietnamese_restaurant: ["vi"],
  vietnamese: ["vi"],
  thai_restaurant: ["th"],
  thai: ["th"],
  indian_restaurant: ["hi"],
  indian: ["hi"],
  french_restaurant: ["fr"],
  french: ["fr"],
  italian_restaurant: ["it"],
  italian: ["it"],
  mexican_restaurant: ["es"],
  mexican: ["es"],
  spanish_restaurant: ["es"],
  spanish: ["es"],
  lebanese_restaurant: ["ar"],
  lebanese: ["ar"],
  moroccan_restaurant: ["ar", "fr"],
  moroccan: ["ar", "fr"],
  turkish_restaurant: ["tr"],
  turkish: ["tr"],
  brazilian_restaurant: ["pt"],
  brazilian: ["pt"],
  peruvian_restaurant: ["es"],
  peruvian: ["es"],
  // Caribbean, African, Mediterranean, Fusion — multi-cultural, no single language match
};

/**
 * Returns true when the user's detected language matches the restaurant's
 * cuisine culture — triggering "group meal advisor" mode (FR16).
 */
export function isCultureMatch(
  userLang: LanguageCode,
  cuisineType: string | null | undefined,
): boolean {
  if (!cuisineType) return false;
  const matchingLangs = cuisineLanguageMap[cuisineType];
  if (!matchingLangs) return false;
  return matchingLangs.includes(userLang);
}
