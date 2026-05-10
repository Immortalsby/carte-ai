"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { LanguageCode, Allergen, RestaurantMenu } from "@/types/menu";
import type {
  RecommendationMode,
  RecommendationItem,
  RecommendationResponse,
  DiningOccasion,
} from "@/types/recommendation";
import { getDictionary } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics-client";
import { useToast } from "@/components/ui/Toast";
import { CuisineLoader } from "./CuisineLoader";
import { CSSMascot } from "./CSSMascot";
import {
  BeerStein, ForkKnife, BowlFood, Sparkle, CurrencyEur, Star,
  Leaf, Question, Users, UsersThree, UsersFour, Fire, Snowflake, Pepper,
} from "@phosphor-icons/react";

/* ─── Step definitions ─── */
export type ConciergeStep = "occasion" | "mode" | "preferences" | "loading" | "results";

const occasionOptions: Array<{
  occasion: DiningOccasion;
  icon: ReactNode;
  label: { en: string; fr: string; zh: string };
  desc: { en: string; fr: string; zh: string };
}> = [
  {
    occasion: "drinks",
    icon: <BeerStein weight="duotone" />,
    label: { en: "Just drinks", fr: "Juste un verre", zh: "\u559d\u4e00\u676f" },
    desc: { en: "Drinks + a few bites to share", fr: "Boissons + quelques bouchées à partager", zh: "\u996e\u54c1\u4e3a\u4e3b\uff0c\u70b9\u51e0\u4e2a\u5c0f\u98df\u5206\u4eab" },
  },
  {
    occasion: "meal",
    icon: <ForkKnife weight="duotone" />,
    label: { en: "A proper meal", fr: "Un vrai repas", zh: "\u6b63\u7ecf\u5403\u996d" },
    desc: { en: "One dish per person + drinks", fr: "Un plat par personne + boissons", zh: "\u6bcf\u4eba\u4e00\u4efd\u4e3b\u83dc + \u996e\u54c1" },
  },
  {
    occasion: "feast",
    icon: <BowlFood weight="duotone" />,
    label: { en: "Sharing feast", fr: "Festin à partager", zh: "\u5927\u5feb\u6735\u9890" },
    desc: { en: "Order many dishes to share family-style", fr: "Plein de plats à partager entre tous", zh: "\u591a\u70b9\u51e0\u4e2a\u83dc\u5927\u5bb6\u4e00\u8d77\u5403" },
  },
];

type ModeEntry = {
  mode: RecommendationMode;
  dictKey: keyof ReturnType<typeof getDictionary>;
  icon: ReactNode;
  partySize?: 1 | 2 | 3 | 4;
  defaults?: {
    budgetCents?: number;
    maxSpice?: 0 | 1 | 2 | 3;
  };
};

/* ─── Mode lists per occasion ─── */

// "Just drinks" → drinks-focused options (partySize 2 = at least 2 drinks + snacks)
const drinksModes: ModeEntry[] = [
  { mode: "signature", dictKey: "drinksPopular", icon: <Star weight="duotone" />, partySize: 2 },
  { mode: "cheap", dictKey: "drinksBudget", icon: <CurrencyEur weight="duotone" />, partySize: 2, defaults: { budgetCents: 1000 } },
  { mode: "not_sure", dictKey: "drinksAsk", icon: <Question weight="duotone" />, partySize: 2 },
];

// "A proper meal" — unified modes (individual + sharing options)
const mealModes: ModeEntry[] = [
  { mode: "first_time", dictKey: "firstTime", icon: <Sparkle weight="duotone" /> },
  { mode: "signature", dictKey: "signature", icon: <Star weight="duotone" /> },
  { mode: "cheap", dictKey: "cheap", icon: <CurrencyEur weight="duotone" />, defaults: { budgetCents: 1000 } },
  { mode: "healthy", dictKey: "healthy", icon: <Leaf weight="duotone" /> },
  { mode: "sharing", dictKey: "sharing", icon: <Users weight="duotone" />, partySize: 2 },
  { mode: "not_sure", dictKey: "prompt", icon: <Question weight="duotone" /> },
];

