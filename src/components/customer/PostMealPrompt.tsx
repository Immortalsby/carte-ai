"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LanguageCode } from "@/types/menu";
import { getDictionary } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics-client";

// labels now served from getDictionary: postMealQuestion, postMealYes, postMealNo, postMealThanks, postMealReview

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

  const t = getDictionary(lang);

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
                  {t.postMealQuestion}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => answer(true)}
                    className="min-h-[44px] flex-1 rounded-lg py-2 text-sm font-semibold text-carte-bg"
                    style={{ backgroundColor: "var(--carte-primary)" }}
                  >
                    {t.postMealYes}
                  </button>
                  <button
                    type="button"
                    onClick={() => answer(false)}
                    className="min-h-[44px] flex-1 rounded-lg border border-carte-border py-2 text-sm font-medium text-carte-text-muted hover:bg-carte-surface-hover"
                  >
                    {t.postMealNo}
                  </button>
                </div>
              </>
            ) : showReview && googlePlaceId ? (
              <>
                <p className="text-center text-sm font-medium text-carte-text">
                  {t.postMealReview}
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
                {t.postMealThanks}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
