"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LanguageCode } from "@/types/menu";
import { getDictionary } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics-client";

const labels: Record<string, Record<string, string>> = {
  question: {
    en: "Did you order a recommended dish?",
    fr: "Avez-vous commandé un plat recommandé ?",
    zh: "\u4f60\u70b9\u4e86\u63a8\u8350\u83dc\u5417\uff1f",
  },
  yes: { en: "Yes!", fr: "Oui !", zh: "\u662f\u7684\uff01" },
  no: { en: "Not this time", fr: "Pas cette fois", zh: "\u8fd9\u6b21\u6ca1\u6709" },
  thanks: {
    en: "Thanks for the feedback!",
    fr: "Merci pour le retour !",
    zh: "\u8c22\u8c22\u53cd\u9988\uff01",
  },
  reviewNudge: {
    en: "Enjoyed your meal? Leave a review!",
    fr: "Vous avez aimé ? Laissez un avis !",
    zh: "\u559c\u6b22\u8fd9\u987f\u996d\u5417\uff1f\u7559\u4e2a\u597d\u8bc4\u5427\uff01",
  },
};

interface PostMealPromptProps {
  lang: LanguageCode;
  tenantId: string;
  /** Delay in ms before showing the prompt */
  delayMs?: number;
  /** Google Place ID for review link (FR56) */
  googlePlaceId?: string | null;
  onDismiss: () => void;
}

export function PostMealPrompt({
  lang,
  tenantId,
  delayMs = 20_000, // 20 seconds after recommendation results
  googlePlaceId,
  onDismiss,
}: PostMealPromptProps) {
  const [visible, setVisible] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  function answer(adopted: boolean) {
    trackEvent(tenantId, "adoption", { adopted }, lang);
    setAnswered(true);
    // Show review nudge if adopted and has Google Place ID (FR56)
    if (adopted && googlePlaceId) {
      setTimeout(() => setShowReview(true), 1500);
    } else {
      setTimeout(onDismiss, 2000);
    }
  }

  function handleReviewDismiss() {
    setShowReview(false);
    onDismiss();
  }

  const l = (key: string) =>
    labels[key]?.[lang] || labels[key]?.en || key;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-x-0 bottom-6 z-40 mx-auto max-w-sm px-4"
        >
          <div className="rounded-2xl border border-carte-border bg-carte-surface p-4 shadow-lg backdrop-blur-md">
            {!answered ? (
              <>
                <p className="text-center text-sm font-medium text-carte-text">
                  {l("question")}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => answer(true)}
                    className="min-h-[44px] flex-1 rounded-lg py-2 text-sm font-semibold text-carte-bg"
                    style={{ backgroundColor: "var(--carte-primary)" }}
                  >
                    {l("yes")}
                  </button>
                  <button
                    type="button"
                    onClick={() => answer(false)}
                    className="min-h-[44px] flex-1 rounded-lg border border-carte-border py-2 text-sm font-medium text-carte-text-muted hover:bg-carte-surface-hover"
                  >
                    {l("no")}
                  </button>
                </div>
              </>
            ) : showReview && googlePlaceId ? (
              <>
                <p className="text-center text-sm font-medium text-carte-text">
                  {l("reviewNudge")}
                </p>
                <div className="mt-3 flex gap-2">
                  <a
                    href={`https://search.google.com/local/writereview?placeid=${googlePlaceId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      trackEvent(tenantId, "review_click", { source: "post_meal" }, lang);
                      handleReviewDismiss();
                    }}
                    className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-carte-bg"
                    style={{ backgroundColor: "var(--carte-primary)" }}
                  >
                    <span>{"\u2b50"}</span>
                    Google
                  </a>
                  <button
                    type="button"
                    onClick={handleReviewDismiss}
                    className="min-h-[44px] flex-1 rounded-lg border border-carte-border py-2 text-sm font-medium text-carte-text-muted hover:bg-carte-surface-hover"
                  >
                    {getDictionary(lang).maybeLater}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-center text-sm text-carte-text-muted">
                {l("thanks")}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
