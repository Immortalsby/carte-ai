"use client";

import { useState, useEffect } from "react";
import type { Dish, LanguageCode, Allergen, DietaryTag } from "@/types/menu";
import { getDictionary } from "@/lib/i18n";

const allergenEmoji: Record<Allergen, string> = {
  gluten: "\ud83c\udf3e",
  crustaceans: "\ud83e\udd90",
  eggs: "\ud83e\udd5a",
  fish: "\ud83d\udc1f",
  peanuts: "\ud83e\udd5c",
  soy: "\ud83e\udeed",
  milk: "\ud83e\udd5b",
  nuts: "\ud83c\udf30",
  celery: "\ud83e\udd6c",
  mustard: "\ud83d\udfe1",
  sesame: "\u26aa",
  sulphites: "\ud83c\udf77",
  lupin: "\ud83c\udf3f",
  molluscs: "\ud83d\udc1a",
  alcohol: "\ud83c\udf77",
  unknown: "\u2753",
};

const dietaryBadge: Partial<Record<DietaryTag, { label: string; cls: string }>> = {
  halal_possible: { label: "Halal", cls: "bg-emerald-500/20 text-emerald-600" },
  vegetarian: { label: "V", cls: "bg-carte-success/20 text-carte-success" },
  vegan: { label: "VG", cls: "bg-carte-success/30 text-carte-success" },
  spicy: { label: "\ud83c\udf36", cls: "bg-carte-danger/20 text-carte-danger" },
  signature: { label: "\u2605", cls: "bg-carte-primary/20 text-carte-primary" },
  popular: { label: "\ud83d\udd25", cls: "bg-carte-accent/20 text-carte-accent" },
};

interface DishCardProps {
  dish: Dish;
  lang: LanguageCode;
  cuisine?: string;
  tenantId?: string;
  onTap?: (dish: Dish) => void;
}

export function DishCard({ dish, lang, cuisine, tenantId, onTap }: DishCardProps) {
  const t = getDictionary(lang);
  const name = dish.name[lang] || dish.name.en || dish.name.fr;
  const desc = dish.description[lang] || dish.description.en || dish.description.fr;
  const price = (dish.priceCents / 100).toFixed(2);
  const [lazyImage, setLazyImage] = useState<string | null>(null);

  // Lazy-load image if dish has no imageUrl
  useEffect(() => {
    if (dish.imageUrl || lazyImage) return;
    const dishName = dish.name.en || dish.name.fr || dish.name.zh;
    if (!dishName) return;

    let cancelled = false;
    fetch("/api/images/lazy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: dish.name,
        cuisine,
        dishId: dish.id,
        tenantId,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.imageUrl) setLazyImage(data.imageUrl);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [dish.id, dish.imageUrl, dish.name, cuisine, tenantId, lazyImage]);

  const displayImage = dish.imageUrl || lazyImage;

  return (
    <button
      type="button"
      onClick={() => onTap?.(dish)}
      className="flex w-full items-start gap-3 rounded-xl border border-carte-border bg-carte-surface p-3 text-left transition-all hover:bg-carte-surface-hover active:scale-[0.99]"
    >
      {/* Dish image with AI badge (FR24) */}
      {displayImage ? (
        <div className="relative h-16 w-16 md:h-20 md:w-20 shrink-0 overflow-hidden rounded-lg">
          <img
            src={displayImage}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {/* AI Generated badge (FR24) */}
          {displayImage.includes("dish-images/") && (
            <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-center text-[7px] leading-tight text-white/80">
              {t.aiGenerated}
            </span>
          )}
        </div>
      ) : (
        <div className="h-16 w-16 md:h-20 md:w-20 shrink-0 animate-pulse rounded-lg bg-carte-border" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-sm font-semibold text-carte-text">{name}</h3>
          {dish.dietaryTags.map((tag) => {
            const badge = dietaryBadge[tag];
            if (!badge) return null;
            return (
              <span
                key={tag}
                className={`inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badge.cls}`}
              >
                {badge.label}
              </span>
            );
          })}
        </div>

        {desc && (
          <p className="mt-0.5 line-clamp-2 text-xs text-carte-text-muted">{desc}</p>
        )}

        {/* Show concrete allergens as emoji chips; show a subtle hint when only "unknown" */}
        {dish.allergens.filter((a) => a !== "unknown").length > 0 ? (
          <div className="mt-1 flex items-center gap-0.5">
            {dish.allergens
              .filter((a) => a !== "unknown")
              .map((a) => (
                <span key={a} className="text-xs" title={a}>
                  {allergenEmoji[a]}
                </span>
              ))}
          </div>
        ) : dish.allergens.includes("unknown") ? (
          <p className="mt-1 text-[10px] text-carte-text-dim">
            {t.allergensAskStaff}
          </p>
        ) : null}
      </div>

      <span className="shrink-0 text-sm font-bold tabular-nums text-carte-primary">
        &euro;{price}
      </span>
    </button>
  );
}
