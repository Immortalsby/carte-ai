"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LanguageCode } from "@/types/menu";

const languageNames: Partial<Record<LanguageCode, string>> = {
  fr: "Fran\u00e7ais",
  en: "English",
  zh: "\u4e2d\u6587",
  "zh-Hant": "\u7e41\u9ad4",
  es: "Espa\u00f1ol",
  it: "Italiano",
  de: "Deutsch",
  pt: "Portugu\u00eas",
  ar: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
  ja: "\u65e5\u672c\u8a9e",
  ko: "\ud55c\uad6d\uc5b4",
  ru: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439",
  tr: "T\u00fcrk\u00e7e",
  nl: "Nederlands",
  vi: "Ti\u1ebfng Vi\u1ec7t",
  th: "\u0e44\u0e17\u0e22",
  hi: "\u0939\u093f\u0928\u094d\u0926\u0940",
};

// Primary languages shown as buttons
const primaryLanguages: LanguageCode[] = ["fr", "en", "zh", "ja", "es"];

// All other languages shown in the modal
const secondaryLanguages: LanguageCode[] = (
  Object.keys(languageNames) as LanguageCode[]
).filter((code) => !primaryLanguages.includes(code));

interface LanguageSwitcherProps {
  current: LanguageCode;
  onChange: (lang: LanguageCode) => void;
}

export function LanguageSwitcher({ current, onChange }: LanguageSwitcherProps) {
  const [modalOpen, setModalOpen] = useState(false);

  // If current language is a secondary one, show it's selected in the "more" button
  const currentIsSecondary = secondaryLanguages.includes(current);

  function selectLanguage(lang: LanguageCode) {
    onChange(lang);
    setModalOpen(false);
  }

  return (
    <>
      <div className="flex flex-wrap justify-center gap-1.5">
        {primaryLanguages.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => onChange(lang)}
            className={`min-h-[44px] rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              current === lang
                ? "bg-carte-primary text-carte-bg"
                : "bg-carte-surface text-carte-text-muted hover:bg-carte-surface-hover"
            }`}
          >
            {languageNames[lang]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`min-h-[44px] rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            currentIsSecondary
              ? "bg-carte-primary text-carte-bg"
              : "bg-carte-surface text-carte-text-muted hover:bg-carte-surface-hover"
          }`}
          aria-label="More languages"
        >
          {currentIsSecondary ? languageNames[current] : "..."}
        </button>
      </div>

      {/* Language picker modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            key="lang-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setModalOpen(false);
            }}
          >
            <motion.div
              initial={{ y: 30, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 30, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full rounded-2xl border border-[#2a2a32] bg-[#1a1a20] p-5 shadow-2xl"
              style={{ maxWidth: 360 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#f0ece3]">
                  {current === "zh" ? "选择语言" : current === "fr" ? "Choisir la langue" : "Choose language"}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-lg text-[#7a7a82] hover:text-[#f0ece3]"
                >
                  &times;
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {secondaryLanguages.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => selectLanguage(lang)}
                    className={`min-h-[44px] rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      current === lang
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "text-[#f0ece3] hover:bg-[#2a2a32]"
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
