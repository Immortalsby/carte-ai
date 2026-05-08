"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LanguageCode } from "@/types/menu";

const COOKIE_KEY = "carte-cookie-consent";

const messages: Record<string, { text: string; btn: string }> = {
  en: {
    text: "I only use tiny essential cookies to work properly — no tracking, promise!",
    btn: "Got it, chef!",
  },
  fr: {
    text: "Je n\u2019utilise que des cookies essentiels pour fonctionner \u2014 aucun tracking, promis\u00a0!",
    btn: "Compris, chef\u00a0!",
  },
  zh: {
    text: "\u6211\u53ea\u7528\u5fc5\u8981\u7684 Cookie \u6765\u6b63\u5e38\u5de5\u4f5c\u2014\u2014\u7edd\u4e0d\u8ffd\u8e2a\uff0c\u4fdd\u8bc1\uff01",
    btn: "\u7761\u89c9\uff0c\u5927\u53a8\uff01",
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

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) {
      // Small delay so it doesn't compete with page load animations
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
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
          className="fixed bottom-4 left-4 z-50 max-w-[300px]"
        >
          <div
            className="relative rounded-2xl border p-4 shadow-lg"
            style={{
              backgroundColor: "var(--carte-surface)",
              borderColor: "var(--carte-border)",
            }}
          >
            {/* Cloche icon */}
            <div className="mb-2 flex items-center gap-2">
              <svg viewBox="0 0 120 100" className="h-8 w-10" aria-hidden="true">
                <path d="M60,4 L62,12 L70,14 L62,16 L60,24 L58,16 L50,14 L58,12 Z" fill="#d4a574" opacity=".8"/>
                <ellipse cx="60" cy="76" rx="50" ry="5" fill="#10b981"/>
                <path d="M16,74 A44,40 0 0 1 104,74" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round"/>
                <path d="M34,62 A30,28 0 0 1 56,40" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" opacity=".55"/>
                <ellipse cx="42" cy="56" rx="6" ry="7" fill="#fafaf7" stroke="#050507" strokeWidth="1.2"/>
                <ellipse cx="43" cy="57" rx="3.5" ry="4.5" fill="#050507"/>
                <ellipse cx="44.5" cy="55" rx="1.3" ry="1.5" fill="#fafaf7"/>
              </svg>
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--carte-text)" }}
              >
                Cookie
              </span>
            </div>

            {/* Message */}
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--carte-text-muted)" }}
            >
              {msg.text}
            </p>

            {/* Button */}
            <button
              type="button"
              onClick={accept}
              className="mt-3 w-full rounded-xl py-2 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: "#10b981" }}
            >
              {msg.btn}
            </button>
          </div>

          {/* Speech bubble tail */}
          <div
            className="absolute -bottom-2 left-6 h-4 w-4 rotate-45 border-b border-r"
            style={{
              backgroundColor: "var(--carte-surface)",
              borderColor: "var(--carte-border)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
