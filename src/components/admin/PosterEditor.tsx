"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import type { AdminLocale } from "@/lib/admin-i18n";
import { getAdminDict } from "@/lib/admin-i18n";
import { buildPosterBgUrl, fetchPollinationsImage } from "@/lib/pollinations-client";

const posterLocaleOptions: { value: AdminLocale; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
];

type PosterOrientation = "portrait" | "landscape";

type PosterNameDisplay = "primary" | "secondary" | "both";
type PosterNameOrder = "primary-first" | "secondary-first";

interface PosterEditorProps {
  restaurantName: string;
  restaurantNameSecondary?: string;
  phone?: string;
  businessHours?: string;
  initialCustomTexts?: string[];
  cuisineType: string;
  address: string;
  slug: string;
  qrCodeDataUrl: string;
  qrUrl: string;
  locale?: AdminLocale;
}

/** Map cuisine_type DB value → localized display label */
const cuisineDisplayMap: Record<string, Record<AdminLocale, string>> = {
  french: { en: "French Restaurant", fr: "Restaurant Français", zh: "法餐厅" },
  italian: { en: "Italian Restaurant", fr: "Restaurant Italien", zh: "意大利餐厅" },
  chinese: { en: "Chinese Restaurant", fr: "Restaurant Chinois", zh: "中餐厅" },
  japanese: { en: "Japanese Restaurant", fr: "Restaurant Japonais", zh: "日本料理" },
  japanese_fusion: { en: "Japanese Fusion", fr: "Fusion Japonaise", zh: "日式融合料理" },
  korean: { en: "Korean Restaurant", fr: "Restaurant Coréen", zh: "韩国料理" },
  thai: { en: "Thai Restaurant", fr: "Restaurant Thaïlandais", zh: "泰国料理" },
  vietnamese: { en: "Vietnamese Restaurant", fr: "Restaurant Vietnamien", zh: "越南餐厅" },
  indian: { en: "Indian Restaurant", fr: "Restaurant Indien", zh: "印度餐厅" },
  lebanese: { en: "Lebanese Restaurant", fr: "Restaurant Libanais", zh: "黎巴嫩餐厅" },
  moroccan: { en: "Moroccan Restaurant", fr: "Restaurant Marocain", zh: "摩洛哥餐厅" },
  turkish: { en: "Turkish Restaurant", fr: "Restaurant Turc", zh: "土耳其餐厅" },
  greek: { en: "Greek Restaurant", fr: "Restaurant Grec", zh: "希腊餐厅" },
  spanish: { en: "Spanish Restaurant", fr: "Restaurant Espagnol", zh: "西班牙餐厅" },
  mexican: { en: "Mexican Restaurant", fr: "Restaurant Mexicain", zh: "墨西哥餐厅" },
  brazilian: { en: "Brazilian Restaurant", fr: "Restaurant Brésilien", zh: "巴西餐厅" },
  peruvian: { en: "Peruvian Restaurant", fr: "Restaurant Péruvien", zh: "秘鲁餐厅" },
  caribbean: { en: "Caribbean Restaurant", fr: "Restaurant Caribéen", zh: "加勒比餐厅" },
  african: { en: "African Restaurant", fr: "Restaurant Africain", zh: "非洲餐厅" },
  mediterranean: { en: "Mediterranean Restaurant", fr: "Restaurant Méditerranéen", zh: "地中海餐厅" },
  american: { en: "American Restaurant", fr: "Restaurant Américain", zh: "美式餐厅" },
  fusion: { en: "Fusion Restaurant", fr: "Restaurant Fusion", zh: "融合料理" },
  other: { en: "Restaurant", fr: "Restaurant", zh: "餐厅" },
};

function getLocalizedCuisine(cuisineType: string, locale: AdminLocale): string {
  const key = cuisineType.toLowerCase().replace(/\s+/g, "_");
  const entry = cuisineDisplayMap[key];
  if (entry) return entry[locale];
  // Fallback: capitalize and use generic template
  const name = cuisineType.replace(/_/g, " ");
  return locale === "zh" ? `${name}餐厅` : locale === "fr" ? `Restaurant ${name}` : `${name} Restaurant`;
}

