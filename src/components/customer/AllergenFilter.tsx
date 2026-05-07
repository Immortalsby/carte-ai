"use client";

import type { Allergen, LanguageCode } from "@/types/menu";
import { getDictionary } from "@/lib/i18n";

const allergenList: { key: Allergen; emoji: string; labels: Record<string, string> }[] = [
  { key: "gluten", emoji: "🌾", labels: { en: "Gluten", fr: "Gluten", zh: "麸质" } },
  { key: "crustaceans", emoji: "🦐", labels: { en: "Crustaceans", fr: "Crustacés", zh: "甲壳类" } },
  { key: "eggs", emoji: "🥚", labels: { en: "Eggs", fr: "Œufs", zh: "鸡蛋" } },
  { key: "fish", emoji: "🐟", labels: { en: "Fish", fr: "Poisson", zh: "鱼类" } },
  { key: "peanuts", emoji: "🥜", labels: { en: "Peanuts", fr: "Arachides", zh: "花生" } },
  { key: "soy", emoji: "🫘", labels: { en: "Soy", fr: "Soja", zh: "大豆" } },
  { key: "milk", emoji: "🥛", labels: { en: "Milk", fr: "Lait", zh: "牛奶" } },
  { key: "nuts", emoji: "🌰", labels: { en: "Tree nuts", fr: "Fruits à coque", zh: "坚果" } },
  { key: "celery", emoji: "🥬", labels: { en: "Celery", fr: "Céleri", zh: "芹菜" } },
  { key: "mustard", emoji: "🟡", labels: { en: "Mustard", fr: "Moutarde", zh: "芥末" } },
  { key: "sesame", emoji: "⚪", labels: { en: "Sesame", fr: "Sésame", zh: "芝麻" } },
  { key: "sulphites", emoji: "🧪", labels: { en: "Sulphites", fr: "Sulfites", zh: "亚硫酸盐" } },
  { key: "lupin", emoji: "🌸", labels: { en: "Lupin", fr: "Lupin", zh: "羽扇豆" } },
  { key: "molluscs", emoji: "🐚", labels: { en: "Molluscs", fr: "Mollusques", zh: "软体动物" } },
  { key: "alcohol", emoji: "🍷", labels: { en: "Alcohol", fr: "Alcool", zh: "酒精" } },
];

interface AllergenFilterProps {
  excluded: Allergen[];
  onChange: (excluded: Allergen[]) => void;
  lang: LanguageCode;
}

export function AllergenFilter({ excluded, onChange, lang }: AllergenFilterProps) {
  const dict = getDictionary(lang);

  function toggle(allergen: Allergen) {
    if (excluded.includes(allergen)) {
      onChange(excluded.filter((a) => a !== allergen));
    } else {
      onChange([...excluded, allergen]);
    }
  }

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-carte-text-dim">
        {dict.allergens}
      </h3>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {allergenList.map(({ key, emoji, labels }) => {
          const active = excluded.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              style={
                active
                  ? {
                      backgroundColor: "color-mix(in srgb, var(--carte-danger) 20%, transparent)",
                      color: "var(--carte-danger)",
                      boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--carte-danger) 40%, transparent)",
                    }
                  : {
                      backgroundColor: "var(--carte-surface)",
                      color: "var(--carte-text-muted)",
                    }
              }
            >
              <span>{emoji}</span>
              <span>{labels[lang] || labels.en}</span>
              {active && <span className="ml-0.5">{"\u2715"}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
