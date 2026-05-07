"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import type { LanguageCode, Allergen, RestaurantMenu } from "@/types/menu";
import type {
  RecommendationMode,
  RecommendationItem,
  RecommendationResponse,
  DiningOccasion,
} from "@/types/recommendation";
import type { ExperienceMode } from "./CustomerExperience";
import { getDictionary } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics-client";
import { useToast } from "@/components/ui/Toast";
import { CuisineLoader } from "./CuisineLoader";

/* ─── Step definitions ─── */
export type ConciergeStep = "occasion" | "mode" | "preferences" | "loading" | "results";

const occasionOptions: Array<{
  occasion: DiningOccasion;
  icon: string;
  label: { en: string; fr: string; zh: string };
  desc: { en: string; fr: string; zh: string };
}> = [
  {
    occasion: "drinks",
    icon: "\ud83c\udf7b",
    label: { en: "Just drinks", fr: "Juste un verre", zh: "\u559d\u4e00\u676f" },
    desc: { en: "Drinks + a few bites to share", fr: "Boissons + quelques bouchées à partager", zh: "\u996e\u54c1\u4e3a\u4e3b\uff0c\u70b9\u51e0\u4e2a\u5c0f\u98df\u5206\u4eab" },
  },
  {
    occasion: "meal",
    icon: "\ud83c\udf7d\ufe0f",
    label: { en: "A proper meal", fr: "Un vrai repas", zh: "\u6b63\u7ecf\u5403\u996d" },
    desc: { en: "One dish per person + drinks", fr: "Un plat par personne + boissons", zh: "\u6bcf\u4eba\u4e00\u4efd\u4e3b\u83dc + \u996e\u54c1" },
  },
  {
    occasion: "feast",
    icon: "\ud83e\udd62",
    label: { en: "Sharing feast", fr: "Festin à partager", zh: "\u5927\u5feb\u6735\u9890" },
    desc: { en: "Order many dishes to share family-style", fr: "Plein de plats à partager entre tous", zh: "\u591a\u70b9\u51e0\u4e2a\u83dc\u5927\u5bb6\u4e00\u8d77\u5403" },
  },
];

type ModeEntry = {
  mode: RecommendationMode;
  dictKey: keyof ReturnType<typeof getDictionary>;
  icon: string;
  partySize?: 1 | 2 | 3 | 4;
  defaults?: {
    budgetCents?: number;
    maxSpice?: 0 | 1 | 2 | 3;
  };
};

const touristModes: ModeEntry[] = [
  { mode: "first_time", dictKey: "firstTime", icon: "\ud83c\udd95" },
  { mode: "cheap", dictKey: "cheap", icon: "\ud83d\udcb0", defaults: { budgetCents: 1000 } },
  { mode: "signature", dictKey: "signature", icon: "\u2b50" },
  { mode: "healthy", dictKey: "healthy", icon: "\ud83e\udd57" },
  { mode: "sharing", dictKey: "sharing", icon: "\ud83c\udf7b" },
  { mode: "not_sure", dictKey: "prompt", icon: "\ud83e\udd14" },
];

const groupMealModes: ModeEntry[] = [
  { mode: "sharing", dictKey: "twoPersons", icon: "\ud83d\udc65", partySize: 2 },
  { mode: "sharing", dictKey: "threePersons", icon: "\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67", partySize: 3 },
  { mode: "sharing", dictKey: "fourPersons", icon: "\ud83c\udf89", partySize: 4 },
  { mode: "signature", dictKey: "hotAndCold", icon: "\ud83c\udf36\ufe0f\u2744\ufe0f" },
  { mode: "healthy", dictKey: "lightMeal", icon: "\ud83e\udd57" },
  { mode: "not_sure", dictKey: "prompt", icon: "\ud83e\udd14" },
];

