"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Dish, RestaurantMenu, MenuCategory, Allergen } from "@/types/menu";
import { useToast } from "@/components/ui/Toast";
import type { AdminLocale } from "@/lib/admin-i18n";
import { getAdminDict } from "@/lib/admin-i18n";

const categoryOrder: MenuCategory[] = [
  "combo", "brunch", "sharing", "starter", "soup", "main", "pasta",
  "side", "dessert", "drink", "wine", "cocktail",
];

interface MenuEditorProps {
  menu: RestaurantMenu;
  slug: string;
  version: number;
  cuisine?: string;
  locale?: AdminLocale;
  onReImport?: () => void;
}

export function MenuEditor({ menu: initialMenu, slug, version, cuisine, locale = "en", onReImport }: MenuEditorProps) {
  const t = getAdminDict(locale);
  const tAny = t as unknown as Record<string, string>;
  const categoryLabels: Record<MenuCategory, string> = {
    starter: t.catStarter, main: t.catMain, side: t.catSide,
    dessert: t.catDessert, drink: t.catDrink, combo: t.catCombo,
    sharing: tAny.catSharing, soup: tAny.catSoup, pasta: tAny.catPasta,
    wine: tAny.catWine, cocktail: tAny.catCocktail, brunch: tAny.catBrunch,
  };
  const [menu, setMenu] = useState<RestaurantMenu>(initialMenu);
  const [editingDish, setEditingDish] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [pendingImageGen, setPendingImageGen] = useState<{ count: number; time: number } | null>(null);
  const [imageGenProgress, setImageGenProgress] = useState<{ current: number; total: number; failed: number } | null>(null);
  const imageGenAbortRef = useRef(false);
  // Drag-to-move state
  const [movingDishId, setMovingDishId] = useState<string | null>(null);
  const [dragOverCat, setDragOverCat] = useState<MenuCategory | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Close add-dish dropdown on outside click
  useEffect(() => {
    if (!showAddMenu) return;
    function handleClick(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showAddMenu]);

  const cancelLongPress = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    pointerStartRef.current = null;
  }, []);

  function handleDishPointerDown(dishId: string, e: React.PointerEvent) {
    if (e.button !== 0 || editingDish) return;
    // If already in move mode, clicking the same dish cancels
    if (movingDishId) {
      if (movingDishId === dishId) {
        setMovingDishId(null);
        setDragOverCat(null);
      }
      return;
    }
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    longPressRef.current = setTimeout(() => {
      setMovingDishId(dishId);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  }

  function handleDishPointerMove(e: React.PointerEvent) {
    if (!pointerStartRef.current || movingDishId) return;
    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    if (dx > 8 || dy > 8) cancelLongPress();
  }

  function handleDishPointerUp() {
    cancelLongPress();
  }

  function moveDishToCategory(cat: MenuCategory) {
    if (!movingDishId) return;
    const dish = menu.dishes.find((d) => d.id === movingDishId);
    if (dish && dish.category !== cat) {
      updateDish(movingDishId, { category: cat });
      toast(`${tAny.movedTo || "Moved to"} ${categoryLabels[cat]}`, "success");
    }
    setMovingDishId(null);
    setDragOverCat(null);
  }

  function updateDish(dishId: string, updates: Partial<Dish>) {
    setMenu((prev) => ({
      ...prev,
      dishes: prev.dishes.map((d) =>
        d.id === dishId ? { ...d, ...updates } : d,
      ),
    }));
    setSaved(false);
  }

  function deleteDish(dishId: string) {
    if (confirmingDelete !== dishId) {
      setConfirmingDelete(dishId);
      return;
    }
    setConfirmingDelete(null);
    setMenu((prev) => ({
      ...prev,
      dishes: prev.dishes.filter((d) => d.id !== dishId),
    }));
    setEditingDish(null);
    setSaved(false);
  }

  function addDish(category: MenuCategory) {
    const id = `new-${Date.now()}`;
    const newDish: Dish = {
      id,
      category,
      name: { zh: "", fr: "", en: "" },
      description: { zh: "", fr: "", en: "" },
      priceCents: 0,
      currency: "EUR",
      ingredients: [],
      allergens: ["unknown"],
      dietaryTags: [],
      spiceLevel: 0,
      available: true,
    };
    setMenu((prev) => ({ ...prev, dishes: [...prev.dishes, newDish] }));
    setEditingDish(id);
    setSaved(false);
  }

  function toggleAvailability(dishId: string) {
    const dish = menu.dishes.find((d) => d.id === dishId);
    if (dish) updateDish(dishId, { available: !dish.available });
  }

  async function generateImages() {
    const dishesWithoutImages = menu.dishes.filter(
      (d) => !d.imageUrl && (d.name.fr || d.name.en || d.name.zh),
    );
    if (dishesWithoutImages.length === 0) return;

    imageGenAbortRef.current = false;
    setImageGenProgress({ current: 0, total: dishesWithoutImages.length, failed: 0 });
    let failed = 0;

    for (let i = 0; i < dishesWithoutImages.length; i++) {
      if (imageGenAbortRef.current) break;
      const dish = dishesWithoutImages[i];
      setImageGenProgress({ current: i + 1, total: dishesWithoutImages.length, failed });

      try {
        const res = await fetch("/api/images/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: dish.name,
            description: dish.description.en || dish.description.fr || undefined,
            cuisine,
            ingredients: dish.ingredients,
            source: "auto",
            slug,
            dishId: dish.id,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          // Update local state so UI reflects the new image immediately
          setMenu((prev) => ({
            ...prev,
            dishes: prev.dishes.map((d) =>
              d.id === dish.id ? { ...d, imageUrl: data.imageUrl } : d,
            ),
          }));
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setImageGenProgress(null);
    if (imageGenAbortRef.current) {
      toast(t.imageGenStopped, "info");
    } else if (failed === 0) {
      toast(t.imageGenComplete, "success");
    } else {
      toast(t.imageGenPartial(dishesWithoutImages.length - failed, dishesWithoutImages.length), "info");
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/menus/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...menu,
          updatedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setSaved(true);
        toast(t.menuPublished, "success");
        // Prompt to generate images for dishes that don't have one
        const missing = menu.dishes.filter(
          (d) => !d.imageUrl && (d.name.fr || d.name.en || d.name.zh),
        );
        if (missing.length > 0) {
          const estimatedTime = Math.ceil((missing.length * 16) / 60);
          setPendingImageGen({ count: missing.length, time: estimatedTime });
        }
      } else {
        const err = await res.json();
        toast(`${t.saveFailed}: ${err.error || ""}`);
      }
    } catch {
      toast(t.networkError);
    } finally {
      setSaving(false);
    }
  }

  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      items: menu.dishes.filter((d) => d.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div>
      {/* Image generation progress banner */}
      {imageGenProgress && (
        <div className="mb-4 rounded-lg border border-purple-300 bg-purple-50 px-4 py-3 dark:border-purple-700 dark:bg-purple-900/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
              {t.imageGenProgressLabel(imageGenProgress.current, imageGenProgress.total)}
            </span>
            <button
              type="button"
              onClick={() => { imageGenAbortRef.current = true; }}
              className="rounded-md px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              {t.imageGenStop}
            </button>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-purple-200 dark:bg-purple-800">
            <div
              className="h-full rounded-full bg-purple-600 transition-all duration-500"
              style={{ width: `${(imageGenProgress.current / imageGenProgress.total) * 100}%` }}
            />
          </div>
          {imageGenProgress.failed > 0 && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {imageGenProgress.failed} {t.imageGenFailedCount}
            </p>
          )}
        </div>
      )}
      {/* Image generation confirmation banner */}
      {pendingImageGen && !imageGenProgress && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-purple-300 bg-purple-50 px-4 py-3 dark:border-purple-700 dark:bg-purple-900/30">
          <span className="text-sm text-purple-800 dark:text-purple-200">
            {(t.generateImagesConfirm as unknown as (c: number, t: number) => string)(pendingImageGen.count, pendingImageGen.time)}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setPendingImageGen(null); generateImages(); }}
              className="rounded-md bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:bg-purple-700"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => setPendingImageGen(null)}
              className="rounded-md px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {/* Header with save */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.menuManagement}</h1>
          <p className="text-sm text-muted-foreground">
            {t.version} {version} &middot; {menu.dishes.length} {t.dishes}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onReImport && (
            <button
              type="button"
              onClick={onReImport}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              {t.reImportMenu}
            </button>
          )}
          {/* Add Dish button with category picker */}
          <div ref={addMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {tAny.addNewDish || "Add Dish"}
            </button>
            {showAddMenu && (
              <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-border bg-card p-1.5 shadow-lg">
                <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {tAny.pickCategory || "Pick a category"}
                </p>
                {categoryOrder.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { addDish(cat); setShowAddMenu(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">+</span>
                    {categoryLabels[cat]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving || saved}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? t.publishing : saved ? t.published : t.publishChanges}
          </button>
        </div>
      </div>

      {/* Category drop zone — shown during drag-to-move */}
      {movingDishId && (
        <div className="sticky top-0 z-30 -mx-4 mb-4 mt-4 border-b border-primary/20 bg-background/95 px-4 py-3 shadow-sm backdrop-blur-sm">
          <p className="mb-2 text-center text-xs text-muted-foreground">
            {tAny.moveDishHint || "Tap a category to move this dish"}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {categoryOrder.map((cat) => {
              const isCurrentCat = menu.dishes.find((d) => d.id === movingDishId)?.category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => moveDishToCategory(cat)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverCat(cat); }}
                  onDragLeave={() => dragOverCat === cat && setDragOverCat(null)}
                  onDrop={(e) => { e.preventDefault(); moveDishToCategory(cat); }}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    dragOverCat === cat
                      ? "scale-110 bg-primary text-primary-foreground shadow-md"
                      : isCurrentCat
                        ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {categoryLabels[cat]}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => { setMovingDishId(null); setDragOverCat(null); }}
            className="mx-auto mt-2 block text-xs text-muted-foreground hover:text-foreground"
          >
            {tAny.cancel || "Cancel"}
          </button>
        </div>
      )}

      {/* Dish list by category */}
      <div className="mt-6 space-y-6">
        {categoryOrder.map((category) => {
          const items = menu.dishes.filter((d) => d.category === category);
          return (
            <section key={category}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {categoryLabels[category]} ({items.length})
              </h2>
              <div className="space-y-2">
                {items.map((dish) => (
                  <div key={dish.id}>
                    <div
                      draggable={movingDishId === dish.id}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", dish.id);
                      }}
                      onDragEnd={() => { setMovingDishId(null); setDragOverCat(null); }}
                      onPointerDown={(e) => handleDishPointerDown(dish.id, e)}
                      onPointerMove={handleDishPointerMove}
                      onPointerUp={handleDishPointerUp}
                      onPointerCancel={handleDishPointerUp}
                      className={`flex items-center justify-between rounded-lg border p-4 transition-all select-none ${
                        movingDishId === dish.id
                          ? "scale-[0.97] opacity-50 ring-2 ring-primary"
                          : movingDishId
                            ? "opacity-70"
                            : ""
                      }`}
                    >
                      {/* Drag grip handle */}
                      <div className="mr-2 flex shrink-0 cursor-grab touch-none items-center text-muted-foreground/40">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
                          <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                          <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
                        </svg>
                      </div>
                      {/* Dish thumbnail */}
                      {dish.imageUrl ? (
                        <img
                          src={dish.imageUrl}
                          alt={dish.name.fr || dish.name.en || ""}
                          className="mr-3 h-12 w-12 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="mr-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                          </svg>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          !movingDishId && setEditingDish(editingDish === dish.id ? null : dish.id)
                        }
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="font-medium">
                          {dish.name.fr || dish.name.en || "(untitled)"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          &euro;{(dish.priceCents / 100).toFixed(2)} &middot;{" "}
                          {dish.allergens.filter((a) => a !== "unknown").join(", ") || t.noAllergensListed}
                        </p>
                      </button>
                      <div className="ml-3 flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleAvailability(dish.id)}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            dish.available
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-red-500/15 text-red-600 dark:text-red-400"
                          }`}
                        >
                          {dish.available ? t.available : t.unavailable}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDish(dish.id)}
                          onBlur={() => confirmingDelete === dish.id && setConfirmingDelete(null)}
                          className={`rounded-full px-2 py-1 text-xs ${confirmingDelete === dish.id ? "bg-red-500 text-white" : "text-red-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"}`}
                          title={t.deleteDish}
                        >
                          {confirmingDelete === dish.id ? t.deleteConfirm : "×"}
                        </button>
                      </div>
                    </div>

                    {/* Inline editor */}
                    {editingDish === dish.id && (
                      <DishEditor
                        dish={dish}
                        cuisine={cuisine}
                        slug={slug}
                        locale={locale}
                        onUpdate={(updates) => updateDish(dish.id, updates)}
                      />
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addDish(category)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/[0.02] py-2.5 text-sm text-primary/70 transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {tAny.addNewDish || "Add Dish"}
              </button>
            </section>
          );
        })}
      </div>

      {/* Bottom publish bar — sticky reminder */}
      {!saved && (
        <div className="sticky bottom-0 mt-6 flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-md dark:border-amber-700 dark:bg-amber-900/30">
          <div className="flex items-center gap-2">
            <span className="text-amber-600 dark:text-amber-400">&#9888;</span>
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {tAny.unpublishedWarning || "You have unpublished changes"}
            </span>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? t.publishing : t.publishChanges}
          </button>
        </div>
      )}
    </div>
  );
}

const allergenOptions: Allergen[] = [
  "gluten", "crustaceans", "eggs", "fish", "peanuts", "soy",
  "milk", "nuts", "celery", "mustard", "sesame", "sulphites",
  "lupin", "molluscs", "alcohol",
];

function DishEditor({
  dish,
  cuisine,
  slug,
  locale = "en",
  onUpdate,
}: {
  dish: Dish;
  cuisine?: string;
  slug?: string;
  locale?: AdminLocale;
  onUpdate: (updates: Partial<Dish>) => void;
}) {
  const t = getAdminDict(locale);
  const tAny = t as unknown as Record<string, string>;
  const categoryLabels: Record<MenuCategory, string> = {
    starter: t.catStarter, main: t.catMain, side: t.catSide,
    dessert: t.catDessert, drink: t.catDrink, combo: t.catCombo,
    sharing: tAny.catSharing, soup: tAny.catSoup, pasta: tAny.catPasta,
    wine: tAny.catWine, cocktail: tAny.catCocktail, brunch: tAny.catBrunch,
  };
  const { toast } = useToast();
  const [flagging, setFlagging] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [describing, setDescribing] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // The primary name is whichever language the owner typed in
  const primaryName = dish.name.fr || dish.name.en || dish.name.zh || "";
  const hasName = primaryName.trim().length > 0;

  async function aiTranslate() {
    if (!hasName) return;
    setTranslating(true);
    try {
      const res = await fetch("/api/ai/dish-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "translate", name: primaryName, cuisine, slug }),
      });
      if (res.ok) {
        const { translations } = await res.json();
        onUpdate({
          name: {
            ...dish.name,
            en: translations.en || dish.name.en,
            fr: translations.fr || dish.name.fr,
            zh: translations.zh || dish.name.zh,
          },
        });
      } else {
        const data = await res.json().catch(() => null);
        toast(data?.error || t.translationFailed);
      }
    } catch {
      toast(t.translationFailed);
    } finally {
      setTranslating(false);
    }
  }

  async function aiDescribe() {
    if (!hasName) return;
    setDescribing(true);
    try {
      const res = await fetch("/api/ai/dish-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "describe", name: primaryName, cuisine, slug }),
      });
      if (res.ok) {
        const { descriptions } = await res.json();
        onUpdate({
          description: {
            ...dish.description,
            en: descriptions.en || dish.description.en,
            fr: descriptions.fr || dish.description.fr,
            zh: descriptions.zh || dish.description.zh,
          },
        });
      } else {
        const data = await res.json().catch(() => null);
        toast(data?.error || t.descriptionFailed);
      }
    } catch {
      toast(t.descriptionFailed);
    } finally {
      setDescribing(false);
    }
  }

  async function generateImage() {
    if (!hasName) return;
    setGeneratingImage(true);
    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: dish.name,
          description: dish.description.en || dish.description.fr || undefined,
          cuisine,
          ingredients: dish.ingredients,
          source: "ai",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate({ imageUrl: data.imageUrl });
        toast(t.aiImageGenerated, "success");
      } else {
        const err = await res.json().catch(() => ({}));
        toast(err.error || t.imageGenFailed);
      }
    } catch {
      toast(t.imageGenFailed);
    } finally {
      setGeneratingImage(false);
    }
  }

  async function flagImage() {
    if (!dish.imageUrl?.includes("dish-images/")) return;
    setFlagging(true);
    try {
      const match = dish.imageUrl.match(/dish-images\/([^.]+)\./);
      const canonicalTag = match?.[1];
      if (!canonicalTag) return;

      const res = await fetch("/api/images/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canonicalTag, action: "regenerate" }),
      });
      if (res.ok) {
        onUpdate({ imageUrl: undefined });
      } else {
        const err = await res.json().catch(() => null);
        toast(err?.error || t.flagFailed);
      }
    } catch {
      toast(t.flagFailed);
    } finally {
      setFlagging(false);
    }
  }

  return (
    <div className="mt-1 rounded-lg border border-dashed p-4 space-y-3">
      {/* Dish name — single input + AI translate button */}
      <div>
        <label className="text-xs text-muted-foreground">
          {t.dishName}
        </label>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={dish.name.fr || dish.name.en || dish.name.zh}
            onChange={(e) => {
              // Detect which field to write to based on existing content or default to fr
              const lang = dish.name.fr
                ? "fr"
                : dish.name.en
                  ? "en"
                  : dish.name.zh
                    ? "zh"
                    : "fr";
              onUpdate({ name: { ...dish.name, [lang]: e.target.value } });
            }}
            placeholder="e.g. Kung Pao Chicken"
            className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
          />
          {hasName && (
            <button
              type="button"
              onClick={aiTranslate}
              disabled={translating}
              className="shrink-0 rounded bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
            >
              {translating ? t.translating : t.aiTranslate}
            </button>
          )}
        </div>
      </div>

      {/* Translated names (read-only preview, editable) */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-muted-foreground">{t.nameFr}</label>
          <input
            type="text"
            value={dish.name.fr}
            onChange={(e) =>
              onUpdate({ name: { ...dish.name, fr: e.target.value } })
            }
            className="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t.nameEn}</label>
          <input
            type="text"
            value={dish.name.en}
            onChange={(e) =>
              onUpdate({ name: { ...dish.name, en: e.target.value } })
            }
            className="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t.nameZh}</label>
          <input
            type="text"
            value={dish.name.zh}
            onChange={(e) =>
              onUpdate({ name: { ...dish.name, zh: e.target.value } })
            }
            className="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
          />
        </div>
      </div>

      {/* Category + Price */}
      <div className="flex gap-3">
        <div className="w-40">
          <label className="text-xs text-muted-foreground">{t.category}</label>
          <select
            value={dish.category}
            onChange={(e) => onUpdate({ category: e.target.value as MenuCategory })}
            className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
          >
            {categoryOrder.map((c) => (
              <option key={c} value={c}>{categoryLabels[c]}</option>
            ))}
          </select>
        </div>
        <div className="w-32">
          <label className="text-xs text-muted-foreground">{t.price}</label>
          <input
            type="number"
            step="0.01"
            value={(dish.priceCents / 100).toFixed(2)}
            onChange={(e) =>
              onUpdate({ priceCents: Math.round(parseFloat(e.target.value) * 100) })
            }
            className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
          />
        </div>
      </div>

      {/* Description with AI generate button */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground">{t.description}</label>
          {hasName && (
            <button
              type="button"
              onClick={aiDescribe}
              disabled={describing}
              className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
            >
              {describing ? t.generating : t.aiGenerate}
            </button>
          )}
        </div>
        <div className="mt-1 grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground">{t.descFr}</label>
            <textarea
              value={dish.description.fr}
              onChange={(e) =>
                onUpdate({
                  description: { ...dish.description, fr: e.target.value },
                })
              }
              rows={2}
              className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">{t.descEn}</label>
            <textarea
              value={dish.description.en}
              onChange={(e) =>
                onUpdate({
                  description: { ...dish.description, en: e.target.value },
                })
              }
              rows={2}
              className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">{t.descZh}</label>
            <textarea
              value={dish.description.zh}
              onChange={(e) =>
                onUpdate({
                  description: { ...dish.description, zh: e.target.value },
                })
              }
              rows={2}
              className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Allergens */}
      <div>
        <label className="text-xs text-muted-foreground">{t.allergens}</label>
        <div className="mt-1 flex flex-wrap gap-1">
          {allergenOptions.map((a) => {
            const active = dish.allergens.includes(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => {
                  const newAllergens = active
                    ? dish.allergens.filter((x) => x !== a)
                    : [...dish.allergens.filter((x) => x !== "unknown"), a];
                  onUpdate({ allergens: newAllergens.length > 0 ? newAllergens : ["unknown"] });
                }}
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active
                    ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>

      {/* Spice level */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">{t.spiceLevel}</label>
        {([0, 1, 2, 3] as const).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onUpdate({ spiceLevel: level })}
            className={`rounded px-2 py-0.5 text-xs ${
              dish.spiceLevel === level
                ? "bg-red-100 text-red-700"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {level === 0 ? t.spiceNone : "\ud83c\udf36\ufe0f".repeat(level)}
          </button>
        ))}
      </div>

      {/* Margin Priority (FR9) */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">{t.marginPriority}</label>
        {([1, 2, 3] as const).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() =>
              onUpdate({
                marginPriority: dish.marginPriority === level ? undefined : level,
              })
            }
            className={`rounded px-2 py-0.5 text-xs ${
              dish.marginPriority === level
                ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {level === 1 ? t.marginLow : level === 2 ? t.marginMedium : t.marginHigh}
          </button>
        ))}
      </div>

      {/* Dish Image Management */}
      <div>
        <label className="text-xs text-muted-foreground">{t.dishImage}</label>
        <div className="mt-1 flex items-start gap-3">
          {/* Image preview or placeholder */}
          {dish.imageUrl ? (
            <div className="relative">
              <img
                src={dish.imageUrl}
                alt={primaryName}
                className="h-24 w-24 rounded-lg object-cover"
              />
              {dish.imageUrl.includes("dish-images/") && (
                <span className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-black/50 px-1 py-0.5 text-center text-[8px] text-white/80">
                  {t.aiGeneratedLabel}
                </span>
              )}
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted">
              <span className="text-2xl text-muted-foreground">📷</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-1.5">
            {/* Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const formData = new FormData();
                  formData.append("file", file);
                  const res = await fetch("/api/images/upload", {
                    method: "POST",
                    body: formData,
                  });
                  if (res.ok) {
                    const { url } = await res.json();
                    onUpdate({ imageUrl: url });
                  } else {
                    toast(t.uploadFailed);
                  }
                } catch {
                  toast(t.uploadFailed);
                } finally {
                  setUploading(false);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="rounded bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/80 disabled:opacity-50"
            >
              {uploading ? t.uploading : t.uploadImage}
            </button>

            {/* AI Generate (Pollinations — free) */}
            {hasName && (
              <button
                type="button"
                onClick={() => generateImage()}
                disabled={generatingImage}
                className="rounded bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
              >
                {generatingImage ? t.generatingImage : t.aiGenerateImage}
              </button>
            )}

            {/* Remove / Flag */}
            {dish.imageUrl && (
              <>
                {dish.imageUrl.includes("dish-images/") && (
                  <button
                    type="button"
                    onClick={flagImage}
                    disabled={flagging}
                    className="rounded bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                  >
                    {flagging ? t.removing : t.regenerate}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onUpdate({ imageUrl: undefined })}
                  className="rounded px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"
                >
                  {t.removeImage}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
