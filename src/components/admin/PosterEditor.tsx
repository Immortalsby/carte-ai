"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";
import type { AdminLocale } from "@/lib/admin-i18n";
import { getAdminDict } from "@/lib/admin-i18n";
import { buildPosterBgUrl, fetchPollinationsImage } from "@/lib/pollinations-client";

const posterLocaleOptions: { value: AdminLocale; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
];

interface PosterEditorProps {
  restaurantName: string;
  cuisineType: string;
  slug: string;
  qrCodeDataUrl: string;
  qrUrl: string;
  locale?: AdminLocale;
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
  cuisineType,
  slug,
  qrCodeDataUrl,
  qrUrl,
  locale = "en",
}: PosterEditorProps) {
  const t = getAdminDict(locale);
  const tAny = t as unknown as Record<string, string>;
  const { toast } = useToast();
  const posterRef = useRef<HTMLDivElement>(null);
  const [posterLocale, setPosterLocale] = useState<AdminLocale>("fr");
  const pt = getAdminDict(posterLocale);
  const [theme, setTheme] = useState(presetThemes[0]);
  const [customBg, setCustomBg] = useState("");
  const [customAccent, setCustomAccent] = useState("");
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [generatingBg, setGeneratingBg] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [customTexts, setCustomTexts] = useState<string[]>([]);
  const [customElement, setCustomElement] = useState("");
  const [uploadedBgImage, setUploadedBgImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Character limit for custom text on poster
  const charLimit = 50;

  function toggleElement(key: string) {
    setSelectedElements((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function addCustomText() {
    if (customTexts.length >= 3) return;
    setCustomTexts((prev) => [...prev, ""]);
  }

  function updateCustomText(index: number, value: string) {
    if (value.length > charLimit) return;
    setCustomTexts((prev) => prev.map((t2, i) => (i === index ? value : t2)));
  }

  function removeCustomText(index: number) {
    setCustomTexts((prev) => prev.filter((_, i) => i !== index));
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
      const { toJpeg } = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      const el = posterRef.current;
      const dataUrl = await toJpeg(el, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: activeBg,
        width: el.scrollWidth,
        height: el.scrollHeight,
        style: {
          margin: "0",
          transform: "none",
        },
      });

      // A4 ratio poster
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      pdf.addImage(dataUrl, "JPEG", 0, 0, 210, 297);
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
      {/* Controls */}
      <div className="mb-6 space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm print:hidden">
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

      {/* Poster Preview (A4 ratio) — fixed dimensions for PDF capture, scrollable on mobile */}
      <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        <div className="mx-auto w-fit">
          <div
            ref={posterRef}
            className="poster-content overflow-hidden rounded-[2rem] shadow-2xl print:rounded-none print:shadow-none"
            style={{ backgroundColor: activeBg, width: 760, height: Math.round(760 * 1.414), padding: 40 }}
          >
        <div
          className="relative flex h-full flex-col justify-between overflow-hidden rounded-[1.5rem] border p-9"
          style={{
            borderColor: hexToRgba(activeAccent, 0.2),
            background: bgImage
              ? `linear-gradient(to bottom, ${hexToRgba(activeBg, 0.7)}, ${hexToRgba(activeBg, 0.85)}), url(${bgImage}) center/cover no-repeat`
              : `linear-gradient(to bottom, ${hexToRgba(activeAccent, 0.12)}, ${hexToRgba(activeBg, 0.03)}, ${hexToRgba(activeAccent, 0.1)})`,
          }}
        >
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

          <header className="relative">
            <div className="flex items-center gap-3">
              <PosterMascot size={48} accent={activeAccent} />
              <p
                className="text-sm uppercase tracking-[0.36em]"
                style={{ color: hexToRgba(activeAccent, 0.7) }}
              >
                CarteAI
              </p>
            </div>
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

          <div className="relative grid grid-cols-[1fr_1.1fr] items-end gap-8">
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
                style={{
                  borderColor: hexToRgba(activeAccent, 0.2),
                  backgroundColor: hexToRgba(activeAccent, 0.1),
                  color: isLightBg ? activeAccent : hexToRgba(activeText, 0.9),
                }}
              >
                {pt.posterBadge1}
              </div>
              <div
                className="mt-2 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
                style={{
                  borderColor: hexToRgba(activeAccent, 0.15),
                  backgroundColor: hexToRgba(activeAccent, 0.06),
                  color: isLightBg ? activeAccent : hexToRgba(activeText, 0.85),
                }}
              >
                {pt.posterBadge2}
              </div>
              <p
                className="mt-5 text-3xl font-semibold"
                style={{ color: activeText }}
              >
                {restaurantName}
              </p>
              <p
                className="mt-2 capitalize"
                style={{ color: hexToRgba(activeText, 0.55) }}
              >
                {cuisineType?.replace(/_/g, " ")}
              </p>
              {/* Custom text elements */}
              {customTexts.filter(Boolean).length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {customTexts.filter(Boolean).map((text, idx) => (
                    <p
                      key={idx}
                      className="text-sm font-medium"
                      style={{ color: hexToRgba(activeText, 0.75) }}
                    >
                      {text}
                    </p>
                  ))}
                </div>
              )}
              <p
                className="mt-6 font-mono text-sm"
                style={{ color: activeAccent }}
              >
                {qrUrl}
              </p>
            </div>

            <div
              className="rounded-[2rem] border bg-white p-5 text-black"
              style={{ borderColor: hexToRgba(activeText, 0.15) }}
            >
              <Image
                src={qrCodeDataUrl}
                alt={`QR code for ${qrUrl}`}
                width={640}
                height={640}
                unoptimized
                className="aspect-square w-full rounded-2xl"
              />
              <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold">
                <PosterMascot size={20} accent={activeAccent} />
                {pt.posterScanLabel}
              </div>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
