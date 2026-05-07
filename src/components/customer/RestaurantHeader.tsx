import type { LanguageCode } from "@/types/menu";

interface RestaurantHeaderProps {
  name: string;
  cuisineType?: string | null;
  rating?: string | null;
  address?: string | null;
  lang: LanguageCode;
}

const cuisineLabels: Record<string, Record<string, string>> = {
  // With _restaurant suffix
  chinese_restaurant: { en: "Chinese", fr: "Chinois", zh: "\u4e2d\u9910" },
  french_restaurant: { en: "French", fr: "Fran\u00e7ais", zh: "\u6cd5\u9910" },
  indian_restaurant: { en: "Indian", fr: "Indien", zh: "\u5370\u5ea6\u83dc" },
  italian_restaurant: { en: "Italian", fr: "Italien", zh: "\u610f\u5927\u5229\u83dc" },
  japanese_restaurant: { en: "Japanese", fr: "Japonais", zh: "\u65e5\u672c\u6599\u7406" },
  korean_restaurant: { en: "Korean", fr: "Cor\u00e9en", zh: "\u97e9\u56fd\u6599\u7406" },
  thai_restaurant: { en: "Thai", fr: "Tha\u00eflandais", zh: "\u6cf0\u56fd\u83dc" },
  mexican_restaurant: { en: "Mexican", fr: "Mexicain", zh: "\u58a8\u897f\u54e5\u83dc" },
  mediterranean_restaurant: { en: "Mediterranean", fr: "M\u00e9diterran\u00e9en", zh: "\u5730\u4e2d\u6d77\u83dc" },
  vietnamese_restaurant: { en: "Vietnamese", fr: "Vietnamien", zh: "\u8d8a\u5357\u83dc" },
  // Without suffix (DB formats)
  chinese: { en: "Chinese", fr: "Chinois", zh: "\u4e2d\u9910" },
  french: { en: "French", fr: "Fran\u00e7ais", zh: "\u6cd5\u9910" },
  indian: { en: "Indian", fr: "Indien", zh: "\u5370\u5ea6\u83dc" },
  italian: { en: "Italian", fr: "Italien", zh: "\u610f\u5927\u5229\u83dc" },
  japanese: { en: "Japanese", fr: "Japonais", zh: "\u65e5\u672c\u6599\u7406" },
  japanese_fusion: { en: "Japanese Fusion", fr: "Fusion japonaise", zh: "\u65e5\u5f0f\u878d\u5408" },
  korean: { en: "Korean", fr: "Cor\u00e9en", zh: "\u97e9\u56fd\u6599\u7406" },
  thai: { en: "Thai", fr: "Tha\u00eflandais", zh: "\u6cf0\u56fd\u83dc" },
  mexican: { en: "Mexican", fr: "Mexicain", zh: "\u58a8\u897f\u54e5\u83dc" },
  mediterranean: { en: "Mediterranean", fr: "M\u00e9diterran\u00e9en", zh: "\u5730\u4e2d\u6d77\u83dc" },
  vietnamese: { en: "Vietnamese", fr: "Vietnamien", zh: "\u8d8a\u5357\u83dc" },
  sichuan: { en: "Sichuan", fr: "Sichuan", zh: "\u5ddd\u83dc" },
  cantonese: { en: "Cantonese", fr: "Cantonais", zh: "\u7ca4\u83dc" },
};

function getCuisineLabel(cuisineType: string, lang: LanguageCode): string {
  const labels = cuisineLabels[cuisineType];
  if (labels) {
    return labels[lang] || labels.en || cuisineType.replace(/_restaurant$/, "").replace(/_/g, " ");
  }
  return cuisineType.replace(/_restaurant$/, "").replace(/_/g, " ");
}

export function RestaurantHeader({
  name,
  cuisineType,
  rating,
  address,
  lang,
}: RestaurantHeaderProps) {
  const showRating = rating && parseFloat(rating) >= 4.5;

  return (
    <header className="relative overflow-hidden rounded-2xl bg-carte-surface px-5 py-6 text-center">
      {/* Glow background effect */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, var(--carte-glow) 0%, transparent 70%)",
        }}
      />

      {/* Layer 1: Restaurant name */}
      <h1 className="relative text-[1.75rem] font-bold leading-tight text-carte-text">
        {name}
      </h1>

      {/* Layer 2: Cuisine + Rating */}
      {(cuisineType || showRating) && (
        <p className="relative mt-1.5 flex items-center justify-center gap-2 text-sm">
          {cuisineType && (
            <span className="font-medium capitalize text-carte-primary">
              {getCuisineLabel(cuisineType, lang)}
            </span>
          )}
          {showRating && (
            <span className="inline-flex items-center gap-0.5 text-carte-accent">
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {rating}
            </span>
          )}
        </p>
      )}

      {/* Layer 3: Address */}
      {address && (
        <p className="relative mt-1 text-xs text-carte-text-dim">{address}</p>
      )}
    </header>
  );
}
