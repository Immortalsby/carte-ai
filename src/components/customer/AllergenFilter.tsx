"use client";

import type { Allergen, LanguageCode } from "@/types/menu";
import { getDictionary } from "@/lib/i18n";

const allergenList: { key: Allergen; emoji: string; dictKey: string }[] = [
  { key: "gluten", emoji: "🌾", dictKey: "allergenGluten" },
  { key: "crustaceans", emoji: "🦐", dictKey: "allergenCrustaceans" },
  { key: "eggs", emoji: "🥚", dictKey: "allergenEggs" },
  { key: "fish", emoji: "🐟", dictKey: "allergenFish" },
  { key: "peanuts", emoji: "🥜", dictKey: "allergenPeanuts" },
  { key: "soy", emoji: "🫘", dictKey: "allergenSoy" },
  { key: "milk", emoji: "🥛", dictKey: "allergenMilk" },
  { key: "nuts", emoji: "🌰", dictKey: "allergenNuts" },
  { key: "celery", emoji: "🥬", dictKey: "allergenCelery" },
  { key: "mustard", emoji: "🟡", dictKey: "allergenMustard" },
  { key: "sesame", emoji: "⚪", dictKey: "allergenSesame" },
  { key: "sulphites", emoji: "🧪", dictKey: "allergenSulphites" },
  { key: "lupin", emoji: "🌸", dictKey: "allergenLupin" },
  { key: "molluscs", emoji: "🐚", dictKey: "allergenMolluscs" },
  { key: "alcohol", emoji: "🍷", dictKey: "allergenAlcohol" },
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
        {allergenList.map(({ key, emoji, dictKey }) => {
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
              <span>{dict[dictKey as keyof typeof dict]}</span>
              {active && <span className="ml-0.5">{"\u2715"}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
