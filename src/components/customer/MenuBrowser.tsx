"use client";

import { useState, useRef } from "react";
import type { Dish, LanguageCode, MenuCategory } from "@/types/menu";
import { DishCard } from "./DishCard";
import { DishDetail } from "./DishDetail";

const categoryLabels: Record<MenuCategory, Record<string, string>> = {
  starter: { fr: "Entrées", en: "Starters", zh: "前菜" },
  main: { fr: "Plats", en: "Mains", zh: "主菜" },
  side: { fr: "Accompagnements", en: "Sides", zh: "配菜" },
  dessert: { fr: "Desserts", en: "Desserts", zh: "甜点" },
  drink: { fr: "Boissons", en: "Drinks", zh: "饮品" },
  combo: { fr: "Formules", en: "Combos", zh: "套餐" },
  sharing: { fr: "À partager", en: "Sharing", zh: "分享" },
  soup: { fr: "Soupes", en: "Soups", zh: "汤品" },
  pasta: { fr: "Pâtes", en: "Pasta", zh: "意面" },
  wine: { fr: "Vins", en: "Wines", zh: "葡萄酒" },
  cocktail: { fr: "Cocktails", en: "Cocktails", zh: "鸡尾酒" },
  brunch: { fr: "Brunch", en: "Brunch", zh: "早午餐" },
};

const defaultCategoryOrder: MenuCategory[] = [
  "combo",
  "starter",
  "soup",
  "main",
  "pasta",
  "sharing",
  "side",
  "dessert",
  "brunch",
  "drink",
  "wine",
  "cocktail",
];

const drinksCategoryOrder: MenuCategory[] = [
  "sharing",
  "wine",
  "cocktail",
  "drink",
  "combo",
  "starter",
  "soup",
  "main",
  "pasta",
  "side",
  "dessert",
  "brunch",
];

interface MenuBrowserProps {
  dishes: Dish[];
  lang: LanguageCode;
  restaurantName: string;
  cuisine?: string;
  tenantId?: string;
  tenantSlug?: string;
  drinksMode?: boolean;
}

export function MenuBrowser({ dishes, lang, restaurantName, cuisine, tenantId, tenantSlug, drinksMode }: MenuBrowserProps) {
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const categoryOrder = drinksMode ? drinksCategoryOrder : defaultCategoryOrder;

  // Group dishes by category
  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      items: dishes.filter((d) => d.category === cat && d.available),
    }))
    .filter((g) => g.items.length > 0);

  const scrollTo = (cat: string) => {
    sectionRefs.current[cat]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* Category tabs — sticky */}
      <nav className="sticky top-0 z-10 -mx-4 overflow-x-auto px-4 py-2 backdrop-blur-sm" style={{ backgroundColor: "color-mix(in srgb, var(--carte-bg) 96%, transparent)" }}>
        <div className="flex gap-2">
          {grouped.map(({ category }) => (
            <button
              key={category}
              type="button"
              onClick={() => scrollTo(category)}
              className="shrink-0 rounded-full border border-carte-border px-3 py-1 text-xs font-medium text-carte-text-muted transition-colors hover:bg-carte-surface hover:text-carte-primary"
            >
              {categoryLabels[category][lang] || categoryLabels[category].en}
            </button>
          ))}
        </div>
      </nav>

      {/* Dish sections */}
      <div className="mt-2 space-y-6">
        {grouped.map(({ category, items }) => (
          <section
            key={category}
            ref={(el) => { sectionRefs.current[category] = el; }}
          >
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-carte-text-dim">
              {categoryLabels[category][lang] || categoryLabels[category].en}
            </h2>
            <div className="space-y-2">
              {items.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  lang={lang}
                  cuisine={cuisine}
                  tenantId={tenantId}
                  onTap={setSelectedDish}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Dish detail drawer */}
      {selectedDish && (
        <DishDetail
          dish={selectedDish}
          lang={lang}
          cuisine={cuisine}
          tenantSlug={tenantSlug}
          onClose={() => setSelectedDish(null)}
        />
      )}
    </>
  );
}
