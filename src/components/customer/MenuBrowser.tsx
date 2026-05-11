"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import type { Dish, LanguageCode, MenuCategory } from "@/types/menu";
import { getDictionary } from "@/lib/i18n";
import { DishCard } from "./DishCard";
import { DishDetail } from "./DishDetail";

const categoryDictKey: Record<string, string> = {
  starter: "catStarter",
  main: "catMain",
  side: "catSide",
  dessert: "catDessert",
  drink: "catDrink",
  combo: "catCombo",
  sharing: "catSharing",
  soup: "catSoup",
  pasta: "catPasta",
  wine: "catWine",
  cocktail: "catCocktail",
  brunch: "catBrunch",
};

function getCatLabel(
  t: Record<string, unknown>,
  cat: string,
  lang: string,
  menuLabels?: Record<string, Partial<Record<string, string>>>,
): string {
  // Built-in categories — use i18n dictionary
  const key = categoryDictKey[cat];
  if (key && t[key]) return t[key] as string;
  // Custom categories — check menu-level translated labels
  const translated = menuLabels?.[cat]?.[lang];
  if (translated) return translated;
  // Fallback: capitalize the category slug
  return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ");
}

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
  /** Translated labels for custom categories from menu data */
  categoryLabels?: Record<string, Partial<Record<string, string>>>;
  drinksMode?: boolean;
  openDishId?: string | null;
  onOpenDishIdHandled?: () => void;
  isSaved?: (dishId: string) => boolean;
  onToggleSave?: (dishId: string) => void;
}

export function MenuBrowser({ dishes, lang, restaurantName, cuisine, tenantId, tenantSlug, categoryLabels: menuCategoryLabels, drinksMode, openDishId, onOpenDishIdHandled, isSaved, onToggleSave }: MenuBrowserProps) {
  const t = getDictionary(lang);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const dishCardRefs = useRef<Record<string, HTMLElement | null>>({});

  const builtinOrder = drinksMode ? drinksCategoryOrder : defaultCategoryOrder;
  // Append any custom categories found in dishes (not in built-in list)
  const customCats = [...new Set(dishes.map((d) => d.category))].filter(
    (c) => !builtinOrder.includes(c),
  );
  const categoryOrder = [...builtinOrder, ...customCats];

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

  // External trigger: scroll to a dish and open its detail drawer
  useEffect(() => {
    if (!openDishId) return;
    const dish = dishes.find((d) => d.id === openDishId);
    if (!dish) {
      onOpenDishIdHandled?.();
      return;
    }
    // Scroll to the dish card
    const el = dishCardRefs.current[openDishId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // Open detail drawer after a short delay for scroll
    const timer = setTimeout(() => {
      setSelectedDish(dish);
      onOpenDishIdHandled?.();
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- onOpenDishIdHandled is a callback, not reactive data
  }, [openDishId, dishes]);

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
              {getCatLabel(t as unknown as Record<string, unknown>, category, lang, menuCategoryLabels)}
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
              {getCatLabel(t as unknown as Record<string, unknown>, category, lang, menuCategoryLabels)}
            </h2>
            <div className="space-y-2 md:grid md:grid-cols-2 md:gap-2 md:space-y-0">
              {items.map((dish) => (
                <div key={dish.id} ref={(el) => { dishCardRefs.current[dish.id] = el; }}>
                  <DishCard
                    dish={dish}
                    lang={lang}
                    cuisine={cuisine}
                    tenantId={tenantId}
                    onTap={setSelectedDish}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Dish detail drawer */}
      <AnimatePresence>
        {selectedDish && (
          <DishDetail
            dish={selectedDish}
            lang={lang}
            cuisine={cuisine}
            tenantSlug={tenantSlug}
            onClose={() => setSelectedDish(null)}
            isSaved={isSaved?.(selectedDish.id)}
            onToggleSave={onToggleSave ? () => onToggleSave(selectedDish.id) : undefined}
          />
        )}
      </AnimatePresence>
    </>
  );
}
