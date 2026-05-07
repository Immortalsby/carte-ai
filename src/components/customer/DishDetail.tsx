"use client";

import { useEffect } from "react";
import type { Dish, LanguageCode, Allergen } from "@/types/menu";

const allergenLabels: Record<Allergen, Record<string, string>> = {
  gluten: { fr: "Gluten", en: "Gluten", zh: "\u9eb8\u8d28" },
  crustaceans: { fr: "Crustac\u00e9s", en: "Crustaceans", zh: "\u7532\u58f3\u7c7b" },
  eggs: { fr: "\u0152ufs", en: "Eggs", zh: "\u9e21\u86cb" },
  fish: { fr: "Poisson", en: "Fish", zh: "\u9c7c\u7c7b" },
  peanuts: { fr: "Arachides", en: "Peanuts", zh: "\u82b1\u751f" },
  soy: { fr: "Soja", en: "Soy", zh: "\u5927\u8c46" },
  milk: { fr: "Lait", en: "Milk", zh: "\u725b\u5976" },
  nuts: { fr: "Fruits \u00e0 coque", en: "Tree nuts", zh: "\u575a\u679c" },
  celery: { fr: "C\u00e9leri", en: "Celery", zh: "\u82b9\u83dc" },
  mustard: { fr: "Moutarde", en: "Mustard", zh: "\u82a5\u672b" },
  sesame: { fr: "S\u00e9same", en: "Sesame", zh: "\u829d\u9ebb" },
  sulphites: { fr: "Sulfites", en: "Sulphites", zh: "\u4e9a\u786b\u9178\u76d0" },
  lupin: { fr: "Lupin", en: "Lupin", zh: "\u7fbd\u6247\u8c46" },
  molluscs: { fr: "Mollusques", en: "Molluscs", zh: "软体动物" },
  alcohol: { fr: "Alcool", en: "Alcohol", zh: "酒精" },
  unknown: { fr: "Inconnu", en: "Unknown", zh: "未知" },
};

interface DishDetailProps {
  dish: Dish;
  lang: LanguageCode;
  onClose: () => void;
}

export function DishDetail({ dish, lang, onClose }: DishDetailProps) {
  const name = dish.name[lang] || dish.name.en || dish.name.fr;
  const desc = dish.description[lang] || dish.description.en || dish.description.fr;
  const price = (dish.priceCents / 100).toFixed(2);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="button"
        tabIndex={0}
        aria-label="Close"
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg animate-slide-up rounded-t-2xl border-t border-carte-border px-5 pb-8 pt-4" style={{ backgroundColor: "var(--carte-bg)" }}>
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-carte-border" />

        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-carte-text">{name}</h2>
          <span className="text-lg font-bold tabular-nums text-carte-primary">&euro;{price}</span>
        </div>

        {desc && (
          <p className="mt-2 text-sm text-carte-text-muted">{desc}</p>
        )}

        {/* Ingredients */}
        {dish.ingredients.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-carte-text-dim">
              {lang === "zh" ? "\u98df\u6750" : lang === "fr" ? "Ingr\u00e9dients" : "Ingredients"}
            </h3>
            <p className="mt-1 text-sm text-carte-text-muted">
              {dish.ingredients.join(", ")}
            </p>
          </div>
        )}

        {/* Allergens */}
        {dish.allergens.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-carte-text-dim">
              {lang === "zh" ? "\u8fc7\u654f\u539f" : lang === "fr" ? "Allerg\u00e8nes" : "Allergens"}
            </h3>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {dish.allergens.map((a) => {
                const isUnknown = a === "unknown";
                return (
                  <span
                    key={a}
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={
                      isUnknown
                        ? {
                            backgroundColor: "color-mix(in srgb, var(--carte-warning) 20%, transparent)",
                            color: "var(--carte-warning)",
                          }
                        : {
                            backgroundColor: "var(--carte-surface)",
                            color: "var(--carte-text-muted)",
                          }
                    }
                  >
                    {isUnknown ? "\u26a0\ufe0f " : ""}
                    {allergenLabels[a][lang] || allergenLabels[a].en}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Calories */}
        <div className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-carte-text-dim">
            {lang === "zh" ? "\u5361\u8def\u91cc" : lang === "fr" ? "Calories" : "Calories"}
          </h3>
          <p className="mt-1 text-sm text-carte-text-muted">
            {dish.caloriesKcal
              ? `${dish.caloriesKcal} kcal`
              : lang === "zh"
                ? "\u672a\u63d0\u4f9b"
                : lang === "fr"
                  ? "Non fourni"
                  : "Not provided"}
          </p>
        </div>

        {/* Spice level */}
        {dish.spiceLevel > 0 && (
          <div className="mt-3 text-sm text-carte-text-muted">
            {lang === "zh" ? "\u8fa3\u5ea6" : lang === "fr" ? "Piquant" : "Spice"}: {"\ud83c\udf36\ufe0f".repeat(dish.spiceLevel)}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-carte-bg active:opacity-80"
          style={{ backgroundColor: "var(--carte-primary)" }}
        >
          {lang === "zh" ? "\u5173\u95ed" : lang === "fr" ? "Fermer" : "Close"}
        </button>
      </div>
    </div>
  );
}
