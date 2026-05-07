"use client";

/**
 * CuisineLoader — cuisine-themed wait animation during recommendation generation.
 *
 * Phase 1: CSS-based animated icons per cuisine type.
 * Future: swap in Lottie animations (lottie-react) per cuisine for richer visuals.
 */

const cuisineEmoji: Record<string, string> = {
  chinese_restaurant: "\ud83e\udd62",   // chopsticks
  chinese: "\ud83e\udd62",
  french_restaurant: "\ud83c\udf77",    // wine
  french: "\ud83c\udf77",
  indian_restaurant: "\ud83c\udf5b",    // curry
  indian: "\ud83c\udf5b",
  italian_restaurant: "\ud83c\udf55",   // pizza
  italian: "\ud83c\udf55",
  japanese_restaurant: "\ud83c\udf63",  // sushi
  japanese: "\ud83c\udf63",
  korean_restaurant: "\ud83e\udd58",    // pot
  korean: "\ud83e\udd58",
  thai_restaurant: "\ud83c\udf36\ufe0f", // chili
  thai: "\ud83c\udf36\ufe0f",
  mexican_restaurant: "\ud83c\udf2e",   // taco
  mexican: "\ud83c\udf2e",
  mediterranean_restaurant: "\ud83e\uddc0", // cheese
  mediterranean: "\ud83e\uddc0",
  vietnamese_restaurant: "\ud83c\udf5c", // noodles
  vietnamese: "\ud83c\udf5c",
  lebanese_restaurant: "\ud83e\uddc6",   // falafel
  lebanese: "\ud83e\uddc6",
  moroccan_restaurant: "\ud83c\udf72",   // pot of food (tagine)
  moroccan: "\ud83c\udf72",
  turkish_restaurant: "\ud83c\udf56",    // meat on bone (kebab)
  turkish: "\ud83c\udf56",
  greek_restaurant: "\ud83e\udd57",      // salad
  greek: "\ud83e\udd57",
  spanish_restaurant: "\ud83e\udd58",    // paella pan
  spanish: "\ud83e\udd58",
  brazilian_restaurant: "\ud83c\udf56",  // meat on bone (churrasco)
  brazilian: "\ud83c\udf56",
  peruvian_restaurant: "\ud83d\udc1f",   // fish (ceviche)
  peruvian: "\ud83d\udc1f",
  caribbean_restaurant: "\ud83c\udf34",  // palm tree
  caribbean: "\ud83c\udf34",
  african_restaurant: "\ud83c\udf72",    // pot of food
  african: "\ud83c\udf72",
  fusion: "\u2728",                      // sparkles
};

interface CuisineLoaderProps {
  cuisineType?: string | null;
  message?: string;
}

export function CuisineLoader({ cuisineType, message }: CuisineLoaderProps) {
  const emoji = (cuisineType && cuisineEmoji[cuisineType]) || "\ud83c\udf74"; // fork & knife default

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="relative">
        {/* Glow ring */}
        <div
          className="absolute inset-0 animate-pulse rounded-full blur-md"
          style={{ backgroundColor: "var(--carte-glow)" }}
        />
        {/* Spinning emoji */}
        <div className="relative animate-bounce text-4xl" style={{ animationDuration: "1.2s" }}>
          {emoji}
        </div>
      </div>
      {message && (
        <p className="text-xs text-carte-text-muted">{message}</p>
      )}
    </div>
  );
}
