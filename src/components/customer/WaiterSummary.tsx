"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Dish, LanguageCode } from "@/types/menu";
import { CSSMascot } from "./CSSMascot";

const labels = {
  title: { en: "Show to Waiter", fr: "Montrer au serveur", zh: "给服务员看" },
  generating: { en: "Cloché is preparing your order...", fr: "Cloché prépare votre commande...", zh: "Cloché 正在准备您的订单..." },
  addNotes: { en: "Anything else to tell the waiter?", fr: "Autre chose à dire au serveur ?", zh: "还有什么要告诉服务员的吗？" },
  notesPlaceholder: {
    en: "e.g. tap water please, extra bread, birthday celebration...",
    fr: "ex. une carafe d'eau SVP, du pain supplémentaire, anniversaire...",
    zh: "如自来水、多要面包、生日庆祝等...",
  },
  generate: { en: "Generate order summary", fr: "Générer le résumé", zh: "生成订单摘要" },
  regenerate: { en: "Regenerate", fr: "Régénérer", zh: "重新生成" },
  close: { en: "Close", fr: "Fermer", zh: "关闭" },
  error: { en: "Could not generate summary", fr: "Impossible de générer le résumé", zh: "无法生成摘要" },
  retry: { en: "Retry", fr: "Réessayer", zh: "重试" },
  orderFor: { en: "Order for", fr: "Commande pour", zh: "点餐：" },
  people: { en: "people", fr: "personnes", zh: "人" },
  person: { en: "person", fr: "personne", zh: "人" },
  howMany: { en: "How many people?", fr: "Combien de personnes ?", zh: "几位用餐？" },
};

function t(key: keyof typeof labels, lang: LanguageCode): string {
  const l = lang.startsWith("zh") ? "zh" : lang === "fr" ? "fr" : "en";
  return labels[key][l];
}

/** Map country code → language code for the waiter summary output */
const countryToLang: Record<string, string> = {
  FR: "fr", BE: "fr", CH: "fr", US: "en", GB: "en", AU: "en", CA: "en", SG: "en",
  DE: "de", AT: "de", ES: "es", MX: "es", PE: "es", IT: "it", PT: "pt", BR: "pt",
  NL: "nl", CN: "zh", TW: "zh", HK: "zh", JP: "ja", KR: "ko", TH: "th", VN: "vi",
  IN: "hi", LB: "ar", MA: "ar", AE: "ar", SA: "ar", TR: "tr", GR: "el",
};

interface WaiterSummaryProps {
  visible: boolean;
  lang: LanguageCode;
  dishes: Dish[];
  addressCountry?: string;
  cuisine?: string;
  tenantSlug?: string;
  onClose: () => void;
}

interface AiQuestion {
  id: string;
  question: string;
  options?: string[];
  dishName?: string;
}

