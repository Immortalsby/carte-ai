"use client";

import { useState, useEffect } from "react";
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

export function WaiterSummary({
  visible,
  lang,
  dishes,
  addressCountry,
  cuisine,
  tenantSlug,
  onClose,
}: WaiterSummaryProps) {
  const [step, setStep] = useState<"idle" | "loading" | "result" | "error">("idle");
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset state when becoming visible
  const [lastVisible, setLastVisible] = useState(false);
  if (visible && !lastVisible) {
    setStep("idle");
    setNotes("");
    setSummary("");
  }
  if (visible !== lastVisible) setLastVisible(visible);

  // Lock body scroll when visible
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [visible]);

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
          answers: {},
          notes,
          peopleCount: 1,
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
            className="relative w-full max-w-lg rounded-t-2xl border-t border-carte-border px-5 pb-8 pt-4 overflow-y-auto"
            style={{ backgroundColor: "var(--carte-bg)", maxHeight: "85vh" }}
          >
            {/* Drag handle — visual only, no drag behavior */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-carte-border" />

            <h2 className="text-base font-bold text-carte-text">{t("title", lang)}</h2>

            {/* Dish list preview */}
            <div className="mt-3 space-y-1.5">
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

            {/* Idle step — notes + generate button */}
            {step === "idle" && (
              <div className="mt-4 space-y-4">
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
                  className="rounded-xl border border-carte-border bg-carte-surface p-4 text-sm leading-relaxed text-carte-text whitespace-pre-wrap"
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
