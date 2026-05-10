"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LanguageCode } from "@/types/menu";
import { GlobeIcon } from "@phosphor-icons/react";

const languageNames: Partial<Record<LanguageCode, string>> = {
  fr: "Français",
  en: "English",
  zh: "中文",
  "zh-Hant": "繁體",
  es: "Español",
  it: "Italiano",
  de: "Deutsch",
  pt: "Português",
  ar: "العربية",
  ja: "日本語",
  ko: "한국어",
  ru: "Русский",
  tr: "Türkçe",
  nl: "Nederlands",
  vi: "Tiếng Việt",
  th: "ไทย",
  hi: "हिन्दी",
};

// Default primary languages shown in the picker
const defaultPrimaryLanguages: LanguageCode[] = ["fr", "en", "zh", "ja", "es"];

interface LanguageSwitcherProps {
  current: LanguageCode;
  onChange: (lang: LanguageCode) => void;
  /** Browser-detected language — always shown first */
  detectedLang?: LanguageCode;
}

export function LanguageSwitcher({ current, onChange, detectedLang }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);

  // Build primary list: detected language first (if not already in defaults)
  const primaryLanguages = (() => {
    if (!detectedLang || defaultPrimaryLanguages.includes(detectedLang) || !languageNames[detectedLang]) {
      return defaultPrimaryLanguages;
    }
    return [detectedLang, ...defaultPrimaryLanguages.slice(0, 4)];
  })();

  const allLanguages = [
    ...primaryLanguages,
    ...(Object.keys(languageNames) as LanguageCode[]).filter((c) => !primaryLanguages.includes(c)),
  ];

  function select(lang: LanguageCode) {
    onChange(lang);
    setOpen(false);
  }

  return (
    <>
      {/* Compact trigger — just the current language name + globe icon */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative inline-flex items-center gap-1.5 rounded-full border border-carte-border/50 px-2.5 py-1 text-xs text-carte-text-dim transition-colors hover:border-carte-text-muted hover:text-carte-text-muted"
      >
        <GlobeIcon weight="regular" className="h-3.5 w-3.5" />
        {languageNames[current] || current}
      </button>

      {/* Full language picker — modal overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="lang-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <motion.div
              initial={{ y: 30, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 30, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full rounded-2xl border border-carte-border bg-carte-bg p-5 shadow-2xl"
              style={{ maxWidth: 360 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-carte-text">
                  {current === "zh" ? "选择语言" : current === "fr" ? "Choisir la langue" : "Choose language"}
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-lg text-carte-text-dim hover:text-carte-text"
                >
                  &times;
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {allLanguages.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => select(lang)}
                    className={`min-h-[40px] rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                      current === lang
                        ? "bg-carte-primary/15 font-medium text-carte-primary"
                        : "text-carte-text hover:bg-carte-surface"
                    }`}
                  >
                    {languageNames[lang]}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
