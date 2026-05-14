"use client";

import { useState, useEffect, useCallback } from "react";
import type { AdminLocale } from "@/lib/admin-i18n";
import { getAdminDict } from "@/lib/admin-i18n";
import { ListBullets, Translate, Camera, QrCode, Megaphone, Question } from "@phosphor-icons/react";

const ONBOARDING_KEY = "carte_onboarding_dismissed";

interface OnboardingGuideProps {
  locale?: AdminLocale;
  slug?: string;
}

const stepIcons = [
  <ListBullets key="1" weight="duotone" className="h-6 w-6 text-primary" />,
  <Translate key="2" weight="duotone" className="h-6 w-6 text-primary" />,
  <Camera key="3" weight="duotone" className="h-6 w-6 text-primary" />,
  <QrCode key="4" weight="duotone" className="h-6 w-6 text-primary" />,
  <Megaphone key="5" weight="duotone" className="h-6 w-6 text-primary" />,
];

export function OnboardingGuide({ locale = "en", slug }: OnboardingGuideProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  const t = getAdminDict(locale);
  const tAny = t as unknown as Record<string, string>;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem(ONBOARDING_KEY);
    if (!dismissed) {
      setVisible(true);
    }

    // Listen for re-open event from HelpButton
    function handleReopen() {
      setVisible(true);
      setStep(0);
    }
    window.addEventListener("carte:reopen-onboarding", handleReopen);
    return () => window.removeEventListener("carte:reopen-onboarding", handleReopen);
  }, []);

  function dismiss() {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  const base = slug ? `/admin/${slug}` : "";
  const steps = [
    { title: tAny.onboardStep1Title, desc: tAny.onboardStep1Desc, href: `${base}/menu`, btnLabel: tAny.onboardGoToMenu || "Go to Menu" },
    { title: tAny.onboardStep2Title, desc: tAny.onboardStep2Desc, href: `${base}/menu`, btnLabel: tAny.onboardGoToEditor || "Edit Menu" },
    { title: tAny.onboardStep3Title, desc: tAny.onboardStep3Desc, href: `${base}/menu`, btnLabel: tAny.onboardGoToImages || "Generate Images" },
    { title: tAny.onboardStep4Title, desc: tAny.onboardStep4Desc, href: `${base}/poster`, btnLabel: tAny.onboardGoToPoster || "Create Poster" },
    { title: tAny.onboardStep5Title, desc: tAny.onboardStep5Desc, href: `${base}/analytics`, btnLabel: tAny.onboardGoToAnalytics || "View Analytics" },
  ];

  const isLast = step === steps.length - 1;

  return (
    <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <h2 className="text-lg font-bold text-foreground">{tAny.onboardTitle}</h2>

      {/* Step indicator */}
      <div className="mt-4 flex items-center gap-2">
        {steps.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStep(i)}
            className={`h-2 rounded-full transition-all ${
              i === step ? "w-6 bg-primary" : "w-2 bg-primary/30"
            }`}
          />
        ))}
      </div>

      {/* Current step */}
      <div className="mt-4 flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          {stepIcons[step]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">
            {step + 1}. {steps[step].title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{steps[step].desc}</p>
          {slug && steps[step].href && (
            <a
              href={steps[step].href}
              className="mt-2 inline-block rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
            >
              {steps[step].btnLabel} &rarr;
            </a>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={dismiss}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          {tAny.onboardSkip}
        </button>
        <div className="flex gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted"
            >
              &larr;
            </button>
          )}
          {isLast ? (
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {tAny.onboardDismiss}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Help button that re-opens the onboarding guide.
 * Place in the sidebar or nav for users to review the tutorial anytime.
 */
export function OnboardingHelpButton({ label }: { label: string }) {
  const handleClick = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    window.dispatchEvent(new CustomEvent("carte:reopen-onboarding"));
    // Scroll to top so the guide is visible
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <Question weight="duotone" className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}