// "Sharing feast" — always group/sharing oriented
const feastModes: ModeEntry[] = [
  { mode: "sharing", dictKey: "twoPersons", icon: <Users weight="duotone" />, partySize: 2 },
  { mode: "sharing", dictKey: "threePersons", icon: <UsersThree weight="duotone" />, partySize: 3 },
  { mode: "sharing", dictKey: "fourPersons", icon: <UsersFour weight="duotone" />, partySize: 4 },
  { mode: "signature", dictKey: "hotAndCold", icon: <><Fire weight="duotone" /><Snowflake weight="duotone" /></> },
  { mode: "not_sure", dictKey: "prompt", icon: <Question weight="duotone" /> },
];

function getModesForOccasion(occasion: DiningOccasion | null): ModeEntry[] {
  switch (occasion) {
    case "drinks": return drinksModes;
    case "feast": return feastModes;
    case "meal":
    default: return mealModes;
  }
}

const spiceLevels = [
  { value: 0 as const, label: { en: "No spice", fr: "Non \u00e9pic\u00e9", zh: "\u4e0d\u8fa3" }, icon: <Snowflake weight="duotone" /> },
  { value: 1 as const, label: { en: "Mild", fr: "L\u00e9ger", zh: "\u5fae\u8fa3" }, icon: <Pepper weight="duotone" /> },
  { value: 2 as const, label: { en: "Medium", fr: "Moyen", zh: "\u4e2d\u8fa3" }, icon: <><Pepper weight="duotone" /><Pepper weight="duotone" /></> },
  { value: 3 as const, label: { en: "Hot", fr: "Fort", zh: "\u91cd\u8fa3" }, icon: <><Pepper weight="duotone" /><Pepper weight="duotone" /><Pepper weight="duotone" /></> },
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
  pickHint: { en: "Here are your options \u2014 pick your favorite!", fr: "Voici vos options \u2014 choisissez votre pr\u00e9f\u00e9r\u00e9 !", zh: "\u4e3a\u4f60\u7cbe\u9009\u4e86\u51e0\u4e2a\u65b9\u6848\uff0c\u6311\u4e00\u4e2a\u559c\u6b22\u7684\u5427~" },
};

export interface ConciergePanelProps {
  lang: LanguageCode;
  menu: RestaurantMenu;
  excludedAllergens: Allergen[];
  tenantId: string;
  allowDrinksOnly?: boolean;
  onResults?: () => void;
  onClose: () => void;
  onStepChange?: (step: ConciergeStep, hasAllergenWarning?: boolean, fallbackUsed?: boolean) => void;
  savedDishIds?: string[];
  onToggleSave?: (dishIds: string[]) => void;
}

