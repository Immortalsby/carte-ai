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
};

const categoryOrder: MenuCategory[] = [
  "combo",
  "starter",
  "main",
  "side",
  "dessert",
  "drink",
];

interface MenuBrowserProps {
  dishes: Dish[];
  lang: LanguageCode;
  restaurantName: string;
  cuisine?: string;
  tenantId?: string;
}

export function MenuBrowser({ dishes, lang, restaurantName, cuisine, tenantId }: MenuBrowserProps) {
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

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
      <nav className="sticky top-0 z-10 -mx-4 overflow-x-auto px-4 py-2 backdrop-blur-md" style={{ backgroundColor: "color-mix(in srgb, var(--carte-bg) 90%, transparent)" }}>
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
          onClose={() => setSelectedDish(null)}
        />
      )}
    </>
  );
}
