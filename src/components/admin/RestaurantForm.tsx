"use client";

import { useState, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import type { AdminLocale } from "@/lib/admin-i18n";
import { getAdminDict } from "@/lib/admin-i18n";
import { supportedLanguages } from "@/lib/languages";

interface StructuredAddress {
  street: string;
  city: string;
  postal: string;
  country: string;
}

interface ReviewPromoData {
  enabled: boolean;
  clickable: boolean;
  source: string;
  translations: Record<string, string>;
}

interface RestaurantFormProps {
  slug: string;
  initialName: string;
  initialNameSecondary?: string;
  initialCuisineType: string;
  initialAddress: string;
  initialStructuredAddress?: StructuredAddress;
  initialAllowDrinksOnly?: boolean;
  initialGoogleMapsLink?: string;
  initialEnableReviewNudge?: boolean;
  initialReviewPromo?: ReviewPromoData;
  locale?: AdminLocale;
}

const countryOptions = [
  { code: "FR", label: "France" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "DE", label: "Deutschland" },
  { code: "ES", label: "España" },
  { code: "IT", label: "Italia" },
  { code: "PT", label: "Portugal" },
  { code: "NL", label: "Nederland" },
  { code: "BE", label: "Belgique" },
  { code: "CH", label: "Suisse / Schweiz" },
  { code: "AT", label: "Österreich" },
  { code: "CN", label: "中国" },
  { code: "JP", label: "日本" },
  { code: "KR", label: "한국" },
  { code: "TH", label: "ไทย" },
  { code: "VN", label: "Việt Nam" },
  { code: "IN", label: "India" },
  { code: "LB", label: "لبنان (Lebanon)" },
  { code: "MA", label: "المغرب (Morocco)" },
  { code: "TR", label: "Türkiye" },
  { code: "GR", label: "Ελλάδα (Greece)" },
  { code: "MX", label: "México" },
  { code: "BR", label: "Brasil" },
  { code: "PE", label: "Perú" },
  { code: "AE", label: "الإمارات (UAE)" },
  { code: "SA", label: "السعودية (Saudi Arabia)" },
  { code: "AU", label: "Australia" },
  { code: "CA", label: "Canada" },
  { code: "SG", label: "Singapore" },
  { code: "HK", label: "Hong Kong" },
  { code: "TW", label: "Taiwan" },
  { code: "OTHER", label: "Other" },
] as const;

const cuisineOptions = [
  "french", "italian", "chinese", "japanese", "japanese_fusion",
  "korean", "thai", "vietnamese", "indian",
  "lebanese", "moroccan", "turkish", "greek", "spanish",
  "mexican", "brazilian", "peruvian", "caribbean",
  "african", "mediterranean", "american", "fusion", "other",
] as const;

const cuisineLabelKeys: Record<string, string> = {
  french: "cuisineFrench", italian: "cuisineItalian", chinese: "cuisineChinese",
  japanese: "cuisineJapanese", japanese_fusion: "cuisineJapaneseFusion",
  korean: "cuisineKorean", thai: "cuisineThai", vietnamese: "cuisineVietnamese",
  indian: "cuisineIndian", lebanese: "cuisineLebanese", moroccan: "cuisineMoroccan",
  turkish: "cuisineTurkish", greek: "cuisineGreek", spanish: "cuisineSpanish",
  mexican: "cuisineMexican", brazilian: "cuisineBrazilian", peruvian: "cuisinePeruvian",
  caribbean: "cuisineCaribbean", african: "cuisineAfrican",
  mediterranean: "cuisineMediterranean", american: "cuisineAmerican",
  fusion: "cuisineFusion", other: "cuisineOther",
};

export function RestaurantForm({
  slug,
  initialName,
  initialNameSecondary = "",
  initialCuisineType,
  initialAddress,
  initialStructuredAddress,
  initialAllowDrinksOnly = true,
  initialGoogleMapsLink = "",
  initialEnableReviewNudge = false,
  initialReviewPromo,
  locale = "en",
}: RestaurantFormProps) {
  const t = getAdminDict(locale);
  const tAny = t as unknown as Record<string, string>;
  const { toast } = useToast();

  const [name, setName] = useState(initialName);
  const [nameSecondary, setNameSecondary] = useState(initialNameSecondary);
  const [cuisineType, setCuisineType] = useState(initialCuisineType);
  const [addressStreet, setAddressStreet] = useState(initialStructuredAddress?.street ?? initialAddress);
  const [addressCity, setAddressCity] = useState(initialStructuredAddress?.city ?? "");
  const [addressPostal, setAddressPostal] = useState(initialStructuredAddress?.postal ?? "");
  const [addressCountry, setAddressCountry] = useState(initialStructuredAddress?.country ?? "FR");
  const [allowDrinksOnly, setAllowDrinksOnly] = useState(initialAllowDrinksOnly);
  const [googleMapsLink, setGoogleMapsLink] = useState(initialGoogleMapsLink);
  const [enableReviewNudge, setEnableReviewNudge] = useState(initialEnableReviewNudge);

  // Review promo state
  const [promoEnabled, setPromoEnabled] = useState(initialReviewPromo?.enabled ?? false);
  const [promoClickable, setPromoClickable] = useState(initialReviewPromo?.clickable ?? true);
  const [promoSource, setPromoSource] = useState(initialReviewPromo?.source ?? "");
  const [promoTranslations, setPromoTranslations] = useState<Record<string, string>>(initialReviewPromo?.translations ?? {});
  const [translating, setTranslating] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [touched, setTouched] = useState(false);
  const dirty = touched && !saved && !saving;

  // Auto-fill city from postal code
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const lastLookedUpPostal = useRef("");
  const lookupCity = useCallback(async () => {
    if (!addressPostal || addressPostal.length < 4 || addressCountry === "OTHER") return;
    if (lastLookedUpPostal.current === `${addressCountry}:${addressPostal}`) return;
    lastLookedUpPostal.current = `${addressCountry}:${addressPostal}`;
    setCitySuggestions([]);
    try {
      const res = await fetch(`https://api.zippopotam.us/${addressCountry}/${addressPostal}`);
      if (!res.ok) return;
      const data = await res.json();
      const places: string[] = (data?.places ?? []).map((p: Record<string, string>) => p["place name"]).filter(Boolean);
      if (places.length === 1) {
        setAddressCity(places[0]);
        setSaved(false); setTouched(true);
      } else if (places.length > 1) {
        setCitySuggestions(places);
      }
    } catch {}
  }, [addressPostal, addressCountry]);

  function markDirty() { setSaved(false); setTouched(true); }

  async function translatePromo() {
    if (!promoSource.trim()) return;
    setTranslating(true);
    try {
      const res = await fetch("/api/translate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: promoSource.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPromoTranslations(data.translations);
      setShowTranslations(true);
      markDirty();
      toast(tAny.reviewPromoTranslated, "success");
    } catch {
      toast(tAny.reviewPromoTranslateFailed);
    } finally {
      setTranslating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaved(false); setTouched(true);

    try {
      const res = await fetch(`/api/tenants/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          cuisine_type: cuisineType,
          address: [addressStreet, addressPostal, addressCity, countryOptions.find((c) => c.code === addressCountry)?.label ?? addressCountry].filter(Boolean).join(", "),
          settings: {
            name_secondary: nameSecondary.trim() || undefined,
            address_street: addressStreet,
            address_city: addressCity,
            address_postal: addressPostal,
            address_country: addressCountry,
            allow_drinks_only: allowDrinksOnly,
            google_maps_url: googleMapsLink || undefined,
            enable_review_nudge: enableReviewNudge,
            review_promo_enabled: promoEnabled,
            review_promo_clickable: promoClickable,
            review_promo: promoSource.trim() ? {
              source: promoSource.trim(),
              translations: promoTranslations,
            } : undefined,
          },
        }),
      });
      if (res.ok) {
        setSaved(true); setTouched(false);
        toast(t.settingsSaved, "success");
      } else {
        const data = await res.json();
        toast(data.error || t.saveFailed);
      }
    } catch {
      toast(t.networkError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {/* Restaurant name (primary) */}
      <div>
        <label className="text-sm font-medium text-foreground">{tAny.restaurantNamePrimary}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); markDirty(); }}
          required
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>

      {/* Restaurant name (secondary) */}
      <div>
        <label className="text-sm font-medium text-foreground">{tAny.restaurantNameSecondary}</label>
        <p className="mt-0.5 text-xs text-muted-foreground">{tAny.restaurantNameSecondaryHint}</p>
        <input
          type="text"
          value={nameSecondary}
          onChange={(e) => { setNameSecondary(e.target.value); markDirty(); }}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>

      {/* Cuisine type */}
      <div>
        <label className="text-sm font-medium text-foreground">{t.cuisineType}</label>
        <select
          value={cuisineType}
          onChange={(e) => { setCuisineType(e.target.value); markDirty(); }}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="">{t.select}</option>
          {cuisineOptions.map((c) => (
            <option key={c} value={c}>
              {tAny[cuisineLabelKeys[c]] ?? c.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Address */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">{t.address}</legend>
        <div>
          <label className="text-xs text-muted-foreground">{t.addressCountry}</label>
          <select
            value={addressCountry}
            onChange={(e) => { setAddressCountry(e.target.value); markDirty(); }}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {countryOptions.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t.addressStreet}</label>
          <input
            type="text"
            value={addressStreet}
            onChange={(e) => { setAddressStreet(e.target.value); markDirty(); }}
            placeholder={t.addressStreetPlaceholder}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div className="flex gap-3">
          <div className="w-1/3">
            <label className="text-xs text-muted-foreground">{t.addressPostal}</label>
            <input
              type="text"
              value={addressPostal}
              onChange={(e) => { setAddressPostal(e.target.value); markDirty(); }}
              onBlur={lookupCity}
              placeholder={t.addressPostalPlaceholder}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">{t.addressCity}</label>
            {citySuggestions.length > 1 ? (
              <select
                value={addressCity}
                onChange={(e) => { setAddressCity(e.target.value); setCitySuggestions([]); markDirty(); }}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">{t.select}</option>
                {citySuggestions.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={addressCity}
                onChange={(e) => { setAddressCity(e.target.value); markDirty(); }}
                placeholder={t.addressCityPlaceholder}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            )}
          </div>
        </div>
      </fieldset>

      {/* Allow drinks only toggle */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
        <label className="relative mt-0.5 inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={allowDrinksOnly}
            onChange={(e) => { setAllowDrinksOnly(e.target.checked); markDirty(); }}
            className="peer sr-only"
          />
          <div className="h-5 w-9 rounded-full bg-muted-foreground/30 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-background after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-full" />
        </label>
        <div>
          <span className="text-sm font-medium text-foreground">{t.allowDrinksOnly}</span>
          <p className="mt-0.5 text-xs text-gray-400">{t.allowDrinksOnlyHint}</p>
        </div>
      </div>

      {/* Google Maps link */}
      <div>
        <label className="text-sm font-medium text-foreground">{t.googleMapsLink}</label>
        <p className="mt-0.5 text-xs text-muted-foreground">{t.googleMapsLinkHint}</p>
        <input
          type="url"
          value={googleMapsLink}
          onChange={(e) => { setGoogleMapsLink(e.target.value); markDirty(); }}
          placeholder={t.googleMapsLinkPlaceholder}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>

      {/* Review nudge toggle */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
        <label className="relative mt-0.5 inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={enableReviewNudge}
            onChange={(e) => { setEnableReviewNudge(e.target.checked); markDirty(); }}
            className="peer sr-only"
          />
          <div className="h-5 w-9 rounded-full bg-muted-foreground/30 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-background after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-full" />
        </label>
        <div>
          <span className="text-sm font-medium text-foreground">{t.enableReviewNudge}</span>
          <p className="mt-0.5 text-xs text-gray-400">{t.enableReviewNudgeHint}</p>
        </div>
      </div>

      {/* ═══ Review Promo Banner ═══ */}
      <div className="space-y-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <label className="relative mt-0.5 inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={promoEnabled}
              onChange={(e) => { setPromoEnabled(e.target.checked); markDirty(); }}
              className="peer sr-only"
            />
            <div className="h-5 w-9 rounded-full bg-muted-foreground/30 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-background after:transition-all peer-checked:bg-amber-500 peer-checked:after:translate-x-full" />
          </label>
          <div>
            <span className="text-sm font-medium text-foreground">{tAny.reviewPromo}</span>
            <p className="mt-0.5 text-xs text-muted-foreground">{tAny.reviewPromoHint}</p>
          </div>
        </div>

        {promoEnabled && (
          <div className="space-y-3 pl-12">
            {/* Promo text input */}
            <div>
              <label className="text-xs font-medium text-foreground">{tAny.reviewPromoText}</label>
              <input
                type="text"
                value={promoSource}
                onChange={(e) => { if (e.target.value.length <= 120) { setPromoSource(e.target.value); markDirty(); } }}
                placeholder={tAny.reviewPromoPlaceholder}
                maxLength={120}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
              <p className="mt-0.5 text-xs text-muted-foreground">
                {promoSource.length}/120 &middot; {tAny.reviewPromoCharLimit}
              </p>
            </div>

            {/* Clickable toggle */}
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={promoClickable}
                onChange={(e) => { setPromoClickable(e.target.checked); markDirty(); }}
                className="h-4 w-4 rounded border-border accent-amber-500"
              />
              {tAny.reviewPromoClickable}
            </label>

            {promoClickable && !googleMapsLink && (
              <p className="text-xs text-amber-600 dark:text-amber-400">{tAny.reviewPromoNoGoogleMaps}</p>
            )}

            {/* Translate button */}
            <button
              type="button"
              onClick={translatePromo}
              disabled={translating || !promoSource.trim()}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {translating ? tAny.reviewPromoTranslating : tAny.reviewPromoTranslate}
            </button>

            {/* Translation preview */}
            {Object.keys(promoTranslations).length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowTranslations(!showTranslations)}
                  className="text-xs font-medium text-amber-600 hover:underline dark:text-amber-400"
                >
                  {tAny.reviewPromoPreview} ({Object.keys(promoTranslations).length}) {showTranslations ? "▲" : "▼"}
                </button>
                {showTranslations && (
                  <div className="mt-2 max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-border bg-card p-3">
                    {supportedLanguages.map((lang) => {
                      const val = promoTranslations[lang.code] ?? "";
                      if (!val) return null;
                      return (
                        <div key={lang.code} className="flex items-start gap-2">
                          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">{lang.short}</span>
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => {
                              setPromoTranslations((prev) => ({ ...prev, [lang.code]: e.target.value }));
                              markDirty();
                            }}
                            className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 -mx-4 mt-6 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm lg:-mx-6 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || saved}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? t.saving : saved ? `✓ ${t.saved}` : t.saveChanges}
          </button>
          {dirty && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {t.unsavedChanges}
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
