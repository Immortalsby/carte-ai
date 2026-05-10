"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import type { LanguageCode, Allergen, RestaurantMenu } from "@/types/menu";
import type { PlanStatus } from "@/lib/trial";
import { detectLanguage } from "@/lib/languages";
import { trackEvent } from "@/lib/analytics-client";
import { languageDirection } from "@/lib/languages";
import { useWishlist } from "@/hooks/useWishlist";
import { getDictionary } from "@/lib/i18n";
import { FunnelIcon, QuestionIcon } from "@phosphor-icons/react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MenuBrowser } from "./MenuBrowser";
import { RestaurantHeader } from "./RestaurantHeader";

// Lazy-loaded components — not needed for first paint
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MascotAssistant = dynamic(
  () => import("./MascotAssistant").then((m) => m.MascotAssistant),
  { ssr: false },
) as any;
const AllergenFilter = dynamic(
  () => import("./AllergenFilter").then((m) => m.AllergenFilter),
);
const SharePanel = dynamic(
  () => import("./SharePanel").then((m) => m.SharePanel),
);
const WishlistPanel = dynamic(
  () => import("./WishlistPanel").then((m) => m.WishlistPanel),
);
const WaiterSummary = dynamic(
  () => import("./WaiterSummary").then((m) => m.WaiterSummary),
  { ssr: false },
);
const ClocheGuide = dynamic(
  () => import("./ClocheGuide").then((m) => m.ClocheGuide),
);
const ClocheCookieConsent = dynamic(
  () => import("./ClocheCookieConsent").then((m) => m.ClocheCookieConsent),
  { ssr: false },
);
const CookieSettingsButton = dynamic(
  () => import("./ClocheCookieConsent").then((m) => m.CookieSettingsButton),
);
const Turnstile = dynamic(
  () => import("@marsidev/react-turnstile").then((m) => m.Turnstile),
  { ssr: false },
);

interface CustomerExperienceProps {
  menu: RestaurantMenu;
  tenantId: string;
  tenantName: string;
  cuisineType?: string | null;
  rating?: string | null;
  address?: string | null;
  planStatus?: PlanStatus;
  allowDrinksOnly?: boolean;
  googleMapsUrl?: string;
  enableReviewNudge?: boolean;
  addressCountry?: string;
}