const bgElements = [
  { key: "candlelight", emoji: "🕯️", labelKey: "elCandlelight" },
  { key: "bokeh", emoji: "✨", labelKey: "elBokeh" },
  { key: "smoke", emoji: "🌫️", labelKey: "elSmoke" },
  { key: "neon", emoji: "💡", labelKey: "elNeon" },
  { key: "sunset", emoji: "🌅", labelKey: "elSunset" },
  { key: "rain", emoji: "🌧️", labelKey: "elRain" },
  { key: "spices", emoji: "🫙", labelKey: "elSpices" },
  { key: "herbs", emoji: "🌿", labelKey: "elHerbs" },
  { key: "wine", emoji: "🍷", labelKey: "elWine" },
  { key: "bread", emoji: "🍞", labelKey: "elBread" },
  { key: "pasta", emoji: "🍝", labelKey: "elPasta" },
  { key: "sushi", emoji: "🍣", labelKey: "elSushi" },
  { key: "dumpling", emoji: "🥟", labelKey: "elDumpling" },
  { key: "steak", emoji: "🥩", labelKey: "elSteak" },
  { key: "seafood", emoji: "🦐", labelKey: "elSeafood" },
  { key: "fruits", emoji: "🍇", labelKey: "elFruits" },
  { key: "cheese", emoji: "🧀", labelKey: "elCheese" },
  { key: "coffee", emoji: "☕", labelKey: "elCoffee" },
  { key: "lanterns", emoji: "🏮", labelKey: "elLanterns" },
  { key: "bamboo", emoji: "🎋", labelKey: "elBamboo" },
  { key: "cherry_blossom", emoji: "🌸", labelKey: "elCherryBlossom" },
  { key: "olive", emoji: "🫒", labelKey: "elOlive" },
  { key: "chili", emoji: "🌶️", labelKey: "elChili" },
  { key: "lemon", emoji: "🍋", labelKey: "elLemon" },
  { key: "wooden_table", emoji: "🪵", labelKey: "elWoodenTable" },
  { key: "marble", emoji: "⬜", labelKey: "elMarble" },
  { key: "ceramic", emoji: "🏺", labelKey: "elCeramic" },
  { key: "silk", emoji: "🎀", labelKey: "elSilk" },
  { key: "flowers", emoji: "💐", labelKey: "elFlowers" },
  { key: "leaves", emoji: "🍃", labelKey: "elLeaves" },
];

const presetThemes = [
  { nameKey: "themeEmeraldNight", bg: "#050507", accent: "#34d399", text: "#ffffff", gradientFrom: "rgba(52,211,153,0.12)", gradientTo: "rgba(103,232,249,0.10)" },
  { nameKey: "themeWarmGold", bg: "#1a1207", accent: "#f59e0b", text: "#ffffff", gradientFrom: "rgba(245,158,11,0.15)", gradientTo: "rgba(251,191,36,0.08)" },
  { nameKey: "themeRoseElegant", bg: "#170a0e", accent: "#f43f5e", text: "#ffffff", gradientFrom: "rgba(244,63,94,0.12)", gradientTo: "rgba(251,113,133,0.08)" },
  { nameKey: "themeOceanBlue", bg: "#060d17", accent: "#3b82f6", text: "#ffffff", gradientFrom: "rgba(59,130,246,0.12)", gradientTo: "rgba(96,165,250,0.08)" },
  { nameKey: "themeRoyalPurple", bg: "#0f0720", accent: "#a855f7", text: "#ffffff", gradientFrom: "rgba(168,85,247,0.12)", gradientTo: "rgba(192,132,252,0.08)" },
  { nameKey: "themeClassicWhite", bg: "#ffffff", accent: "#111827", text: "#111827", gradientFrom: "rgba(0,0,0,0.03)", gradientTo: "rgba(0,0,0,0.01)" },
  { nameKey: "themeTerracotta", bg: "#1a0e08", accent: "#ea580c", text: "#ffffff", gradientFrom: "rgba(234,88,12,0.12)", gradientTo: "rgba(251,146,60,0.08)" },
  { nameKey: "themeForestGreen", bg: "#071207", accent: "#22c55e", text: "#ffffff", gradientFrom: "rgba(34,197,94,0.12)", gradientTo: "rgba(74,222,128,0.08)" },
];