export function ConciergePanel({
  lang,
  menu,
  excludedAllergens,
  tenantId,
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
  const modes = getModesForOccasion(occasion);

  // Dish explanation state (keyed by dishId)
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [explainLoading, setExplainLoading] = useState<string | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);

  async function handleExplainDish(dishId: string) {
    if (explanations[dishId] || explainLoading) return;
    const dish = menu.dishes.find((d) => d.id === dishId);
    if (!dish) return;
    setExplainLoading(dishId);
    setExplainError(null);
    try {
      const res = await fetch("/api/dish-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dishName: dish.name,
          dishDescription: dish.description,
          ingredients: dish.ingredients,
          cuisine: menu.restaurant.cuisine || "",
          lang,
          tenantSlug: menu.restaurant.slug,
        }),
      });
      if (!res.ok) {
        setExplainError(dishId);
        return;
      }
      const data = await res.json();
      if (data.explanation) {
        setExplanations((prev) => ({ ...prev, [dishId]: data.explanation }));
      } else {
        setExplainError(dishId);
      }
    } catch {
      setExplainError(dishId);
    } finally {
      setExplainLoading(null);
    }
  }

  const pl = (key: keyof typeof prefLabels) =>
    prefLabels[key][lang as "en" | "fr" | "zh"] || prefLabels[key].en;

  // Notify parent on step change
  function changeStep(newStep: ConciergeStep, hasAllergenWarning?: boolean, fallbackUsed?: boolean) {
    setStep(newStep);
    onStepChange?.(newStep, hasAllergenWarning, fallbackUsed);
  }

  // ─── Voice input (FR19) ───
  const startListening = useCallback(async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast(dict.voiceUnavailable, "info");
      return;
    }

    // Pre-check microphone permission — show guidance immediately if denied
    if (navigator.permissions?.query) {
      try {
        const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
        if (status.state === "denied") {
          toast(dict.voicePermissionDenied, "info");
          return;
        }
      } catch {
        // permissions.query not supported for microphone — fall through
      }
    }

    // Request microphone access to trigger the browser permission dialog
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release the stream immediately — we only needed the permission grant
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      toast(dict.voicePermissionDenied, "info");
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
      changeStep("results", hasAllergenWarning, data.fallbackUsed);
      onResults?.();
      trackEvent(
        tenantId,
        "recommend_view",
        {
          mode: selectedMode.mode,
          occasion,
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
    setExplanations({});
    setExplainLoading(null);
    setExplainError(null);
  }

  return (
    <div className="rounded-xl border border-carte-border bg-carte-surface p-4 backdrop-blur-sm">
      <h2 className="text-center text-sm font-bold text-carte-primary">
        {dict.concierge}
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
                <span className="flex shrink-0 items-center text-carte-primary [&>svg]:h-6 [&>svg]:w-6">{opt.icon}</span>
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
              <span className="flex items-center text-carte-primary [&>svg]:h-4 [&>svg]:w-4">{occasionOptions.find((o) => o.occasion === occasion)?.icon}</span>
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
                {dict.change}
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
                <span className="mr-1.5 inline-flex items-center text-carte-primary [&>svg]:h-4 [&>svg]:w-4">{entry.icon}</span>
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
            <span className="flex items-center text-carte-primary [&>svg]:h-4 [&>svg]:w-4">{selectedMode.icon}</span>
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
                  <span className="inline-flex items-center [&>svg]:h-3 [&>svg]:w-3">{sl.icon}</span>
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
          <p className="text-center text-[11px] text-carte-text-muted">{pl("pickHint")}</p>
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
                onExplain={handleExplainDish}
              />
              {/* Cloche speech bubble explanation */}
              {explainLoading === item.dishIds[0] && (
                <div className="mt-1.5 flex items-center gap-2 px-1">
                  <div className="shrink-0 w-8 h-8">
                    <CSSMascot state="thinking" className="w-8 h-8" />
                  </div>
                  <div className="rounded-2xl rounded-bl-sm border border-carte-border px-2.5 py-1.5 text-[11px] text-carte-text-dim"
                    style={{ backgroundColor: "var(--carte-surface)" }}>
                    {recExplainLabels.loading[lang as "en" | "fr" | "zh"] || recExplainLabels.loading.en}
                  </div>
                </div>
              )}
              {explanations[item.dishIds[0]] && (
                <div className="mt-1.5 flex items-start gap-2 px-1">
                  <div className="shrink-0 w-8 h-8 mt-0.5">
                    <CSSMascot state="happy" className="w-8 h-8" />
                  </div>
                  <div
                    className="rounded-2xl rounded-bl-sm px-2.5 py-2 text-xs leading-relaxed text-carte-text"
                    style={{ backgroundColor: "var(--carte-surface)", borderLeft: "2px solid var(--carte-primary)" }}
                  >
                    {explanations[item.dishIds[0]]}
                  </div>
                </div>
              )}
              {explainError === item.dishIds[0] && (
                <div className="mt-1.5 flex items-center gap-2 px-1">
                  <div className="shrink-0 w-8 h-8">
                    <CSSMascot state="sad" className="w-8 h-8" />
                  </div>
                  <p className="text-[11px] text-carte-text-dim">
                    {recExplainLabels.error[lang as "en" | "fr" | "zh"] || recExplainLabels.error.en}
                  </p>
                </div>
              )}
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
            {dict.prompt}
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

/* ─── Recommendation Card ─── */

const recExplainLabels = {
  button: { en: "Explain this dish", fr: "Expliquer ce plat", zh: "解释这道菜" },
  loading: { en: "Thinking...", fr: "Réflexion...", zh: "思考中..." },
  error: { en: "Couldn't explain right now", fr: "Impossible d'expliquer pour le moment", zh: "暂时无法解释" },
};

function RecommendationCard({
  item,
  isBest,
  lang,
  isSaved,
  onToggleSave,
  onExplain,
}: {
  item: RecommendationItem;
  isBest: boolean;
  lang: LanguageCode;
  isSaved?: boolean;
  onToggleSave?: () => void;
  onExplain?: (dishId: string) => void;
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
      {onExplain && item.dishIds.length > 0 && (
        <button
          type="button"
          onClick={() => onExplain(item.dishIds[0])}
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-carte-primary hover:underline"
        >
          <ForkKnife weight="duotone" className="h-3.5 w-3.5" />
          {recExplainLabels.button[lang as "en" | "fr" | "zh"] || recExplainLabels.button.en}
        </button>
      )}
    </article>
  );
}