const spiceLevels = [
  { value: 0 as const, label: { en: "No spice", fr: "Non \u00e9pic\u00e9", zh: "\u4e0d\u8fa3" }, icon: "\u2744\ufe0f" },
  { value: 1 as const, label: { en: "Mild", fr: "L\u00e9ger", zh: "\u5fae\u8fa3" }, icon: "\ud83c\udf36\ufe0f" },
  { value: 2 as const, label: { en: "Medium", fr: "Moyen", zh: "\u4e2d\u8fa3" }, icon: "\ud83c\udf36\ufe0f\ud83c\udf36\ufe0f" },
  { value: 3 as const, label: { en: "Hot", fr: "Fort", zh: "\u91cd\u8fa3" }, icon: "\ud83c\udf36\ufe0f\ud83c\udf36\ufe0f\ud83c\udf36\ufe0f" },
];

const budgetPresets = [
  { cents: 1000, label: "<10\u20ac" },
  { cents: 2000, label: "10-20\u20ac" },
  { cents: 3000, label: "20-30\u20ac" },
  { cents: 0, label: "30\u20ac+" },
];

const prefLabels = {
  budget: { en: "Budget (optional)", fr: "Budget (facultatif)", zh: "\u9884\u7b97\uff08\u53ef\u9009\uff09" },
  spice: { en: "Max spice level (optional)", fr: "Piquant max (facultatif)", zh: "\u8fa3\u5ea6\u4e0a\u9650\uff08\u53ef\u9009\uff09" },
  freeText: { en: "Anything else? (optional)", fr: "Autre chose ? (facultatif)", zh: "\u8fd8\u6709\u5176\u4ed6\u8981\u6c42\u5417\uff1f\uff08\u53ef\u9009\uff09" },
  next: { en: "Get recommendations", fr: "Obtenir les recommandations", zh: "\u83b7\u53d6\u63a8\u8350" },
  back: { en: "Back", fr: "Retour", zh: "\u8fd4\u56de" },
  noLimit: { en: "Any", fr: "Tous", zh: "\u4e0d\u9650" },
  confidence: { en: "Confidence", fr: "Confiance", zh: "\u7f6e\u4fe1\u5ea6" },
};

export interface ConciergePanelProps {
  lang: LanguageCode;
  menu: RestaurantMenu;
  excludedAllergens: Allergen[];
  tenantId: string;
  experienceMode: ExperienceMode;
  allowDrinksOnly?: boolean;
  onResults?: () => void;
  onClose: () => void;
  onStepChange?: (step: ConciergeStep, hasAllergenWarning?: boolean) => void;
  savedDishIds?: string[];
  onToggleSave?: (dishIds: string[]) => void;
}