/** Static mascot for poster (no CSS animation — must render in PDF) */
function PosterMascot({ size = 48, accent = "#10b981" }: { size?: number; accent?: string }) {
  return (
    <svg viewBox="0 0 120 100" width={size * 1.4} height={size} aria-hidden="true">
      <path d="M60,6 L62,14 L70,16 L62,18 L60,26 L58,18 L50,16 L58,14 Z" fill="#d4a574" />
      <path d="M24,72 A36,36 0 0 1 96,72" fill={accent} />
      <path d="M40,56 A18,14 0 0 1 54,42" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" opacity=".35" />
      <ellipse cx="48" cy="58" rx="4.5" ry="5" fill="white" />
      <ellipse cx="49" cy="57" rx="2.5" ry="3" fill="#1a1a2e" />
      <circle cx="50" cy="55.5" r="1" fill="white" />
      <ellipse cx="72" cy="58" rx="4.5" ry="5" fill="white" />
      <ellipse cx="73" cy="57" rx="2.5" ry="3" fill="#1a1a2e" />
      <circle cx="74" cy="55.5" r="1" fill="white" />
      <path d="M54,65 Q60,72 66,65" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="42" cy="64" rx="4" ry="2.5" fill="#f9a8d4" opacity=".45" />
      <ellipse cx="78" cy="64" rx="4" ry="2.5" fill="#f9a8d4" opacity=".45" />
      <ellipse cx="60" cy="76" rx="48" ry="5" fill={accent} />
      <ellipse cx="60" cy="76" rx="48" ry="5" fill="black" opacity=".1" />
    </svg>
  );
}

