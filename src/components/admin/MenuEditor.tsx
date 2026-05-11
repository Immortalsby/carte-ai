"use client";

import { useState, useRef } from "react";
import { Camera } from "@phosphor-icons/react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  MouseSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Dish, RestaurantMenu, MenuCategory, Allergen } from "@/types/menu";
import { useToast } from "@/components/ui/Toast";
import type { AdminLocale } from "@/lib/admin-i18n";
import { getAdminDict } from "@/lib/admin-i18n";
import { buildDishImageUrl, fetchPollinationsImage } from "@/lib/pollinations-client";
import { generateCanonicalTag } from "@/lib/canonical-tag";
import { MenuImporter } from "./MenuImporter";

const builtinCategoryOrder: MenuCategory[] = [
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
  const builtinCategoryLabels: Record<string, string> = {
    starter: t.catStarter, main: t.catMain, side: t.catSide,
    dessert: t.catDessert, drink: t.catDrink, combo: t.catCombo,
    sharing: tAny.catSharing, soup: tAny.catSoup, pasta: tAny.catPasta,
    wine: tAny.catWine, cocktail: tAny.catCocktail, brunch: tAny.catBrunch,
  };
  function getCategoryLabel(cat: string): string {
    return builtinCategoryLabels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ");
  }
  /** Pick dish name matching admin locale, with fallback chain */
  const langOrder: ("fr" | "en" | "zh")[] =
    locale === "zh" ? ["zh", "en", "fr"] : locale === "fr" ? ["fr", "en", "zh"] : ["en", "fr", "zh"];
  function getLocalizedName(name: { fr: string; en: string; zh: string }): string {
    return name[langOrder[0]] || name[langOrder[1]] || name[langOrder[2]] || "";
  }
  const [menu, setMenu] = useState<RestaurantMenu>(initialMenu);
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    // Extract custom categories from existing dishes
    const customs = new Set<string>();
    for (const d of initialMenu.dishes) {
      if (!builtinCategoryOrder.includes(d.category)) customs.add(d.category);
    }
    return [...customs];
  });
  const [editingDish, setEditingDish] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [pendingImageGen, setPendingImageGen] = useState<{ count: number; time: number } | null>(null);
  const [imageGenProgress, setImageGenProgress] = useState<{ current: number; total: number; failed: number } | null>(null);
  const imageGenAbortRef = useRef(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [showMergeImport, setShowMergeImport] = useState(false);
  const { toast } = useToast();

  // Dynamic category list: built-in first, then custom
  const categoryOrder: string[] = [
    ...builtinCategoryOrder,
    ...customCategories.filter((c) => !builtinCategoryOrder.includes(c)),
  ];

  // dnd-kit sensors: mouse only (no touch) to prevent accidental drags on mobile
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
    setEditingDish(null);
    // Lock page scroll while dragging — pills bar is the drop target
    document.body.style.overflow = "hidden";
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragId(null);
    document.body.style.overflow = "";
    if (!over) return;
    const dishId = active.id as string;
    // Drop target can be a category section or a pill (pill-{category})
    const overId = over.id as string;
    const targetCategory = (overId.startsWith("pill-") ? overId.slice(5) : overId) as MenuCategory;
    const dish = menu.dishes.find((d) => d.id === dishId);
    if (dish && dish.category !== targetCategory) {
      updateDish(dishId, { category: targetCategory });
      toast(`${tAny.movedTo || "Moved to"} ${getCategoryLabel(targetCategory)}`, "success");
    }
  }

  const activeDish = activeDragId ? menu.dishes.find((d) => d.id === activeDragId) : null;

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
      name: { zh: "新菜品", fr: "Nouveau plat", en: "New Dish" },
      description: { zh: "-", fr: "-", en: "-" },
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

  function handleMergeImport(draft: RestaurantMenu) {
    const existingKeys = new Set(
      menu.dishes.map((d) =>
        `${d.name.fr || ""}|${d.name.en || ""}|${d.name.zh || ""}`.toLowerCase(),
      ),
    );
    const newDishes = draft.dishes.filter((d) => {
      const key = `${d.name.fr || ""}|${d.name.en || ""}|${d.name.zh || ""}`.toLowerCase();
      return key !== "||" && !existingKeys.has(key);
    });

    if (newDishes.length === 0) {
      toast(tAny.mergeNoDishes || "No new dishes found to add");
      setShowMergeImport(false);
      return;
    }

    setMenu((prev) => ({
      ...prev,
      dishes: [...prev.dishes, ...newDishes],
    }));
    setSaved(false);
    setShowMergeImport(false);
    toast(
      (tAny.mergeSuccess || `${newDishes.length} dishes added`).replace("{count}", String(newDishes.length)),
      "success",
    );
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
        // Build prompt and fetch image directly from Pollinations (browser-side)
        const pollinationsUrl = buildDishImageUrl({
          name: dish.name,
          description: dish.description.en || dish.description.fr || undefined,
          cuisine,
        });
        const imageBlob = await fetchPollinationsImage(pollinationsUrl);

        // Upload blob to server for Vercel Blob storage + DB caching
        const canonicalTag = generateCanonicalTag(dish.name, cuisine);
        const formData = new FormData();
        formData.append("file", imageBlob, `${canonicalTag}.jpg`);
        formData.append("canonicalTag", canonicalTag);
        formData.append("slug", slug);
        formData.append("dishId", dish.id);

        const uploadRes = await fetch("/api/images/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          setMenu((prev) => ({
            ...prev,
            dishes: prev.dishes.map((d) =>
              d.id === dish.id ? { ...d, imageUrl: data.url } : d,
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
    // Build categoryLabels for custom categories
    const catLabels: Record<string, Record<string, string>> = { ...(menu.categoryLabels ?? {}) };
    for (const cat of customCategories) {
      if (!catLabels[cat]) {
        // Use capitalized slug as base label for en/fr/zh
        const label = cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ");
        catLabels[cat] = { en: label, fr: label, zh: label };
      }
    }
    try {
      const res = await fetch(`/api/menus/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...menu,
          categoryLabels: Object.keys(catLabels).length > 0 ? catLabels : undefined,
          updatedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setSaved(true);
        toast(t.menuPublished, "success");
        const missing = menu.dishes.filter(
          (d) => !d.imageUrl && (d.name.fr || d.name.en || d.name.zh),
        );
        if (missing.length > 0) {
          const estimatedTime = Math.ceil((missing.length * 16) / 60);
          setPendingImageGen({ count: missing.length, time: estimatedTime });
        }
      } else {
        const err = await res.json();
        const detail = err.fields?.length
          ? `\n${(err.fields as string[]).slice(0, 5).join("\n")}`
          : "";
        toast(`${t.saveFailed}: ${err.error || ""}${detail}`);
      }
    } catch {
      toast(t.networkError);
    } finally {
      setSaving(false);
    }
  }

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

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.menuManagement}</h1>
          <p className="text-sm text-muted-foreground">
            {t.version} {version} &middot; {menu.dishes.length} {t.dishes}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMergeImport(!showMergeImport)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              showMergeImport
                ? "border-purple-400 bg-purple-50 text-purple-700 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-300"
                : "text-foreground hover:bg-muted"
            }`}
          >
            {tAny.mergeImport || "+ Import & merge"}
          </button>
          {onReImport && (
            <button
              type="button"
              onClick={onReImport}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              {t.reImportMenu}
            </button>
          )}
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

      {/* Merge import panel */}
      {showMergeImport && (
        <div className="mt-4 rounded-xl border border-purple-300 bg-purple-50/50 p-4 dark:border-purple-700 dark:bg-purple-900/20">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-purple-800 dark:text-purple-200">
              {tAny.mergeImportDesc || "Import a file to add dishes to the existing menu. Duplicates will be skipped."}
            </p>
            <button
              type="button"
              onClick={() => setShowMergeImport(false)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <MenuImporter slug={slug} locale={locale} onImported={handleMergeImport} />
        </div>
      )}

      {/* Dish list by category — with dnd-kit drag and drop */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => { setActiveDragId(null); document.body.style.overflow = ""; }}>
        {/* Floating category pills on the left — visible only while dragging */}
        {activeDragId && (
          <div className="fixed left-0 top-1/2 z-50 -translate-y-1/2 flex flex-col gap-2 rounded-r-2xl border border-l-0 border-primary/20 bg-card/95 px-3 py-4 shadow-2xl backdrop-blur">
            {categoryOrder.map((cat) => {
              const draggedDish = menu.dishes.find((d) => d.id === activeDragId);
              const isCurrent = draggedDish?.category === cat;
              return (
                <DroppablePill key={cat} id={`pill-${cat}`} category={cat} isCurrent={isCurrent}>
                  {getCategoryLabel(cat)}
                </DroppablePill>
              );
            })}
          </div>
        )}
        {/* Add custom category — shown above categories on mobile */}
        {!activeDragId && (
          <div className="mt-4 flex items-center gap-2 lg:hidden">
            <input
              type="text"
              placeholder={t.addCategoryPlaceholder}
              className="w-48 rounded-lg border border-dashed border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim().toLowerCase().replace(/\s+/g, "_");
                  if (val && !categoryOrder.includes(val)) {
                    setCustomCategories((prev) => [...prev, val]);
                    setSaved(false);
                  }
                  (e.target as HTMLInputElement).value = "";
                }
              }}
            />
            <span className="text-xs text-muted-foreground">{t.addCategory}</span>
          </div>
        )}
        <div className="mt-6 space-y-6">
          {categoryOrder.map((category) => {
            const items = menu.dishes.filter((d) => d.category === category);
            // Only show categories that have items or are being dragged over
            if (items.length === 0 && !activeDragId) return null;
            return (
              <DroppableCategorySection
                key={category}
                id={category}
                isDragging={!!activeDragId}
              >
                {/* Category header with inline + button */}
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    {getCategoryLabel(category)} ({items.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() => addDish(category)}
                    className="flex items-center gap-1 rounded-full border border-primary/30 px-2.5 py-0.5 text-xs font-medium text-primary/70 transition-colors hover:bg-primary/5 hover:text-primary"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    {tAny.addNewDish || "Add"}
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((dish) => (
                    <DraggableDishCard key={dish.id} id={dish.id}>
                      <div className={`flex items-center justify-between rounded-lg border p-4 transition-all cursor-grab active:cursor-grabbing ${
                        activeDragId === dish.id ? "opacity-30 scale-[0.98]" : ""
                      }`}>
                        {/* Dish thumbnail */}
                        {dish.imageUrl ? (
                          <img
                            src={dish.imageUrl}
                            alt={getLocalizedName(dish.name)}
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
                            setEditingDish(editingDish === dish.id ? null : dish.id)
                          }
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="font-medium">
                            {getLocalizedName(dish.name) || "(untitled)"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            &euro;{(dish.priceCents / 100).toFixed(2)} &middot;{" "}
                            {dish.allergens.filter((a) => a !== "unknown").join(", ") || t.noAllergensListed}
                          </p>
                        </button>
                        <div className="ml-3 flex shrink-0 items-center gap-2">
                          {/* Move to category dropdown */}
                          <MoveToDropdown
                            dish={dish}
                            categoryOrder={categoryOrder}
                            locale={locale}
                            onMove={(targetCategory) => {
                              updateDish(dish.id, { category: targetCategory });
                              toast(`${tAny.movedTo || "Moved to"} ${getCategoryLabel(targetCategory)}`, "success");
                            }}
                            label={tAny.moveToCategory || "Move to…"}
                          />
                          <button
                            type="button"
                            onClick={() => toggleAvailability(dish.id)}
                            className={`rounded-full px-3 py-2 text-xs font-medium ${
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
                            className={`rounded-full px-3 py-2 text-xs ${confirmingDelete === dish.id ? "bg-red-500 text-white" : "text-red-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"}`}
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
                          categoryOrder={categoryOrder}
                          onUpdate={(updates) => updateDish(dish.id, updates)}
                        />
                      )}
                    </DraggableDishCard>
                  ))}
                </div>

                {/* Empty slot card — shown when category has < 3 items */}
                {items.length < 3 && (
                  <button
                    type="button"
                    onClick={() => addDish(category)}
                    className="mt-2 flex w-full items-center gap-3 rounded-lg border-2 border-dashed border-primary/20 bg-primary/[0.02] p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 group"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-primary/30 bg-primary/5 transition-colors group-hover:bg-primary/10">
                      <svg className="h-6 w-6 text-primary/50 group-hover:text-primary/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary/70 group-hover:text-primary">
                        {tAny.addNewDish || "Add Dish"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getCategoryLabel(category)}
                      </p>
                    </div>
                  </button>
                )}
              </DroppableCategorySection>
            );
          })}
        </div>

        {/* Add custom category — desktop only (mobile version is above) */}
        {!activeDragId && (
          <div className="mt-4 hidden items-center gap-2 lg:flex">
            <input
              type="text"
              placeholder={t.addCategoryPlaceholder}
              className="w-48 rounded-lg border border-dashed border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim().toLowerCase().replace(/\s+/g, "_");
                  if (val && !categoryOrder.includes(val)) {
                    setCustomCategories((prev) => [...prev, val]);
                    setSaved(false);
                  }
                  (e.target as HTMLInputElement).value = "";
                }
              }}
            />
            <span className="text-xs text-muted-foreground">{t.addCategory} (Enter)</span>
          </div>
        )}

        {/* Drag overlay — ghost card following cursor */}
        <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
          {activeDish && <DishCardOverlay dish={activeDish} locale={locale} />}
        </DragOverlay>
      </DndContext>

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

/* ─── dnd-kit helper components ─── */

function DroppablePill({
  id,
  category,
  isCurrent,
  children,
}: {
  id: string;
  category: string;
  isCurrent: boolean;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id, data: { category } });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 ${
        isCurrent
          ? "bg-muted text-muted-foreground opacity-40"
          : isOver
            ? "bg-primary text-primary-foreground scale-110 shadow-lg ring-2 ring-primary/50"
            : "bg-primary/10 text-primary hover:bg-primary/20"
      }`}
    >
      {children}
    </div>
  );
}

function MoveToDropdown({
  dish,
  categoryOrder,
  locale = "en",
  onMove,
  label,
}: {
  dish: Dish;
  categoryOrder: string[];
  locale?: AdminLocale;
  onMove: (category: MenuCategory) => void;
  label: string;
}) {
  const mt = getAdminDict(locale);
  const mtAny = mt as unknown as Record<string, string>;
  const builtinLabels: Record<string, string> = {
    starter: mt.catStarter, main: mt.catMain, side: mt.catSide,
    dessert: mt.catDessert, drink: mt.catDrink, combo: mt.catCombo,
    sharing: mtAny.catSharing, soup: mtAny.catSoup, pasta: mtAny.catPasta,
    wine: mtAny.catWine, cocktail: mtAny.catCocktail, brunch: mtAny.catBrunch,
  };
  function getCategoryLabel(cat: string): string {
    return builtinLabels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ");
  }
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  function handleBlur(e: React.FocusEvent) {
    if (ref.current && !ref.current.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  }

  const otherCategories = categoryOrder.filter((c) => c !== dish.category);

  return (
    <div ref={ref} className="relative" onBlur={handleBlur}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="rounded-full p-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        title={label}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border bg-card py-1 shadow-xl">
          <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {otherCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMove(cat);
                setOpen(false);
              }}
              className="block w-full px-3 py-1.5 text-left text-xs hover:bg-muted"
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DroppableCategorySection({
  id,
  isDragging,
  children,
}: {
  id: string;
  isDragging: boolean;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <section
      ref={setNodeRef}
      className={`rounded-xl p-3 transition-all duration-200 ${
        isOver
          ? "bg-primary/[0.06] ring-2 ring-primary/40 shadow-sm"
          : isDragging
            ? "ring-1 ring-border/50"
            : ""
      }`}
    >
      {children}
    </section>
  );
}

function DraggableDishCard({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ touchAction: "auto" }}
    >
      {children}
    </div>
  );
}

function DishCardOverlay({ dish, locale = "en" }: { dish: Dish; locale?: AdminLocale }) {
  const lo: ("fr" | "en" | "zh")[] =
    locale === "zh" ? ["zh", "en", "fr"] : locale === "fr" ? ["fr", "en", "zh"] : ["en", "fr", "zh"];
  const displayName = dish.name[lo[0]] || dish.name[lo[1]] || dish.name[lo[2]] || "(untitled)";
  return (
    <div className="w-80 rounded-lg border bg-card/80 p-4 shadow-xl ring-2 ring-primary/30 backdrop-blur-sm opacity-70">
      <div className="flex items-center gap-3">
        {dish.imageUrl ? (
          <img
            src={dish.imageUrl}
            alt=""
            className="h-10 w-10 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {displayName}
          </p>
          <p className="text-sm text-muted-foreground">
            &euro;{(dish.priceCents / 100).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Dish inline editor ─── */

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
  categoryOrder,
  onUpdate,
}: {
  dish: Dish;
  cuisine?: string;
  slug?: string;
  locale?: AdminLocale;
  categoryOrder: string[];
  onUpdate: (updates: Partial<Dish>) => void;
}) {
  const t = getAdminDict(locale);
  const tAny = t as unknown as Record<string, string>;
  const builtinCatLabels: Record<string, string> = {
    starter: t.catStarter, main: t.catMain, side: t.catSide,
    dessert: t.catDessert, drink: t.catDrink, combo: t.catCombo,
    sharing: tAny.catSharing, soup: tAny.catSoup, pasta: tAny.catPasta,
    wine: tAny.catWine, cocktail: tAny.catCocktail, brunch: tAny.catBrunch,
  };
  function getCategoryLabel(cat: string): string {
    return builtinCatLabels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ");
  }
  const { toast } = useToast();
  const [flagging, setFlagging] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [describing, setDescribing] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dishLangOrder: ("fr" | "en" | "zh")[] =
    locale === "zh" ? ["zh", "en", "fr"] : locale === "fr" ? ["fr", "en", "zh"] : ["en", "fr", "zh"];
  function getDishLocalizedName(name: { fr: string; en: string; zh: string }): string {
    return name[dishLangOrder[0]] || name[dishLangOrder[1]] || name[dishLangOrder[2]] || "";
  }
  const primaryName = getDishLocalizedName(dish.name);
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
            value={getDishLocalizedName(dish.name)}
            onChange={(e) => {
              // Determine which language field to edit: the first non-empty one in locale order, or default to locale
              const lang = dish.name[dishLangOrder[0]]
                ? dishLangOrder[0]
                : dish.name[dishLangOrder[1]]
                  ? dishLangOrder[1]
                  : dish.name[dishLangOrder[2]]
                    ? dishLangOrder[2]
                    : dishLangOrder[0];
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

      {/* Translated names — ordered by admin locale */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {dishLangOrder.map((lang) => (
          <div key={lang}>
            <label className="text-xs text-muted-foreground">
              {tAny[`name${lang.charAt(0).toUpperCase()}${lang.slice(1)}`]}
            </label>
            <input
              type="text"
              value={dish.name[lang]}
              onChange={(e) =>
                onUpdate({ name: { ...dish.name, [lang]: e.target.value } })
              }
              className="w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground"
            />
          </div>
        ))}
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
              <option key={c} value={c}>{getCategoryLabel(c)}</option>
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
        <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {dishLangOrder.map((lang) => (
            <div key={lang}>
              <label className="text-[10px] text-muted-foreground">
                {tAny[`desc${lang.charAt(0).toUpperCase()}${lang.slice(1)}`]}
              </label>
              <textarea
                value={dish.description[lang]}
                onChange={(e) =>
                  onUpdate({
                    description: { ...dish.description, [lang]: e.target.value },
                  })
                }
                rows={2}
                className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
              />
            </div>
          ))}
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

      {/* Halal toggle */}
      <div className="flex items-center gap-3">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={dish.dietaryTags.includes("halal_possible")}
            onChange={(e) => {
              const tags = e.target.checked
                ? [...dish.dietaryTags.filter((t) => t !== "halal_possible"), "halal_possible" as const]
                : dish.dietaryTags.filter((t) => t !== "halal_possible");
              onUpdate({ dietaryTags: tags });
            }}
            className="peer sr-only"
          />
          <div className="h-5 w-9 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-background after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-full" />
        </label>
        <span className="text-xs text-muted-foreground">{t.halal}</span>
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

      {/* Calories */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-muted-foreground">{t.caloriesKcal}</label>
        <input
          type="number"
          min={0}
          value={dish.caloriesKcal ?? ""}
          onChange={(e) =>
            onUpdate({
              caloriesKcal: e.target.value ? parseInt(e.target.value, 10) : undefined,
            })
          }
          placeholder={t.caloriesPlaceholder}
          className="w-24 rounded-md border border-border bg-background px-2 py-1 text-sm"
        />
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
              <Camera weight="duotone" className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
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
