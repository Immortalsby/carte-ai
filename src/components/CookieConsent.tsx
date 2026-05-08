"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_KEY = "carte-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0a0a0c]/95 px-5 py-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/70">
          Ce site utilise uniquement des cookies essentiels au fonctionnement du service.{" "}
          <Link href="/cookies" className="text-emerald-400 hover:underline">
            En savoir plus
          </Link>
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
        >
          Compris
        </button>
      </div>
    </div>
  );
}
