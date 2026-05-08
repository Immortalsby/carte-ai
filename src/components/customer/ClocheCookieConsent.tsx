"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LanguageCode } from "@/types/menu";
import {
  ANALYTICS_CONSENT_KEY,
  setAnalyticsConsent,
  analyticsConsentState,
  resetAnalyticsConsent,
} from "@/lib/analytics-client";

const messages: Record<string, {
  text: string;
  detail: string;
  accept: string;
  reject: string;
  settings: string;
  settingsTitle: string;
  essential: string;
  essentialDesc: string;
  analytics: string;
  analyticsDesc: string;
  alwaysOn: string;
  save: string;
}> = {
  en: {
    text: "We use cookies to improve your experience.",
    detail: "Essential cookies keep the site working. Analytics cookies help us understand how you use CarteAI so we can improve it — they are only activated with your consent.",
    accept: "Accept all",
    reject: "Essential only",
    settings: "Cookie settings",
    settingsTitle: "Cookie Preferences",
    essential: "Essential cookies",
    essentialDesc: "Required for the site to function (authentication, language, timezone). Cannot be disabled.",
    analytics: "Analytics cookies",
    analyticsDesc: "Help us understand usage patterns (scans, recommendations, dwell time). No personal data is shared with third parties.",
    alwaysOn: "Always on",
    save: "Save preferences",
  },
  fr: {
    text: "Nous utilisons des cookies pour améliorer votre expérience.",
    detail: "Les cookies essentiels assurent le fonctionnement du site. Les cookies analytiques nous aident à comprendre comment vous utilisez CarteAI — ils ne sont activés qu'avec votre consentement.",
    accept: "Tout accepter",
    reject: "Essentiels uniquement",
    settings: "Paramètres cookies",
    settingsTitle: "Préférences de cookies",
    essential: "Cookies essentiels",
    essentialDesc: "Nécessaires au fonctionnement du site (authentification, langue, fuseau horaire). Ne peuvent pas être désactivés.",
    analytics: "Cookies analytiques",
    analyticsDesc: "Nous aident à comprendre les usages (scans, recommandations, temps de consultation). Aucune donnée personnelle n'est partagée avec des tiers.",
    alwaysOn: "Toujours actifs",
    save: "Enregistrer",
  },
  zh: {
    text: "我们使用 Cookie 来改善您的体验。",
    detail: "基本 Cookie 保证网站正常运行。分析 Cookie 帮助我们了解您如何使用 CarteAI——仅在您同意后才会启用。",
    accept: "全部接受",
    reject: "仅必要 Cookie",
    settings: "Cookie 设置",
    settingsTitle: "Cookie 偏好设置",
    essential: "必要 Cookie",
    essentialDesc: "网站正常运行所必需的（身份验证、语言、时区），无法关闭。",
    analytics: "分析 Cookie",
    analyticsDesc: "帮助我们了解使用情况（扫码、推荐、停留时间），不会与第三方共享个人数据。",
    alwaysOn: "始终开启",
    save: "保存设置",
  },
};

function getMsg(lang: string) {
  if (lang in messages) return messages[lang];
  if (lang.startsWith("fr")) return messages.fr;
  if (lang.startsWith("zh")) return messages.zh;
  return messages.en;
}

interface Props {
  lang: LanguageCode;
}

