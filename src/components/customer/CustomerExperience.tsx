"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import type { LanguageCode, Allergen, RestaurantMenu } from "@/types/menu";
import type { PlanStatus } from "@/lib/trial";
import { detectLanguage } from "@/lib/languages";
import { trackEvent } from "@/lib/analytics-client";
import { isCultureMatch } from "@/lib/culture-match";
import { languageDirection } from "@/lib/languages";
import { useWishlist } from "@/hooks/useWishlist";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MenuBrowser } from "./MenuBrowser";
import { RestaurantHeader } from "./RestaurantHeader";

// Lazy-loaded components — not needed for first paint
const MascotAssistant = dynamic(
  () => import("./MascotAssistant").then((m) => m.MascotAssistant),
  { ssr: false },
);
const AllergenFilter = dynamic(
  () => import("./AllergenFilter").then((m) => m.AllergenFilter),
);
const SharePanel = dynamic(
  () => import("./SharePanel").then((m) => m.SharePanel),
);
const WishlistPanel = dynamic(
  () => import("./WishlistPanel").then((m) => m.WishlistPanel),
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

export type ExperienceMode = "tourist" | "group_meal";

interface CustomerExperienceProps {
  menu: RestaurantMenu;
  tenantId: string;
  cuisineType?: string | null;
  rating?: string | null;
  address?: string | null;
  planStatus?: PlanStatus;
  allowDrinksOnly?: boolean;
  googleMapsUrl?: string;
  enableReviewNudge?: boolean;
}

export function CustomerExperience({ menu, tenantId, cuisineType, rating, address, planStatus, allowDrinksOnly = true, googleMapsUrl, enableReviewNudge = false }: CustomerExperienceProps) {
  const [lang, setLang] = useState<LanguageCode>("fr");
  const [excludedAllergens, setExcludedAllergens] = useState<Allergen[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>("tourist");
  const [showShareBubble, setShowShareBubble] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const wishlist = useWishlist();
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
    trackEvent(tenantId, "scan", { slug: menu.restaurant.slug }, detected);

    // Cultural awareness: auto-switch to group meal mode (FR16)
    if (isCultureMatch(detected, cuisineType)) {
      setExperienceMode("group_meal");
      trackEvent(tenantId, "culture_match", { cuisineType, detectedLang: detected }, detected);
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

  // Track mode switch button clicks (FR37)
  function toggleExperienceMode() {
    const newMode = experienceMode === "tourist" ? "group_meal" : "tourist";
    setExperienceMode(newMode);
    trackEvent(tenantId, "mode_switch", { from: experienceMode, to: newMode }, lang);
  }

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

  const filterLabel =
    lang === "zh"
      ? `\u8fc7\u6ee4 ${excludedAllergens.length > 0 ? `(${excludedAllergens.length})` : ""}`
      : lang === "fr"
        ? `Filtres ${excludedAllergens.length > 0 ? `(${excludedAllergens.length})` : ""}`
        : `Filter ${excludedAllergens.length > 0 ? `(${excludedAllergens.length})` : ""}`;

  // Mode switch button labels (FR18: subtle, discoverable)
  const modeSwitchLabel =
    experienceMode === "group_meal"
      ? lang === "zh"
        ? "\u7b2c\u4e00\u6b21\u6765\u8fd9\u5bb6\uff1f"
        : lang === "fr"
          ? "Premi\u00e8re visite ?"
          : "First time here?"
      : lang === "zh"
        ? "\u7ec4\u83dc\u987e\u95ee"
        : lang === "fr"
          ? "Conseiller repas"
          : "Group meal advisor";

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
      {/* Restaurant header with cuisine theming */}
      <RestaurantHeader
        name={menu.restaurant.name}
        cuisineType={cuisineType}
        rating={rating}
        address={address}
        lang={lang}
      />

      {/* Language switcher */}
      <div className="mt-4">
        <LanguageSwitcher current={lang} onChange={setLang} />
      </div>

      {/* Mascot Assistant (fixed position, always visible) */}
      <MascotAssistant
        lang={lang}
        menu={menu}
        excludedAllergens={excludedAllergens}
        tenantId={tenantId}
        experienceMode={experienceMode}
        cuisineType={cuisineType}
        planStatus={planStatus}
        allowDrinksOnly={allowDrinksOnly}
        googleMapsUrl={enableReviewNudge ? googleMapsUrl : undefined}

        shareMessage={
          showShareBubble && !showShare
            ? lang === "zh" ? "用得不错？分享给朋友吧~" : lang === "fr" ? "Vous aimez ? Partagez !" : "Enjoying it? Share with friends!"
            : null
        }
        onShareClick={() => { setShowShareBubble(false); setShowShare(true); }}
        onResults={() => {}}
        postMealDelayMs={90_000}
        onPostMealDone={() => setTimeout(() => setShowShareBubble(true), 3000)}
        savedDishIds={wishlist.savedIds}
        onToggleSave={handleToggleSave}
      />

      {/* Filter toggle */}
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="min-h-[44px] rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
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
          {filterLabel}
        </button>
        {excludedAllergens.length > 0 && (
          <span className="text-xs text-carte-text-dim">
            {filteredDishes.length}/{menu.dishes.filter((d) => d.available).length}
          </span>
        )}
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

      {/* Menu browser */}
      <MenuBrowser
        dishes={filteredDishes}
        lang={lang}
        restaurantName={menu.restaurant.name}
        cuisine={cuisineType ?? undefined}
        tenantId={tenantId}
        tenantSlug={menu.restaurant.slug}

      />

      {/* Mode switch + share buttons — subtle, at bottom (FR18) */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={toggleExperienceMode}
          className="text-xs text-carte-text-dim underline-offset-2 hover:text-carte-text-muted hover:underline"
        >
          {modeSwitchLabel}
        </button>
        <button
          type="button"
          onClick={() => setShowShare(true)}
          className="text-xs text-carte-text-dim underline-offset-2 hover:text-carte-text-muted hover:underline"
        >
          {lang === "zh" ? "\u5206\u4eab" : lang === "fr" ? "Partager" : "Share"}
        </button>
      </div>


      {/* Wishlist floating button (bottom-left, same height as mascot) */}
      {wishlist.count > 0 && !showWishlist && (
        <button
          type="button"
          onClick={() => setShowWishlist(true)}
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
      />

      {/* Share panel */}
      <SharePanel
        visible={showShare}
        lang={lang}
        restaurantName={menu.restaurant.name}
        slug={menu.restaurant.slug}
        tenantId={tenantId}
        onClose={() => setShowShare(false)}
      />

      {/* Allergen disclaimer — always visible per FR29, WCAG role="alert" */}
      <footer
        role="alert"
        className="mt-8 rounded-lg border border-carte-border bg-carte-surface p-3 text-center text-xs text-carte-warning"
      >
        {lang === "zh"
          ? "过敏原信息仅供参考。下单前请与服务员确认。"
          : lang === "fr"
            ? "Les informations sur les allergènes sont fournies à titre indicatif. Veuillez confirmer auprès de votre serveur avant de commander."
            : "Allergen information is provided for reference only. Please confirm with your server before ordering."}
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
