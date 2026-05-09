"use client";

import { useEffect, useState } from "react";
import type { Dish, LanguageCode, Allergen } from "@/types/menu";
import { CSSMascot } from "./CSSMascot";
import { ForkKnife } from "@phosphor-icons/react";

const allergenLabels: Record<Allergen, Record<string, string>> = {
  gluten: { fr: "Gluten", en: "Gluten", zh: "麸质" },
  crustaceans: { fr: "Crustacés", en: "Crustaceans", zh: "甲壳类" },
  eggs: { fr: "Œufs", en: "Eggs", zh: "鸡蛋" },
  fish: { fr: "Poisson", en: "Fish", zh: "鱼类" },
  peanuts: { fr: "Arachides", en: "Peanuts", zh: "花生" },
  soy: { fr: "Soja", en: "Soy", zh: "大豆" },
  milk: { fr: "Lait", en: "Milk", zh: "牛奶" },
  nuts: { fr: "Fruits à coque", en: "Tree nuts", zh: "坚果" },
  celery: { fr: "Céleri", en: "Celery", zh: "芹菜" },
  mustard: { fr: "Moutarde", en: "Mustard", zh: "芥末" },
  sesame: { fr: "Sésame", en: "Sesame", zh: "芝麻" },
  sulphites: { fr: "Sulfites", en: "Sulphites", zh: "亚硫酸盐" },
  lupin: { fr: "Lupin", en: "Lupin", zh: "羽扇豆" },
  molluscs: { fr: "Mollusques", en: "Molluscs", zh: "软体动物" },
  alcohol: { fr: "Alcool", en: "Alcohol", zh: "酒精" },
  unknown: { fr: "Inconnu", en: "Unknown", zh: "未知" },
};

const explainLabels = {
  button: { en: "Ask Cloche to explain", fr: "Demander à Cloche", zh: "让 Cloche 解释" },
  loading: { en: "Cloche is thinking...", fr: "Cloche réfléchit...", zh: "Cloche 正在思考..." },
  error: { en: "Couldn't get an explanation right now", fr: "Impossible d'obtenir une explication", zh: "暂时无法获取解释" },
};

interface DishDetailProps {
  dish: Dish;
  lang: LanguageCode;
  cuisine?: string;
  tenantSlug?: string;
  onClose: () => void;
}

export function DishDetail({ dish, lang, cuisine, tenantSlug, onClose }: DishDetailProps) {
  const name = dish.name[lang] || dish.name.en || dish.name.fr;
  const desc = dish.description[lang] || dish.description.en || dish.description.fr;
  const price = (dish.priceCents / 100).toFixed(2);

  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState(false);

  const l = (key: keyof typeof explainLabels) =>
    explainLabels[key][lang as "en" | "fr" | "zh"] || explainLabels[key].en;

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function handleExplain() {
    if (explainLoading || explanation) return;
    setExplainLoading(true);
    setExplainError(false);
    try {
      const res = await fetch("/api/dish-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dishName: dish.name,
          dishDescription: dish.description,
          ingredients: dish.ingredients,
          cuisine: cuisine || "",
          lang,
          tenantSlug: tenantSlug || "",
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.explanation) {
        setExplanation(data.explanation);
      } else {
        setExplainError(true);
      }
    } catch {
      setExplainError(true);
    } finally {
      setExplainLoading(false);
    }
  }

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
              {lang === "zh" ? "食材" : lang === "fr" ? "Ingrédients" : "Ingredients"}
            </h3>
            <p className="mt-1 text-sm text-carte-text-muted">
              {dish.ingredients.join(", ")}
            </p>
          </div>
        )}

        {/* Allergens — show concrete allergens, or a gentle "ask staff" hint for unknown */}
        {dish.allergens.filter((a) => a !== "unknown").length > 0 ? (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-carte-text-dim">
              {lang === "zh" ? "过敏原" : lang === "fr" ? "Allergènes" : "Allergens"}
            </h3>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {dish.allergens
                .filter((a) => a !== "unknown")
                .map((a) => (
                  <span
                    key={a}
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: "var(--carte-surface)",
                      color: "var(--carte-text-muted)",
                    }}
                  >
                    {allergenLabels[a][lang] || allergenLabels[a].en}
                  </span>
                ))}
            </div>
          </div>
        ) : dish.allergens.includes("unknown") ? (
          <div className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-carte-text-dim">
              {lang === "zh" ? "过敏原" : lang === "fr" ? "Allergènes" : "Allergens"}
            </h3>
            <p className="mt-1 text-xs text-carte-text-dim">
              {lang === "zh"
                ? "过敏原信息暂未标注，请咨询店员"
                : lang === "fr"
                  ? "Informations sur les allergènes non disponibles — veuillez demander au personnel"
                  : "Allergen info not available — please ask staff"}
            </p>
          </div>
        ) : null}

        {/* Calories */}
        <div className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-carte-text-dim">
            {lang === "zh" ? "卡路里" : lang === "fr" ? "Calories" : "Calories"}
          </h3>
          <p className="mt-1 text-sm text-carte-text-muted">
            {dish.caloriesKcal
              ? `${dish.caloriesKcal} kcal`
              : lang === "zh"
                ? "未提供"
                : lang === "fr"
                  ? "Non fourni"
                  : "Not provided"}
          </p>
        </div>

        {/* Spice level */}
        {dish.spiceLevel > 0 && (
          <div className="mt-3 text-sm text-carte-text-muted">
            {lang === "zh" ? "辣度" : lang === "fr" ? "Piquant" : "Spice"}: {"\ud83c\udf36\ufe0f".repeat(dish.spiceLevel)}
          </div>
        )}

        {/* Cloche explain button + result */}
        <div className="mt-4">
          {!explanation && !explainLoading && (
            <button
              type="button"
              onClick={handleExplain}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-carte-border py-2.5 text-xs font-medium text-carte-text-muted transition-colors hover:bg-carte-surface hover:border-carte-primary/30"
            >
              <ForkKnife weight="duotone" className="h-4 w-4 text-carte-primary" />
              {l("button")}
            </button>
          )}
          {explainLoading && (
            <div className="flex items-center gap-3 py-2">
              <div className="shrink-0 w-10 h-10">
                <CSSMascot state="thinking" className="w-10 h-10" />
              </div>
              <div className="rounded-2xl rounded-bl-sm border border-carte-border px-3 py-2 text-xs text-carte-text-dim"
                style={{ backgroundColor: "var(--carte-surface)" }}>
                {l("loading")}
              </div>
            </div>
          )}
          {explanation && (
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 mt-1">
                <CSSMascot state="happy" className="w-10 h-10" />
              </div>
              <div
                className="rounded-2xl rounded-bl-sm px-3 py-2.5 text-sm leading-relaxed text-carte-text"
                style={{ backgroundColor: "var(--carte-surface)", borderLeft: "2px solid var(--carte-primary)" }}
              >
                {explanation}
              </div>
            </div>
          )}
          {explainError && (
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-10 h-10">
                <CSSMascot state="sad" className="w-10 h-10" />
              </div>
              <p className="text-xs text-carte-text-dim">{l("error")}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-carte-bg active:opacity-80"
          style={{ backgroundColor: "var(--carte-primary)" }}
        >
          {lang === "zh" ? "关闭" : lang === "fr" ? "Fermer" : "Close"}
        </button>
      </div>
    </div>
  );
}