export function ClocheCookieConsent({ lang }: Props) {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(false);

  useEffect(() => {
    const state = analyticsConsentState();
    if (state === "pending") {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleAcceptAll() {
    setAnalyticsConsent(true);
    setVisible(false);
  }

  function handleRejectAnalytics() {
    setAnalyticsConsent(false);
    setVisible(false);
  }

  function handleSaveSettings() {
    setAnalyticsConsent(analyticsOn);
    setVisible(false);
    setShowSettings(false);
  }

  const msg = getMsg(lang);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-[70] sm:left-4 sm:right-auto sm:max-w-[360px]"
        >
          <div
            className="rounded-2xl border p-4 shadow-lg"
            style={{
              backgroundColor: "var(--carte-surface)",
              borderColor: "var(--carte-border)",
            }}
          >
            {/* Cloche icon */}
            <div className="mb-2 flex items-center gap-2">
              <svg viewBox="0 0 120 100" className="h-8 w-10" aria-hidden="true">
                <path d="M60,4 L62,12 L70,14 L62,16 L60,24 L58,16 L50,14 L58,12 Z" fill="#d4a574" opacity=".8" />
                <ellipse cx="60" cy="76" rx="50" ry="5" fill="#10b981" />
                <path d="M16,74 A44,40 0 0 1 104,74" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
                <path d="M34,62 A30,28 0 0 1 56,40" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" opacity=".55" />
                <ellipse cx="42" cy="56" rx="6" ry="7" fill="#fafaf7" stroke="#050507" strokeWidth="1.2" />
                <ellipse cx="43" cy="57" rx="3.5" ry="4.5" fill="#050507" />
                <ellipse cx="44.5" cy="55" rx="1.3" ry="1.5" fill="#fafaf7" />
              </svg>
              <span className="text-xs font-semibold" style={{ color: "var(--carte-text)" }}>
                Cookie
              </span>
            </div>

            {!showSettings ? (
              <>
                <p className="text-sm leading-relaxed" style={{ color: "var(--carte-text)" }}>
                  {msg.text}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--carte-text-muted)" }}>
                  {msg.detail}
                </p>

                {/* Accept / Reject — same prominence */}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="flex-1 rounded-xl py-2 text-sm font-semibold text-white transition-colors"
                    style={{ backgroundColor: "#10b981" }}
                  >
                    {msg.accept}
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectAnalytics}
                    className="flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors"
                    style={{
                      borderColor: "var(--carte-border)",
                      color: "var(--carte-text)",
                      backgroundColor: "var(--carte-surface)",
                    }}
                  >
                    {msg.reject}
                  </button>
                </div>

                {/* Settings link */}
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="mt-2 w-full text-center text-xs underline underline-offset-2 transition-colors"
                  style={{ color: "var(--carte-text-dim)" }}
                >
                  {msg.settings}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold" style={{ color: "var(--carte-text)" }}>
                  {msg.settingsTitle}
                </p>

                {/* Essential — always on */}
                <div className="mt-3 flex items-start gap-3 rounded-lg border p-3" style={{ borderColor: "var(--carte-border)" }}>
                  <div className="mt-0.5 h-5 w-9 shrink-0 rounded-full bg-emerald-500 opacity-60" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium" style={{ color: "var(--carte-text)" }}>{msg.essential}</p>
                    <p className="mt-0.5 text-[11px]" style={{ color: "var(--carte-text-dim)" }}>{msg.essentialDesc}</p>
                    <span className="mt-1 inline-block text-[10px] font-medium" style={{ color: "var(--carte-text-dim)" }}>{msg.alwaysOn}</span>
                  </div>
                </div>

                {/* Analytics — toggleable */}
                <div className="mt-2 flex items-start gap-3 rounded-lg border p-3" style={{ borderColor: "var(--carte-border)" }}>
                  <label className="relative mt-0.5 inline-flex shrink-0 cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={analyticsOn}
                      onChange={(e) => setAnalyticsOn(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div
                      className="h-5 w-9 rounded-full after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:transition-all peer-checked:after:translate-x-full"
                      style={{
                        backgroundColor: analyticsOn ? "#10b981" : "var(--carte-border)",
                      }}
                    >
                      <div
                        className="absolute left-[2px] top-[2px] h-4 w-4 rounded-full transition-transform"
                        style={{
                          backgroundColor: "var(--carte-bg, #fff)",
                          transform: analyticsOn ? "translateX(100%)" : "translateX(0)",
                        }}
                      />
                    </div>
                  </label>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium" style={{ color: "var(--carte-text)" }}>{msg.analytics}</p>
                    <p className="mt-0.5 text-[11px]" style={{ color: "var(--carte-text-dim)" }}>{msg.analyticsDesc}</p>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="flex-1 rounded-xl py-2 text-sm font-semibold text-white transition-colors"
                    style={{ backgroundColor: "#10b981" }}
                  >
                    {msg.save}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="rounded-xl border px-3 py-2 text-sm transition-colors"
                    style={{
                      borderColor: "var(--carte-border)",
                      color: "var(--carte-text-muted)",
                    }}
                  >
                    ←
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Small button to re-open cookie settings (for consent withdrawal).
 * Place in the page footer so users can always change their mind.
 */
export function CookieSettingsButton({ lang }: { lang: LanguageCode }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if user has already made a choice
    setVisible(analyticsConsentState() !== "pending");
  }, []);

  function handleReset() {
    resetAnalyticsConsent();
    window.location.reload();
  }

  if (!visible) return null;

  const label = lang === "zh" ? "Cookie 设置" : lang === "fr" ? "Paramètres cookies" : "Cookie settings";

  return (
    <button
      type="button"
      onClick={handleReset}
      className="text-[10px] underline underline-offset-2"
      style={{ color: "var(--carte-text-dim)" }}
    >
      {label}
    </button>
  );
}