export function PosterEditor({
  restaurantName,
  restaurantNameSecondary = "",
  phone = "",
  businessHours = "",
  initialCustomTexts = [],
  cuisineType,
  address,
  slug,
  qrCodeDataUrl,
  qrUrl,
  locale = "en",
}: PosterEditorProps) {
  const t = getAdminDict(locale);
  const tAny = t as unknown as Record<string, string>;
  const { toast } = useToast();
  const posterRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [posterScale, setPosterScale] = useState(1);

  // Orientation & visibility toggles
  const [orientation, setOrientation] = useState<PosterOrientation>("portrait");
  const [nameDisplay, setNameDisplay] = useState<PosterNameDisplay>(restaurantNameSecondary ? "both" : "primary");
  const [nameOrder, setNameOrder] = useState<PosterNameOrder>("primary-first");
  const [showUrl, setShowUrl] = useState(true);
  const [showCuisineType, setShowCuisineType] = useState(true);
  const [showBadgeBudget, setShowBadgeBudget] = useState(true);
  const [showBadgeAI, setShowBadgeAI] = useState(true);
  const [showPhone, setShowPhone] = useState(!!phone);
  const [showHours, setShowHours] = useState(!!businessHours);

  // Custom resolution (default A4 ratio)
  const PORTRAIT_W = 760;
  const PORTRAIT_RATIO = 1.414; // A4
  const LANDSCAPE_RATIO = 1 / PORTRAIT_RATIO;
  const [customWidth, setCustomWidth] = useState(PORTRAIT_W);

  // Compute displayed names based on settings
  const posterNames: string[] = (() => {
    const primary = restaurantName;
    const secondary = restaurantNameSecondary;
    if (!secondary || nameDisplay === "primary") return [primary];
    if (nameDisplay === "secondary") return [secondary];
    // "both"
    return nameOrder === "primary-first" ? [primary, secondary] : [secondary, primary];
  })();

  const isLandscape = orientation === "landscape";
  const aspectRatio = isLandscape ? LANDSCAPE_RATIO : PORTRAIT_RATIO;
  const POSTER_W = customWidth;
  const POSTER_H = Math.round(POSTER_W * aspectRatio);

  const recalcScale = useCallback(() => {
    if (!wrapperRef.current) return;
    const available = wrapperRef.current.clientWidth;
    setPosterScale(Math.min(1, available / POSTER_W));
  }, [POSTER_W]);

  useEffect(() => {
    recalcScale();
    window.addEventListener("resize", recalcScale);
    return () => window.removeEventListener("resize", recalcScale);
  }, [recalcScale]);

  const [posterLocale, setPosterLocale] = useState<AdminLocale>("fr");
  const pt = getAdminDict(posterLocale);
  const [theme, setTheme] = useState(presetThemes[0]);
  const [customBg, setCustomBg] = useState("");
  const [customAccent, setCustomAccent] = useState("");
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [generatingBg, setGeneratingBg] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [customTexts, setCustomTexts] = useState<string[]>(initialCustomTexts);
  const [customElement, setCustomElement] = useState("");
  const [uploadedBgImage, setUploadedBgImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Character limit for custom text on poster
  const charLimit = 50;

  // Auto-save custom texts to tenant.settings (debounced)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const saveCustomTexts = useCallback((texts: string[]) => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/tenants/${slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings: { poster_custom_texts: texts.filter(Boolean) } }),
        });
      } catch { /* silent */ }
    }, 800);
  }, [slug]);

  function toggleElement(key: string) {
    setSelectedElements((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function addCustomText() {
    if (customTexts.length >= 3) return;
    const next = [...customTexts, ""];
    setCustomTexts(next);
    saveCustomTexts(next);
  }

  function updateCustomText(index: number, value: string) {
    if (value.length > charLimit) return;
    const next = customTexts.map((t2, i) => (i === index ? value : t2));
    setCustomTexts(next);
    saveCustomTexts(next);
  }

  function removeCustomText(index: number) {
    const next = customTexts.filter((_, i) => i !== index);
    setCustomTexts(next);
    saveCustomTexts(next);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate type
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast(tAny.uploadBgImageInvalid);
      return;
    }
    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      toast(tAny.uploadBgImageInvalid);
      return;
    }
    // Validate dimensions
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      if (img.width < 1200 || img.height < 1700) {
        toast(tAny.uploadBgImageInvalid);
        URL.revokeObjectURL(url);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedBgImage(reader.result as string);
        setBgImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      URL.revokeObjectURL(url);
    };
    img.src = url;
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  const activeBg = customBg || theme.bg;
  const activeAccent = customAccent || theme.accent;
  const isLightBg = isLight(activeBg);
  const activeText = isLightBg ? "#111827" : "#ffffff";

  function isLight(hex: string): boolean {
    const c = hex.replace("#", "");
    if (c.length !== 6) return false;
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  }

  function hexToRgba(hex: string, alpha: number): string {
    const c = hex.replace("#", "");
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  async function generateBackground() {
    setGeneratingBg(true);
    try {
      const pollinationsUrl = buildPosterBgUrl(cuisineType, selectedElements);
      const blob = await fetchPollinationsImage(pollinationsUrl);

      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      setBgImage(dataUrl);
      toast(t.bgGenerated, "success");
    } catch {
      toast(t.bgFailed);
    } finally {
      setGeneratingBg(false);
    }
  }

  async function downloadPdf() {
    if (!posterRef.current) return;
    setDownloadingPdf(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const el = posterRef.current;

      // html2canvas-pro supports modern CSS color functions (oklch, oklab, lab, lch)
      // and renders directly to canvas — reliable for large data-URL images.
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: activeBg,
        width: el.scrollWidth,
        height: el.scrollHeight,
        useCORS: true,
        allowTaint: true,
        onclone: (_doc: Document, cloned: HTMLElement) => {
          cloned.style.transform = "none";
        },
      });

      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

      // PDF with correct orientation
      const pdfOrientation = isLandscape ? "landscape" : "portrait";
      const pdf = new jsPDF({ orientation: pdfOrientation as "portrait" | "landscape", unit: "mm", format: "a4" });
      const pdfW = isLandscape ? 297 : 210;
      const pdfH = isLandscape ? 210 : 297;
      pdf.addImage(dataUrl, "JPEG", 0, 0, pdfW, pdfH);
      pdf.save(`${slug}-poster.pdf`);
      toast(t.pdfDownloaded, "success");
    } catch (err) {
      console.error("[PosterEditor] PDF generation failed:", err);
      toast(`${t.pdfFailed}: ${err instanceof Error ? err.message : ""}`);
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Quick download — one-click, no customization needed */}
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4 print:hidden">
        <div>
          <p className="text-sm font-semibold text-foreground">{tAny.quickDownloadTitle || "Quick Download"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{tAny.quickDownloadDesc || "Download a ready-to-print poster with default settings"}</p>
        </div>
        <button
          type="button"
          onClick={downloadPdf}
          disabled={downloadingPdf}
          className="shrink-0 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {downloadingPdf ? t.generatingPdf : (tAny.quickDownloadBtn || "Download PDF")}
        </button>
      </div>

      {/* Controls — advanced customization */}
      <details className="mb-6 rounded-2xl border border-border bg-card shadow-sm print:hidden">
        <summary className="cursor-pointer list-none p-5 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
          {tAny.advancedCustomization || "Customize Poster"} ▾
        </summary>
        <div className="space-y-4 px-5 pb-5">
        {/* Poster language selector */}
        <div>
          <label className="text-sm font-medium text-foreground">{t.posterLanguage}</label>
          <div className="mt-2 flex gap-2">
            {posterLocaleOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPosterLocale(opt.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  posterLocale === opt.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orientation toggle */}
        <div>
          <label className="text-sm font-medium text-foreground">{tAny.posterOrientation}</label>
          <div className="mt-2 flex gap-2">
            {(["portrait", "landscape"] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOrientation(o)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  orientation === o
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {o === "portrait" ? tAny.posterPortrait : tAny.posterLandscape}
              </button>
            ))}
          </div>
        </div>

        {/* Name display (only show if secondary name exists) */}
        {restaurantNameSecondary && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">{tAny.posterNameDisplay}</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["primary", "secondary", "both"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setNameDisplay(opt)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      nameDisplay === opt
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {opt === "primary" ? tAny.posterNamePrimaryOnly : opt === "secondary" ? tAny.posterNameSecondaryOnly : tAny.posterNameBoth}
                  </button>
                ))}
              </div>
            </div>
            {nameDisplay === "both" && (
              <div>
                <label className="text-sm font-medium text-foreground">{tAny.posterNameOrder}</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["primary-first", "secondary-first"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setNameOrder(opt)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        nameOrder === opt
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {opt === "primary-first" ? tAny.posterNamePrimaryFirst : tAny.posterNameSecondaryFirst}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Visibility toggles */}
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            ["showUrl", showUrl, setShowUrl, tAny.showUrl],
            ["showCuisineType", showCuisineType, setShowCuisineType, tAny.showCuisineType],
            ["showBadgeBudget", showBadgeBudget, setShowBadgeBudget, tAny.showBadgeBudget],
            ["showBadgeAI", showBadgeAI, setShowBadgeAI, tAny.showBadgeAI],
            ...(phone ? [["showPhone", showPhone, setShowPhone, tAny.showPhone] as [string, boolean, (v: boolean) => void, string]] : []),
            ...(businessHours ? [["showHours", showHours, setShowHours, tAny.showHours] as [string, boolean, (v: boolean) => void, string]] : []),
          ] as [string, boolean, (v: boolean) => void, string][]).map(([key, val, setter, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={val}
                onChange={(e) => setter(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              {label}
            </label>
          ))}
        </div>

        {/* Custom resolution */}
        <div>
          <label className="text-sm font-medium text-foreground">{tAny.posterResolution}</label>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{tAny.posterWidth}</span>
              <input
                type="number"
                value={customWidth}
                min={400}
                max={2000}
                step={10}
                onChange={(e) => {
                  const w = Math.max(400, Math.min(2000, Number(e.target.value) || 400));
                  setCustomWidth(w);
                }}
                className="w-20 rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground"
              />
            </div>
            <span className="text-xs text-muted-foreground">×</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{tAny.posterHeight}</span>
              <span className="w-20 rounded-lg border border-border bg-muted/50 px-2 py-1 text-xs text-muted-foreground text-center">
                {POSTER_H}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">🔒 {tAny.posterLockRatio}</span>
          </div>
        </div>

        {/* Theme presets */}
        <div>
          <label className="text-sm font-medium text-foreground">{t.colorTheme}</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {presetThemes.map((th) => (
              <button
                key={th.nameKey}
                type="button"
                onClick={() => { setTheme(th); setCustomBg(""); setCustomAccent(""); }}
                className={`group flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                  theme.nameKey === th.nameKey ? "" : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
                style={theme.nameKey === th.nameKey ? {
                  borderColor: th.accent,
                  backgroundColor: hexToRgba(th.accent, 0.08),
                } : undefined}
              >
                <span
                  className="h-4 w-4 rounded-full border border-white/20"
                  style={{ background: `linear-gradient(135deg, ${th.bg}, ${th.accent})` }}
                />
                {tAny[th.nameKey]}
              </button>
            ))}
          </div>
        </div>

        {/* Custom colors */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-xs text-muted-foreground">{t.customBackground}</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={customBg || activeBg}
                onChange={(e) => setCustomBg(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border"
              />
              <span className="font-mono text-xs text-muted-foreground">{customBg || activeBg}</span>
              {customBg && (
                <button onClick={() => setCustomBg("")} className="text-xs text-muted-foreground hover:text-foreground">{t.reset}</button>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">{t.customAccent}</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={customAccent || activeAccent}
                onChange={(e) => setCustomAccent(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border"
              />
              <span className="font-mono text-xs text-muted-foreground">{customAccent || activeAccent}</span>
              {customAccent && (
                <button onClick={() => setCustomAccent("")} className="text-xs text-muted-foreground hover:text-foreground">{t.reset}</button>
              )}
            </div>
          </div>
        </div>

        {/* Background elements picker */}
        <div>
          <label className="text-sm font-medium text-foreground">
            {t.backgroundElements}
            <span className="ml-2 text-xs font-normal text-gray-400">
              ({selectedElements.length} {t.selected})
            </span>
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {bgElements.map((el) => {
              const active = selectedElements.includes(el.key);
              return (
                <button
                  key={el.key}
                  type="button"
                  onClick={() => toggleElement(el.key)}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    active ? "" : "bg-muted text-muted-foreground"
                  }`}
                  style={active ? {
                    backgroundColor: hexToRgba(activeAccent, 0.15),
                    color: activeAccent,
                    boxShadow: `inset 0 0 0 1px ${hexToRgba(activeAccent, 0.4)}`,
                  } : undefined}
                >
                  <span>{el.emoji}</span>
                  <span>{tAny[el.labelKey]}</span>
                </button>
              );
            })}
            {/* Custom elements added by user */}
            {selectedElements
              .filter((e) => !bgElements.some((el) => el.key === e))
              .map((custom) => (
                <button
                  key={custom}
                  type="button"
                  onClick={() => setSelectedElements((prev) => prev.filter((k) => k !== custom))}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: hexToRgba(activeAccent, 0.15),
                    color: activeAccent,
                    boxShadow: `inset 0 0 0 1px ${hexToRgba(activeAccent, 0.4)}`,
                  }}
                >
                  <span>{custom}</span>
                  <span className="ml-0.5 opacity-60">×</span>
                </button>
              ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              value={customElement}
              onChange={(e) => setCustomElement(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customElement.trim()) {
                  const val = customElement.trim();
                  if (!selectedElements.includes(val)) {
                    setSelectedElements((prev) => [...prev, val]);
                  }
                  setCustomElement("");
                }
              }}
              placeholder={tAny.customBgElementPlaceholder}
              className="w-56 rounded-lg border border-dashed border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        {/* Custom text elements */}
        <div>
          <label className="text-sm font-medium text-foreground">
            {tAny.customElements}
            <span className="ml-2 text-xs font-normal text-gray-400">
              ({customTexts.length}/3)
            </span>
          </label>
          <p className="mt-0.5 text-xs text-muted-foreground">{tAny.customElementsHint}</p>
          <div className="mt-2 space-y-2">
            {customTexts.map((text, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => updateCustomText(idx, e.target.value)}
                  placeholder={tAny.customElementPlaceholder}
                  maxLength={charLimit}
                  className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <span className="text-xs tabular-nums text-muted-foreground">
                  {text.length}/{charLimit}
                </span>
                <button
                  type="button"
                  onClick={() => removeCustomText(idx)}
                  className="text-xs text-destructive hover:underline"
                >
                  {tAny.removeElement}
                </button>
              </div>
            ))}
            {customTexts.length < 3 && (
              <button
                type="button"
                onClick={addCustomText}
                className="rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-foreground hover:text-foreground"
              >
                + {tAny.addElement}
              </button>
            )}
          </div>
        </div>

        {/* Upload background image */}
        <div>
          <label className="text-sm font-medium text-foreground">{tAny.uploadBgImage}</label>
          <p className="mt-0.5 text-xs text-muted-foreground">{tAny.uploadBgImageHint}</p>
          <div className="mt-2 flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              {tAny.uploadBgImageBtn}
            </button>
            {uploadedBgImage && (
              <button
                type="button"
                onClick={() => { setUploadedBgImage(null); if (bgImage === uploadedBgImage) setBgImage(null); }}
                className="text-xs text-destructive hover:underline"
              >
                {tAny.removeElement}
              </button>
            )}
          </div>
        </div>

        {/* AI Background + PDF buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={generateBackground}
            disabled={generatingBg}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {generatingBg ? t.generatingBg : bgImage ? t.regenerateBg : t.aiGenerateBg}
          </button>
          {bgImage && (
            <button
              type="button"
              onClick={() => setBgImage(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              {t.removeBg}
            </button>
          )}
          <button
            type="button"
            onClick={downloadPdf}
            disabled={downloadingPdf}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            {downloadingPdf ? t.generatingPdf : t.downloadPdf}
          </button>
        </div>
      </div>
      </details>

      {/* Poster Preview (A4 ratio) — fixed dimensions for PDF capture, scaled to fit on mobile */}
      <div ref={wrapperRef} className="mx-auto w-full" style={{ maxWidth: POSTER_W }}>
        <div className="relative overflow-hidden" style={{ height: POSTER_H * posterScale }}>
          <div
            ref={posterRef}
            className="poster-content absolute left-0 top-0 origin-top-left overflow-hidden rounded-[2rem] shadow-2xl print:rounded-none print:shadow-none"
            style={{ backgroundColor: activeBg, width: POSTER_W, height: POSTER_H, padding: 40, transform: `scale(${posterScale})` }}
          >
        <div
          className="relative flex h-full flex-col justify-between overflow-hidden rounded-[1.5rem] border p-9"
          style={{
            borderColor: hexToRgba(activeAccent, 0.2),
            background: bgImage
              ? undefined
              : `linear-gradient(to bottom, ${hexToRgba(activeAccent, 0.12)}, ${hexToRgba(activeBg, 0.03)}, ${hexToRgba(activeAccent, 0.1)})`,
          }}
        >
          {/* Background image as real <img> for reliable PDF export on mobile */}
          {bgImage && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bgImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{ zIndex: 0 }}
              />
              <div
                className="absolute inset-0"
                style={{
                  zIndex: 1,
                  background: `linear-gradient(to bottom, ${hexToRgba(activeBg, 0.7)}, ${hexToRgba(activeBg, 0.85)})`,
                }}
              />
            </>
          )}
          {/* Glow effects — only without bg image */}
          {!bgImage && (
            <>
              <div
                className="absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl"
                style={{ backgroundColor: hexToRgba(activeAccent, 0.2) }}
              />
              <div
                className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full blur-3xl"
                style={{ backgroundColor: hexToRgba(activeAccent, 0.15) }}
              />
            </>
          )}

          {isLandscape ? (
            /* ===== LANDSCAPE LAYOUT ===== */
            <div className="relative z-10 flex h-full gap-8">
              {/* Left side: info */}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <PosterMascot size={48} accent={activeAccent} />
                    <p
                      className="text-sm uppercase tracking-[0.36em]"
                      style={{ color: hexToRgba(activeAccent, 0.7) }}
                    >
                      CarteAI
                    </p>
                  </div>
                  {showBadgeBudget && (
                    <div
                      className="mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
                      style={{
                        borderColor: hexToRgba(activeAccent, 0.2),
                        backgroundColor: hexToRgba(activeAccent, 0.1),
                        color: isLightBg ? activeAccent : hexToRgba(activeText, 0.9),
                      }}
                    >
                      {pt.posterBadge1}
                    </div>
                  )}
                  {showBadgeAI && (
                    <div
                      className={`${showBadgeBudget ? "mt-2 " : "mt-3 "}inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm`}
                      style={{
                        borderColor: hexToRgba(activeAccent, 0.15),
                        backgroundColor: hexToRgba(activeAccent, 0.06),
                        color: isLightBg ? activeAccent : hexToRgba(activeText, 0.85),
                      }}
                    >
                      {pt.posterBadge2}
                    </div>
                  )}
                </div>

                <div>
                  {showUrl && (
                    <p className="mb-3 font-mono text-sm" style={{ color: activeAccent }}>
                      carte-ai.link
                    </p>
                  )}
                  {posterNames.map((n, i) => (
                    <p key={i} className={`${i > 0 ? "mt-1 " : ""}text-3xl font-semibold`} style={{ color: activeText }}>
                      {n}
                    </p>
                  ))}
                  {showCuisineType && cuisineType && (
                    <p className="mt-2 text-lg" style={{ color: hexToRgba(activeText, 0.6) }}>
                      {getLocalizedCuisine(cuisineType, posterLocale)}
                    </p>
                  )}
                  {address && (
                    <p className="mt-3 text-sm" style={{ color: hexToRgba(activeText, 0.5) }}>
                      {address}
                    </p>
                  )}
                  {showPhone && phone && (
                    <p className="mt-2 text-sm font-medium" style={{ color: hexToRgba(activeText, 0.7) }}>
                      {phone}
                    </p>
                  )}
                  {showHours && businessHours && (
                    <p className="mt-1 text-sm" style={{ color: hexToRgba(activeText, 0.5) }}>
                      {businessHours}
                    </p>
                  )}
                  {/* Custom text elements */}
                  {customTexts.filter(Boolean).length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      {customTexts.filter(Boolean).map((text, idx) => (
                        <p key={idx} className="text-sm font-medium" style={{ color: hexToRgba(activeText, 0.75) }}>
                          {text}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div />
              </div>

              {/* Right side: QR code */}
              <div className="flex flex-1 items-center justify-center">
                <div
                  className="rounded-[2rem] border bg-white p-5 text-black"
                  style={{ borderColor: hexToRgba(activeText, 0.15), width: "85%" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeDataUrl}
                    alt={`QR code for ${qrUrl}`}
                    className="aspect-square w-full rounded-2xl"
                  />
                  {showUrl && (
                    <p className="mt-3 text-center font-mono text-xs" style={{ color: "#333" }}>
                      {qrUrl}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ===== PORTRAIT LAYOUT (original) ===== */
            <>
              <header className="relative z-10">
                <div className="flex items-center gap-3">
                  <PosterMascot size={48} accent={activeAccent} />
                  <p
                    className="text-sm uppercase tracking-[0.36em]"
                    style={{ color: hexToRgba(activeAccent, 0.7) }}
                  >
                    CarteAI
                  </p>
                </div>
                {showBadgeBudget && (
                  <div
                    className="mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
                    style={{
                      borderColor: hexToRgba(activeAccent, 0.2),
                      backgroundColor: hexToRgba(activeAccent, 0.1),
                      color: isLightBg ? activeAccent : hexToRgba(activeText, 0.9),
                    }}
                  >
                    {pt.posterBadge1}
                  </div>
                )}
                {showBadgeAI && (
                  <div
                    className={`${showBadgeBudget ? "mt-2 " : "mt-4 "}inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm`}
                    style={{
                      borderColor: hexToRgba(activeAccent, 0.15),
                      backgroundColor: hexToRgba(activeAccent, 0.06),
                      color: isLightBg ? activeAccent : hexToRgba(activeText, 0.85),
                    }}
                  >
                    {pt.posterBadge2}
                  </div>
                )}
                <h1
                  className="mt-5 max-w-xl text-6xl font-semibold leading-[0.95]"
                  style={{ color: activeText }}
                >
                  {pt.posterHeadline}
                </h1>
                <p
                  className="mt-5 max-w-md text-xl leading-8"
                  style={{ color: hexToRgba(activeText, 0.68) }}
                >
                  {(pt.posterSubtitle as unknown as (name: string) => string)(restaurantName)}
                </p>
              </header>

              <div className="relative z-10 grid grid-cols-[1fr_1.1fr] items-end gap-8">
                <div>
                  {posterNames.map((n, i) => (
                    <p
                      key={i}
                      className={`${i > 0 ? "mt-1 " : ""}text-3xl font-semibold`}
                      style={{ color: activeText }}
                    >
                      {n}
                    </p>
                  ))}
                  {showCuisineType && cuisineType && (
                    <p className="mt-2" style={{ color: hexToRgba(activeText, 0.55) }}>
                      {getLocalizedCuisine(cuisineType, posterLocale)}
                    </p>
                  )}
                  {showPhone && phone && (
                    <p className="mt-2 text-sm font-medium" style={{ color: hexToRgba(activeText, 0.7) }}>
                      {phone}
                    </p>
                  )}
                  {showHours && businessHours && (
                    <p className="mt-1 text-sm" style={{ color: hexToRgba(activeText, 0.5) }}>
                      {businessHours}
                    </p>
                  )}
                  {/* Custom text elements */}
                  {customTexts.filter(Boolean).length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      {customTexts.filter(Boolean).map((text, idx) => (
                        <p key={idx} className="text-sm font-medium" style={{ color: hexToRgba(activeText, 0.75) }}>
                          {text}
                        </p>
                      ))}
                    </div>
                  )}
                  {showUrl && (
                    <p className="mt-6 font-mono text-sm" style={{ color: activeAccent }}>
                      {qrUrl}
                    </p>
                  )}
                </div>

                <div
                  className="rounded-[2rem] border bg-white p-5 text-black"
                  style={{ borderColor: hexToRgba(activeText, 0.15) }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeDataUrl}
                    alt={`QR code for ${qrUrl}`}
                    className="aspect-square w-full rounded-2xl"
                  />
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold">
                    <PosterMascot size={20} accent={activeAccent} />
                    {pt.posterScanLabel}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