export function ConciergePanel({
  lang,
  menu,
  excludedAllergens,
  tenantId,
  experienceMode,
  allowDrinksOnly = true,
  onResults,
  onClose,
  onStepChange,
  savedDishIds = [],
  onToggleSave,
}: ConciergePanelProps) {
  const [step, setStep] = useState<ConciergeStep>("occasion");
  const [occasion, setOccasion] = useState<DiningOccasion | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RecommendationResponse | null>(null);
  const [selectedMode, setSelectedMode] = useState<ModeEntry | null>(null);

  const [budgetCents, setBudgetCents] = useState<number | undefined>(undefined);
  const [maxSpice, setMaxSpice] = useState<0 | 1 | 2 | 3 | undefined>(undefined);
  const [userText, setUserText] = useState("");

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const dict = getDictionary(lang);
  const { toast } = useToast();
  const isGroupMeal = experienceMode === "group_meal";
  const modes = isGroupMeal ? groupMealModes : touristModes;

  const pl = (key: keyof typeof prefLabels) =>
    prefLabels[key][lang as "en" | "fr" | "zh"] || prefLabels[key].en;

  // Notify parent on step change
  function changeStep(newStep: ConciergeStep, hasAllergenWarning?: boolean) {
    setStep(newStep);
    onStepChange?.(newStep, hasAllergenWarning);
  }

  // ─── Voice input (FR19) ───
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast(dict.voiceUnavailable, "info");
      return;
    }

    const recognition = new SR();
    recognition.lang = lang === "zh" ? "zh-CN" : lang === "fr" ? "fr-FR" : lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setUserText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
    };

    recognition.onerror = (event: Event & { error?: string }) => {
      setIsListening(false);
      const err = event.error ?? "unknown";
      if (err === "not-allowed" || err === "service-not-allowed") {
        toast(dict.voicePermissionDenied, "info");
      } else if (err !== "aborted" && err !== "no-speech") {
        toast(dict.voiceUnavailable, "info");
      }
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      toast(dict.voiceUnavailable, "info");
    }
  }, [lang, dict.voiceUnavailable, dict.voicePermissionDenied, toast]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  function handleModeSelect(entry: ModeEntry) {
    setSelectedMode(entry);
    setBudgetCents(entry.defaults?.budgetCents);
    setMaxSpice(entry.defaults?.maxSpice);
    changeStep("preferences");
  }

  async function handleSubmit() {
    if (!selectedMode) return;
    changeStep("loading");
    setLoading(true);
    setResults(null);

    try {
      const partySize =
        selectedMode.partySize ?? (selectedMode.mode === "sharing" ? 2 : 1);
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang,
          mode: selectedMode.mode,
          occasion: occasion || undefined,
          partySize,
          budgetCents: budgetCents || undefined,
          maxSpiceLevel: maxSpice,
          excludedAllergens,
          excludedTags: [],
          userText: userText.trim() || undefined,
          menu,
        }),
      });
      if (!res.ok) {
        setResults(null);
        changeStep("mode");
        return;
      }
      const data = await res.json();
      setResults(data);
      const hasAllergenWarning = data.recommendations?.some(
        (r: RecommendationItem) => r.allergenWarning,
      );
      changeStep("results", hasAllergenWarning);
      onResults?.();
      trackEvent(
        tenantId,
        "recommend_view",
        {
          mode: selectedMode.mode,
          experienceMode,
          partySize,
          budgetCents,
          maxSpice,
          hasUserText: !!userText.trim(),
          count: data.recommendations?.length,
        },
        lang
      );
    } catch {
      setResults(null);
      changeStep("mode");
    } finally {
      setLoading(false);
    }
  }

  function resetFlow() {
    changeStep("occasion");
    setOccasion(null);
    setResults(null);
    setSelectedMode(null);
    setBudgetCents(undefined);
    setMaxSpice(undefined);
    setUserText("");
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-carte-border bg-carte-surface p-4 backdrop-blur-sm">
      <h2 className="text-center text-sm font-bold text-carte-primary">
        {isGroupMeal ? dict.groupMealConcierge : dict.concierge}
      </h2>

      {/* ── Step 0: Dining occasion ── */}
      {step === "occasion" && (
        <div className="mt-3 space-y-2">
          {occasionOptions.filter((opt) => opt.occasion !== "drinks" || allowDrinksOnly).map((opt) => {
            const l = (lang as string).startsWith("zh") ? "zh" : lang === "fr" ? "fr" : "en";
            return (
              <button
                key={opt.occasion}
                type="button"
                onClick={() => {
                  setOccasion(opt.occasion);
                  changeStep("mode");
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-carte-border bg-carte-surface px-4 py-3 text-left transition-colors hover:bg-carte-surface-hover hover:border-carte-primary/30"
              >
                <span className="text-2xl">{opt.icon}</span>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-carte-text">{opt.label[l]}</span>
                  <span className="block text-xs text-carte-text-muted">{opt.desc[l]}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Step 1: Mode selection ── */}
      {step === "mode" && (
        <div className="mt-3">
          {occasion && (
            <div className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ backgroundColor: "color-mix(in srgb, var(--carte-primary) 10%, transparent)" }}
            >
              <span className="text-base">{occasionOptions.find((o) => o.occasion === occasion)?.icon}</span>
              <span className="text-xs font-medium text-carte-primary">
                {occasionOptions.find((o) => o.occasion === occasion)?.label[
                  (lang as string).startsWith("zh") ? "zh" : lang === "fr" ? "fr" : "en"
                ]}
              </span>
              <button
                type="button"
                onClick={() => { setOccasion(null); changeStep("occasion"); }}
                className="ml-auto text-[10px] text-carte-text-dim hover:text-carte-text-muted"
              >
                {lang === "zh" ? "换" : lang === "fr" ? "Changer" : "Change"}
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {modes.map((entry) => (
              <button
                key={`${entry.mode}-${entry.dictKey}`}
                type="button"
                onClick={() => handleModeSelect(entry)}
                className="min-h-[44px] rounded-lg border border-carte-border bg-carte-surface px-3 py-2.5 text-xs font-medium text-carte-text transition-colors hover:bg-carte-surface-hover hover:border-carte-primary/30"
              >
                <span className="mr-1.5">{entry.icon}</span>
                {dict[entry.dictKey]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2: Preferences ── */}
      {step === "preferences" && selectedMode && (
        <div className="mt-3 space-y-4">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ backgroundColor: "color-mix(in srgb, var(--carte-primary) 10%, transparent)" }}
          >
            <span className="text-base">{selectedMode.icon}</span>
            <span className="text-xs font-medium text-carte-primary">
              {dict[selectedMode.dictKey]}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-carte-text-dim">
              {pl("budget")}
            </label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {budgetPresets.map((bp) => (
                <PillButton
                  key={bp.label}
                  active={budgetCents === bp.cents}
                  onClick={() =>
                    setBudgetCents(budgetCents === bp.cents ? undefined : bp.cents)
                  }
                  label={bp.label}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-carte-text-dim">
              {pl("spice")}
            </label>
            <div className="mt-1.5 flex gap-1.5">
              {spiceLevels.map((sl) => (
                <button
                  key={sl.value}
                  type="button"
                  onClick={() =>
                    setMaxSpice(maxSpice === sl.value ? undefined : sl.value)
                  }
                  className="flex min-h-[36px] flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors"
                  style={
                    maxSpice === sl.value
                      ? {
                          borderColor: "var(--carte-primary)",
                          backgroundColor:
                            "color-mix(in srgb, var(--carte-primary) 15%, transparent)",
                          color: "var(--carte-primary)",
                        }
                      : {
                          borderColor: "var(--carte-border)",
                          color: "var(--carte-text-muted)",
                        }
                  }
                >
                  <span className="text-[10px]">{sl.icon}</span>
                  <span className="hidden sm:inline">
                    {sl.label[lang as "en" | "fr" | "zh"] || sl.label.en}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-carte-text-dim">
              {pl("freeText")}
            </label>
            <div className="relative mt-1.5">
              <textarea
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                placeholder={dict.customPlaceholder}
                maxLength={500}
                rows={2}
                className="w-full resize-none rounded-lg border border-carte-border bg-carte-bg px-3 py-2 pr-10 text-xs text-carte-text placeholder:text-carte-text-dim focus:border-carte-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className="absolute bottom-2 right-2 rounded-full p-1.5 transition-colors"
                style={
                  isListening
                    ? {
                        backgroundColor: "var(--carte-danger)",
                        color: "var(--carte-bg)",
                      }
                    : {
                        backgroundColor: "var(--carte-surface)",
                        color: "var(--carte-text-muted)",
                      }
                }
                title={isListening ? dict.listening : dict.voice}
              >
                {isListening ? (
                  <svg className="h-4 w-4 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                )}
              </button>
            </div>
            {isListening && (
              <p className="mt-1 text-[10px] text-carte-danger animate-pulse">
                {dict.listening}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                changeStep("mode");
                setBudgetCents(undefined);
                setMaxSpice(undefined);
                setUserText("");
              }}
              className="min-h-[44px] flex-shrink-0 rounded-lg border border-carte-border px-3 py-2 text-xs font-medium text-carte-text-muted hover:bg-carte-surface-hover"
            >
              {pl("back")}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="min-h-[44px] flex-1 rounded-lg px-4 py-2 text-xs font-semibold text-carte-bg transition-transform active:scale-[0.98]"
              style={{ backgroundColor: "var(--carte-primary)" }}
            >
              {pl("next")}
            </button>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {step === "loading" && (
        <CuisineLoader
          cuisineType={menu.restaurant.cuisine}
          message={dict.scanning}
        />
      )}

      {/* ── Results ── */}
      {step === "results" && results && (
        <div className="mt-3 space-y-3">
          {results.recommendations.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.3, ease: "easeOut" }}
            >
              <RecommendationCard
                item={item}
                isBest={i === 0}
                lang={lang}

                isSaved={item.dishIds.every((id) => savedDishIds.includes(id))}
                onToggleSave={() => onToggleSave?.(item.dishIds)}
              />
            </motion.div>
          ))}

          {results.safetyNotice && (
            <p className="mt-2 text-[10px] text-carte-warning">
              {results.safetyNotice}
            </p>
          )}

          <button
            type="button"
            onClick={resetFlow}
            className="w-full rounded-lg border border-carte-border py-2 text-xs font-medium text-carte-text-muted hover:bg-carte-surface"
          >
            {isGroupMeal ? dict.groupMealPrompt : dict.prompt}
          </button>
        </div>
      )}

      {/* Close panel */}
      <button
        type="button"
        onClick={() => {
          onClose();
          resetFlow();
        }}
        className="mt-3 w-full text-center text-xs text-carte-text-dim hover:text-carte-text-muted"
      >
        {dict.mascotClose}
      </button>

    </div>
  );
}

/* ─── Pill toggle button ─── */
function PillButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[36px] rounded-full border px-3 py-1 text-xs font-medium transition-colors"
      style={
        active
          ? {
              borderColor: "var(--carte-primary)",
              backgroundColor:
                "color-mix(in srgb, var(--carte-primary) 15%, transparent)",
              color: "var(--carte-primary)",
            }
          : {
              borderColor: "var(--carte-border)",
              color: "var(--carte-text-muted)",
            }
      }
    >
      {label}
    </button>
  );
}

/* ─── Confidence bar (FR14) ─── */
function ConfidenceBar({ value, lang }: { value: number; lang: LanguageCode }) {
  const pct = Math.round(value * 100);
  const label =
    prefLabels.confidence[lang as "en" | "fr" | "zh"] ||
    prefLabels.confidence.en;

  const color =
    pct >= 80
      ? "var(--carte-success)"
      : pct >= 50
        ? "var(--carte-accent)"
        : "var(--carte-warning)";

  return (
    <div className="mt-1.5 flex items-center gap-2">
      <span className="text-[10px] text-carte-text-dim">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-carte-border" style={{ height: 4 }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] font-medium tabular-nums" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

/* ─── Recommendation Card ─── */
function RecommendationCard({
  item,
  isBest,
  lang,
  isSaved,
  onToggleSave,
}: {
  item: RecommendationItem;
  isBest: boolean;
  lang: LanguageCode;
  isSaved?: boolean;
  onToggleSave?: () => void;
}) {
  const dict = getDictionary(lang);
  const price = (item.totalPriceCents / 100).toFixed(2);

  return (
    <article
      className="rounded-lg border p-3"
      style={
        isBest
          ? {
              borderColor:
                "color-mix(in srgb, var(--carte-primary) 50%, transparent)",
              backgroundColor:
                "color-mix(in srgb, var(--carte-primary) 8%, transparent)",
            }
          : {
              borderColor: "var(--carte-border)",
              backgroundColor: "var(--carte-surface)",
            }
      }
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          {isBest && (
            <span
              className="mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold text-carte-bg"
              style={{ backgroundColor: "var(--carte-primary)" }}
            >
              {dict.bestMatch}
            </span>
          )}
          <h3 className="text-sm font-semibold text-carte-text">{item.title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onToggleSave && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
              className="p-1 transition-colors"
              aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  fill={isSaved ? "var(--carte-danger)" : "none"}
                  stroke={isSaved ? "var(--carte-danger)" : "var(--carte-text-dim)"}
                />
              </svg>
            </button>
          )}
          <span className="text-sm font-bold tabular-nums text-carte-primary">
            &euro;{price}
          </span>
        </div>
      </div>
      <p className="mt-1 text-xs text-carte-text-muted">{item.reason}</p>
      {item.allergenWarning && (
        <p className="mt-1 text-[10px] text-carte-warning">
          {item.allergenWarning}
        </p>
      )}
      <ConfidenceBar value={item.confidence} lang={lang} />
    </article>
  );
}