export function WaiterSummary({
  visible,
  lang,
  dishes,
  addressCountry,
  cuisine,
  tenantSlug,
  onClose,
}: WaiterSummaryProps) {
  const [step, setStep] = useState<"questions" | "loading" | "result" | "error">("questions");
  const [questions, setQuestions] = useState<AiQuestion[]>(() => generateQuestions(dishes, lang));
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [peopleCount, setPeopleCount] = useState(1);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset state when becoming visible
  const [lastVisible, setLastVisible] = useState(false);
  if (visible && !lastVisible) {
    setStep("questions");
    setQuestions(generateQuestions(dishes, lang));
    setAnswers({});
    setNotes("");
    setSummary("");
    setPeopleCount(1);
  }
  if (visible !== lastVisible) setLastVisible(visible);

  async function handleGenerate() {
    setStep("loading");
    setLoading(true);
    try {
      const targetLang = addressCountry ? (countryToLang[addressCountry] ?? "en") : "en";
      const res = await fetch("/api/waiter-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dishes: dishes.map((d) => ({
            name: d.name,
            description: d.description,
            category: d.category,
            allergens: d.allergens,
            priceCents: d.priceCents,
          })),
          answers,
          notes,
          peopleCount,
          customerLang: lang,
          targetLang,
          cuisine: cuisine || "",
          tenantSlug: tenantSlug || "",
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
        setStep("result");
      } else {
        setStep("error");
      }
    } catch {
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 300) onClose();
            }}
            className="relative w-full max-w-lg rounded-t-2xl border-t border-carte-border px-5 pb-8 pt-4"
            style={{ backgroundColor: "var(--carte-bg)", maxHeight: "85vh" }}
          >
            <div className="mx-auto mb-4 h-1 w-10 cursor-grab rounded-full bg-carte-border active:cursor-grabbing" />

            <h2 className="text-base font-bold text-carte-text">{t("title", lang)}</h2>

            {/* Dish list preview */}
            <div className="mt-3 space-y-1.5 overflow-y-auto" style={{ maxHeight: step === "result" ? "20vh" : "25vh" }}>
              {dishes.map((dish) => {
                const name = dish.name[lang] || dish.name.en || dish.name.fr;
                return (
                  <div key={dish.id} className="flex items-center justify-between rounded-lg bg-carte-surface px-3 py-1.5 text-xs">
                    <span className="text-carte-text">{name}</span>
                    <span className="tabular-nums text-carte-primary">&euro;{(dish.priceCents / 100).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {/* Questions step */}
            {step === "questions" && (
              <div className="mt-4 space-y-4 overflow-y-auto" style={{ maxHeight: "35vh" }}>
                {/* People count */}
                <div>
                  <p className="text-xs font-medium text-carte-text-muted">{t("howMany", lang)}</p>
                  <div className="mt-1.5 flex gap-2">
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPeopleCount(n)}
                        className={`min-h-[36px] rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                          peopleCount === n
                            ? "bg-carte-primary text-carte-bg"
                            : "border border-carte-border text-carte-text-muted hover:bg-carte-surface"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={peopleCount > 4 ? peopleCount : ""}
                      placeholder="5+"
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        if (v > 0) setPeopleCount(v);
                      }}
                      className="w-16 rounded-full border border-carte-border bg-transparent px-3 py-1.5 text-center text-xs text-carte-text"
                    />
                  </div>
                </div>

                {/* AI-generated questions */}
                {questions.map((q) => (
                  <div key={q.id}>
                    <p className="text-xs font-medium text-carte-text-muted">
                      {q.dishName && <span className="text-carte-primary">{q.dishName}: </span>}
                      {q.question}
                    </p>
                    {q.options ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {q.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                            className={`rounded-full px-3 py-1 text-xs transition-colors ${
                              answers[q.id] === opt
                                ? "bg-carte-primary text-carte-bg"
                                : "border border-carte-border text-carte-text-muted hover:bg-carte-surface"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={answers[q.id] ?? ""}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-carte-border bg-transparent px-3 py-1.5 text-xs text-carte-text"
                      />
                    )}
                  </div>
                ))}

                {/* Free-text notes */}
                <div>
                  <p className="text-xs font-medium text-carte-text-muted">{t("addNotes", lang)}</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("notesPlaceholder", lang)}
                    rows={2}
                    className="mt-1 w-full resize-none rounded-lg border border-carte-border bg-transparent px-3 py-2 text-xs text-carte-text placeholder:text-carte-text-dim"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  className="w-full rounded-xl py-3 text-sm font-semibold text-carte-bg active:opacity-80"
                  style={{ backgroundColor: "var(--carte-primary)" }}
                >
                  {t("generate", lang)}
                </button>
              </div>
            )}

            {/* Loading step */}
            {step === "loading" && (
              <div className="mt-6 flex flex-col items-center gap-3 py-8">
                <CSSMascot state="thinking" className="h-16 w-16" />
                <p className="text-xs text-carte-text-dim">{t("generating", lang)}</p>
              </div>
            )}

            {/* Result step */}
            {step === "result" && (
              <div className="mt-4">
                <div
                  className="overflow-y-auto rounded-xl border border-carte-border bg-carte-surface p-4 text-sm leading-relaxed text-carte-text whitespace-pre-wrap"
                  style={{ maxHeight: "40vh" }}
                >
                  {summary}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={loading}
                    className="flex-1 rounded-xl border border-carte-border py-2.5 text-xs font-medium text-carte-text-muted hover:bg-carte-surface disabled:opacity-50"
                  >
                    {t("regenerate", lang)}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-carte-bg active:opacity-80"
                    style={{ backgroundColor: "var(--carte-primary)" }}
                  >
                    {t("close", lang)}
                  </button>
                </div>
              </div>
            )}

            {/* Error step */}
            {step === "error" && (
              <div className="mt-6 flex flex-col items-center gap-3 py-8">
                <CSSMascot state="sad" className="h-16 w-16" />
                <p className="text-xs text-carte-text-dim">{t("error", lang)}</p>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="rounded-full border border-carte-border px-4 py-1.5 text-xs text-carte-text-muted hover:bg-carte-surface"
                >
                  {t("retry", lang)}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Generate client-side questions based on dish categories and common waiter questions */
function generateQuestions(dishes: Dish[], lang: LanguageCode): AiQuestion[] {
  const l = lang.startsWith("zh") ? "zh" : lang === "fr" ? "fr" : "en";
  const qs: AiQuestion[] = [];

  // Steak / meat doneness
  const meats = dishes.filter((d) => {
    const name = (d.name.en ?? d.name.fr ?? "").toLowerCase();
    const desc = (d.description.en ?? d.description.fr ?? "").toLowerCase();
    const combined = name + " " + desc;
    return /steak|bœuf|boeuf|beef|entrecôte|entrecote|côte de|filet|牛排|ribeye|sirloin|faux.?filet|bavette|onglet|rumsteak|t.?bone/.test(combined);
  });
  for (const m of meats) {
    const dishName = m.name[lang] || m.name.en || m.name.fr;
    qs.push({
      id: `doneness-${m.id}`,
      question: { en: "How would you like it cooked?", fr: "Quelle cuisson ?", zh: "几分熟？" }[l],
      options: { en: ["Rare", "Medium Rare", "Medium", "Well Done"], fr: ["Saignant", "À point", "Bien cuit"], zh: ["三分熟", "五分熟", "七分熟", "全熟"] }[l] as string[],
      dishName,
    });
  }

  // Eggs
  const eggs = dishes.filter((d) => {
    const name = (d.name.en ?? d.name.fr ?? "").toLowerCase();
    const desc = (d.description.en ?? d.description.fr ?? "").toLowerCase();
    return /\begg|œuf|oeuf|鸡蛋|煎蛋|荷包蛋/.test(name + " " + desc) && /brunch|breakfast|petit.?déjeuner/.test(d.category + " " + name + " " + desc);
  });
  for (const e of eggs) {
    const dishName = e.name[lang] || e.name.en || e.name.fr;
    qs.push({
      id: `egg-${e.id}`,
      question: { en: "How do you like your eggs?", fr: "Cuisson des œufs ?", zh: "鸡蛋怎么做？" }[l],
      options: { en: ["Scrambled", "Sunny Side Up", "Poached", "Over Easy"], fr: ["Brouillés", "Au plat", "Pochés", "Mollets"], zh: ["炒蛋", "太阳蛋", "水波蛋", "溏心蛋"] }[l] as string[],
      dishName,
    });
  }

  // Spice level
  const spicy = dishes.filter((d) => d.spiceLevel > 0);
  if (spicy.length > 0) {
    qs.push({
      id: "spice-preference",
      question: { en: "Spice level preference?", fr: "Niveau de piquant souhaité ?", zh: "辣度偏好？" }[l],
      options: { en: ["Mild", "Medium", "Spicy", "Extra Spicy"], fr: ["Doux", "Moyen", "Piquant", "Très piquant"], zh: ["微辣", "中辣", "辣", "特辣"] }[l] as string[],
    });
  }

  // Side dish choice (if mains without explicit sides)
  const mains = dishes.filter((d) => d.category === "main");
  if (mains.length > 0) {
    qs.push({
      id: "side-preference",
      question: { en: "Any side preference?", fr: "Choix d'accompagnement ?", zh: "配菜偏好？" }[l],
      options: { en: ["Fries", "Salad", "Rice", "Vegetables", "No preference"], fr: ["Frites", "Salade", "Riz", "Légumes", "Pas de préférence"], zh: ["薯条", "沙拉", "米饭", "蔬菜", "无偏好"] }[l] as string[],
    });
  }

  // Drinks with meals
  const hasDrinks = dishes.some((d) => ["drink", "wine", "cocktail"].includes(d.category));
  if (!hasDrinks && dishes.length > 0) {
    qs.push({
      id: "drink-preference",
      question: { en: "Would you like a drink?", fr: "Souhaitez-vous une boisson ?", zh: "需要饮品吗？" }[l],
      options: { en: ["Water (tap)", "Sparkling Water", "Soft Drink", "Wine", "No thanks"], fr: ["Carafe d'eau", "Eau gazeuse", "Soda", "Vin", "Non merci"], zh: ["自来水", "气泡水", "软饮", "葡萄酒", "不需要"] }[l] as string[],
    });
  }

  // Allergies catch-all
  qs.push({
    id: "allergies",
    question: { en: "Any allergies or dietary restrictions?", fr: "Allergies ou restrictions alimentaires ?", zh: "有过敏或饮食限制吗？" }[l],
    options: { en: ["None", "Gluten-free", "Lactose-free", "Nut allergy", "Other (specify in notes)"], fr: ["Aucune", "Sans gluten", "Sans lactose", "Allergie aux noix", "Autre (préciser)"], zh: ["无", "无麸质", "无乳糖", "坚果过敏", "其他（在备注中说明）"] }[l] as string[],
  });

  return qs;
}