export function CustomerExperience({ menu: initialMenu, tenantId, tenantName, cuisineType, rating, address, planStatus, allowDrinksOnly = true, googleMapsUrl, enableReviewNudge = false, addressCountry }: CustomerExperienceProps) {
  const [menu, setMenu] = useState(initialMenu);
  const [lang, setLang] = useState<LanguageCode>("fr");
  const [excludedAllergens, setExcludedAllergens] = useState<Allergen[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showShareBubble, setShowShareBubble] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [highlightDishId, setHighlightDishId] = useState<string | null>(null);
  const [detectedLang, setDetectedLang] = useState<LanguageCode | undefined>(undefined);
  const [showWaiterSummary, setShowWaiterSummary] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [translating, setTranslating] = useState(false);
  const translatedLangsRef = useRef<Set<string>>(new Set(["zh", "fr", "en"]));
  const wishlist = useWishlist(menu.restaurant.slug);
  const turnstileTokenRef = useRef<string | null>(null);
  const handleTurnstileSuccess = useCallback((token: string) => {
    turnstileTokenRef.current = token;
    // Verify once with server → sets httpOnly session cookie for subsequent API calls
    fetch("/api/verify-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => {});
  }, []);

  // Auto-detect browser language on mount + track scan + culture match (FR16)
  useEffect(() => {
    const detected = detectLanguage({ accept: [...navigator.languages], fallback: "fr" }) as LanguageCode;
    setLang(detected);
    setDetectedLang(detected);
    // Deduplicate scans: one per slug per browser tab session
    const scanKey = `carte-scanned-${menu.restaurant.slug}`;
    try {
      if (!sessionStorage.getItem(scanKey)) {
        trackEvent(tenantId, "scan", { slug: menu.restaurant.slug }, detected);
        sessionStorage.setItem(scanKey, "1");
      }
    } catch {
      // sessionStorage unavailable (private browsing) — send anyway
      trackEvent(tenantId, "scan", { slug: menu.restaurant.slug }, detected);
    }

    // Dwell time tracking (FR35): track when user leaves the page
    const entryTime = Date.now();
    const trackDwell = () => {
      const dwellSeconds = Math.round((Date.now() - entryTime) / 1000);
      if (dwellSeconds >= 3) {
        trackEvent(tenantId, "dwell", { seconds: dwellSeconds, slug: menu.restaurant.slug }, detected);
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") trackDwell();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", trackDwell);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", trackDwell);
    };
  }, [tenantId, menu.restaurant.slug, cuisineType]);

  // On-demand menu translation: when user switches to a non-core language,
  // check if dishes have translations. If not, trigger LLM translation.
  useEffect(() => {
    if (["zh", "fr", "en"].includes(lang)) return;
    if (translatedLangsRef.current.has(lang)) return;

    // Check if most dishes already have translations for this language
    const missing = menu.dishes.filter((d) => !d.name[lang] || !d.description[lang]);
    if (missing.length === 0) {
      translatedLangsRef.current.add(lang);
      return;
    }

    setTranslating(true);
    fetch("/api/translate-menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: menu.restaurant.slug, targetLang: lang }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.count > 0) {
          // Re-fetch the menu to get updated translations
          fetch(`/api/menus/${menu.restaurant.slug}`)
            .then((r) => r.json())
            .then((updated) => {
              if (updated?.dishes?.length > 0) {
                setMenu(updated);
              }
            })
            .catch(() => {});
        }
        translatedLangsRef.current.add(lang);
      })
      .catch(() => {})
      .finally(() => setTranslating(false));
  }, [lang, menu.restaurant.slug, menu.dishes]);

  // Filter dishes by excluded allergens
  const filteredDishes = menu.dishes.filter((dish) => {
    if (excludedAllergens.length === 0) return true;
    return !dish.allergens.some((a) => excludedAllergens.includes(a));
  });

  // Wrap wishlist toggle to fire analytics event
  const handleToggleSave = (dishIds: string[]) => {
    for (const id of dishIds) {
      const willBeSaved = !wishlist.isSaved(id);
      trackEvent(tenantId, "wishlist_heart", { dishId: id, saved: willBeSaved }, lang);
    }
    wishlist.toggle(dishIds);
  };

  const t = getDictionary(lang);

  const filterLabel = excludedAllergens.length > 0
    ? `${t.filter} (${excludedAllergens.length})`
    : t.filter;

  const dir = languageDirection(lang);

  return (
    <div dir={dir}>
      <ClocheCookieConsent lang={lang} />
      {/* Invisible Turnstile widget for bot protection */}
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          options={{ size: "invisible" }}
          onSuccess={handleTurnstileSuccess}
        />
      )}
      {/* Restaurant header with cuisine theming + language switcher */}
      <RestaurantHeader
        name={tenantName}
        cuisineType={cuisineType}
        rating={rating}
        address={address}
        lang={lang}
      >
        <LanguageSwitcher current={lang} onChange={setLang} detectedLang={detectedLang} />
      </RestaurantHeader>

      {/* Mascot Assistant (fixed position, always visible) */}
      <MascotAssistant
        lang={lang}
        menu={menu}
        excludedAllergens={excludedAllergens}
        tenantId={tenantId}
        cuisineType={cuisineType}
        planStatus={planStatus}
        allowDrinksOnly={allowDrinksOnly}
        googleMapsUrl={enableReviewNudge ? googleMapsUrl : undefined}

        shareMessage={
          showShareBubble && !showShare
            ? t.sharePrompt
            : null
        }
        onShareClick={() => { setShowShareBubble(false); setShowShare(true); }}
        onResults={() => {}}
        postMealDelayMs={90_000}
        onPostMealDone={() => setTimeout(() => setShowShareBubble(true), 3000)}
        savedDishIds={wishlist.savedIds}
        onToggleSave={handleToggleSave}
        onPopularDishClick={(id: string) => setHighlightDishId(id)}
      />

      {/* Toolbar: filter + guide */}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex min-h-[36px] items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
          style={
            excludedAllergens.length > 0
              ? {
                  backgroundColor: "color-mix(in srgb, var(--carte-danger) 20%, transparent)",
                  color: "var(--carte-danger)",
                }
              : {
                  backgroundColor: "var(--carte-surface)",
                  color: "var(--carte-text-muted)",
                }
          }
        >
          <FunnelIcon weight="duotone" className="h-3.5 w-3.5" />
          {filterLabel}
        </button>
        {excludedAllergens.length > 0 && (
          <span className="text-xs tabular-nums text-carte-text-dim">
            {filteredDishes.length}/{menu.dishes.filter((d) => d.available).length}
          </span>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="flex min-h-[36px] items-center gap-1.5 rounded-full border border-carte-primary/30 px-3 py-1.5 text-xs font-medium text-carte-primary transition-colors hover:bg-carte-primary/10"
        >
          <QuestionIcon weight="bold" className="h-3.5 w-3.5" />
          {t.guide}
        </button>
      </div>

      {showFilters && (
        <div className="mt-2">
          <AllergenFilter
            excluded={excludedAllergens}
            onChange={setExcludedAllergens}
            lang={lang}
          />
        </div>
      )}

      {/* On-demand translation banner */}
      {translating && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-carte-primary/20 bg-carte-primary/5 px-3 py-2.5 text-xs text-carte-text-muted animate-fade-in">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-carte-primary border-t-transparent" />
          {t.translating}
        </div>
      )}

      {/* Menu browser */}
      <MenuBrowser
        dishes={filteredDishes}
        lang={lang}
        restaurantName={tenantName}
        cuisine={cuisineType ?? undefined}
        tenantId={tenantId}
        tenantSlug={menu.restaurant.slug}
        openDishId={highlightDishId}
        onOpenDishIdHandled={useCallback(() => setHighlightDishId(null), [])}
        isSaved={(id) => wishlist.isSaved(id)}
        onToggleSave={(id) => handleToggleSave([id])}
      />

      {/* Share button — subtle, at bottom */}
      <div className="mt-6 flex items-center justify-center">
        <button
          type="button"
          onClick={() => { setShowWishlist(false); setShowShare(true); }}
          className="text-xs text-carte-text-dim underline-offset-2 hover:text-carte-text-muted hover:underline"
        >
          {t.share}
        </button>
      </div>


      {/* Wishlist floating button (bottom-left, same height as mascot) */}
      {wishlist.count > 0 && !showWishlist && (
        <button
          type="button"
          onClick={() => { setShowShare(false); setShowWishlist(true); }}
          className="fixed z-50 flex items-center gap-1.5 rounded-full border border-carte-border bg-carte-surface/80 backdrop-blur-md px-3 py-2.5 shadow-md transition-all duration-300 hover:border-carte-primary/30 animate-fade-in"
          style={{ insetInlineStart: "1rem", bottom: "calc(clamp(120px,24vw,140px) / 2 - 0.2rem)", transform: "translateY(50%)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              fill="var(--carte-danger)"
              stroke="var(--carte-danger)"
            />
          </svg>
          <span className="text-xs font-medium tabular-nums text-carte-text">
            {wishlist.count}
          </span>
        </button>
      )}

      {/* Wishlist panel */}
      <WishlistPanel
        visible={showWishlist}
        lang={lang}
        dishes={wishlist.savedIds
          .map((id) => menu.dishes.find((d) => d.id === id))
          .filter(Boolean) as import("@/types/menu").Dish[]}
        cuisine={cuisineType ?? undefined}
        tenantId={tenantId}
        onRemove={(id) => handleToggleSave([id])}
        onClear={wishlist.clear}
        onClose={() => setShowWishlist(false)}
        onDishTap={(dish) => {
          setShowWishlist(false);
          setHighlightDishId(dish.id);
        }}
        onShowWaiter={() => {
          setShowWishlist(false);
          setShowWaiterSummary(true);
        }}
      />

      {/* Waiter summary */}
      <WaiterSummary
        visible={showWaiterSummary}
        lang={lang}
        dishes={wishlist.savedIds
          .map((id) => menu.dishes.find((d) => d.id === id))
          .filter(Boolean) as import("@/types/menu").Dish[]}
        addressCountry={addressCountry}
        cuisine={cuisineType ?? undefined}
        tenantSlug={menu.restaurant.slug}
        onClose={() => setShowWaiterSummary(false)}
      />

      {/* Cloché guide */}
      <ClocheGuide visible={showGuide} lang={lang} onClose={() => setShowGuide(false)} />

      {/* Share panel */}
      <SharePanel
        visible={showShare}
        lang={lang}
        restaurantName={tenantName}
        slug={menu.restaurant.slug}
        tenantId={tenantId}
        onClose={() => setShowShare(false)}
      />

      {/* Allergen disclaimer — always visible per FR29, WCAG role="alert" */}
      <footer
        role="alert"
        className="mt-8 rounded-lg border border-carte-border bg-carte-surface p-3 text-center text-xs text-carte-warning"
      >
        {t.allergenDisclaimer}
      </footer>

      {/* Contact email (FR57) + cookie settings */}
      <p className="mt-4 text-center text-[10px] text-carte-text-dim">
        Powered by CarteAI &middot;{" "}
        <a
          href="mailto:contact@carte-ai.link"
          className="underline underline-offset-2 hover:text-carte-text-muted"
        >
          contact@carte-ai.link
        </a>
        {" "}&middot;{" "}
        <CookieSettingsButton lang={lang} />
      </p>
    </div>
  );
}
