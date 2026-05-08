"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  setAnalyticsConsent,
  analyticsConsentState,
  resetAnalyticsConsent,
} from "@/lib/analytics-client";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (analyticsConsentState() === "pending") {
      setVisible(true);
    }
  }, []);

  function accept() {
    setAnalyticsConsent(true);
    setVisible(false);
  }

  function reject() {
    setAnalyticsConsent(false);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0a0a0c]/95 px-5 py-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-white/70">
            Ce site utilise des cookies essentiels et, avec votre accord, des cookies analytiques pour améliorer le service.{" "}
            <Link href="/cookies" className="text-emerald-400 hover:underline">
              En savoir plus
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={accept}
            className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
          >
            Tout accepter
          </button>
          <button
            type="button"
            onClick={reject}
            className="rounded-lg border border-white/20 bg-white/5 px-5 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
          >
            Essentiels uniquement
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Small link to reset cookie consent — place in footer.
 * Clicking resets consent state and reloads the page so the banner reappears.
 */
export function CookieSettingsLink() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setShown(analyticsConsentState() !== "pending");
  }, []);

  if (!shown) return null;

  return (
    <button
      type="button"
      onClick={() => {
        resetAnalyticsConsent();
        window.location.reload();
      }}
      className="text-sm text-white/45 hover:text-white transition"
    >
      Paramètres cookies
    </button>
  );
}
