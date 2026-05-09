"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LanguageCode, Allergen, RestaurantMenu } from "@/types/menu";
import type { PlanStatus } from "@/lib/trial";
import type { ExperienceMode } from "./CustomerExperience";
import type { MascotState } from "./CSSMascot";
import type { ConciergeStep } from "./AIConcierge";
import { CSSMascot } from "./CSSMascot";
import { ConciergePanel } from "./AIConcierge";
import { SpeechBubble } from "./SpeechBubble";
import { trackEvent } from "@/lib/analytics-client";
import {
  pickIdleMessage,
  pickContextualMessage,
  pickSadMessage,
  getFlowMessage,
  getIntroMessages,
} from "@/lib/mascot-messages";

/* ─── Idle message rotation ─── */
const IDLE_INTERVAL_MIN = 6000;
const IDLE_INTERVAL_MAX = 10000;
const BUBBLE_PAUSE = 1500;

const INTRO_COOKIE_NAME = "carte_intro_seen";

/* ─── Warp timing (ms) ─── */
const WARP_SHRINK = 400;  // mascot shrinks to 0 + vortex opens
const WARP_LINGER = 150;  // vortex stays visible briefly
const WARP_GROW = 400;    // vortex opens at dest + mascot grows

type IntroStep = "greeting" | "features" | null;

/**
 * Warp phases for open:  src-shrink → src-linger → dst-grow → null
 * Warp phases for close: dst-shrink → dst-linger → src-grow → null
 */
type WarpPhase =
  | null
  | "src-shrink"   // bottom-right: vortex opens, mascot shrinks
  | "src-linger"   // bottom-right: vortex lingers
  | "dst-grow"     // panel top-right: vortex opens, mascot grows
  | "dst-shrink"   // panel top-right: vortex opens, mascot shrinks
  | "dst-linger"   // panel top-right: vortex lingers
  | "src-grow";    // bottom-right: vortex opens, mascot grows

/* ── Pulsing black-hole vortex ── */
function Vortex() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1.3, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="pointer-events-none absolute"
      style={{
        width: 100,
        height: 100,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, #000 25%, rgba(16,185,129,0.45) 55%, rgba(16,185,129,0.15) 70%, transparent 80%)",
        boxShadow:
          "0 0 24px 10px rgba(16,185,129,0.3), inset 0 0 14px 6px rgba(0,0,0,0.85)",
        left: "50%",
        top: "50%",
        translate: "-50% -50%",
      }}
    />
  );
}

/* ── Consistent mascot size everywhere ── */
const MASCOT_SIZE_CLASS = "w-[clamp(120px,24vw,140px)] h-[clamp(120px,24vw,140px)]";

interface MascotAssistantProps {
  lang: LanguageCode;
  menu: RestaurantMenu;
  excludedAllergens: Allergen[];
  tenantId: string;
  experienceMode: ExperienceMode;
  cuisineType?: string | null;
  planStatus?: PlanStatus;
  allowDrinksOnly?: boolean;
  shareMessage?: string | null;
  onShareClick?: () => void;
  onResults?: () => void;
  savedDishIds?: string[];
  onToggleSave?: (dishIds: string[]) => void;
  googleMapsUrl?: string;
  /** Delay (ms) before Cloche asks "did you order?" after results. Default 90s */
  postMealDelayMs?: number;
  onPostMealDone?: () => void;
}

export function MascotAssistant({
  lang,
  menu,
  excludedAllergens,
  tenantId,
  experienceMode,
  cuisineType,
  planStatus,
  allowDrinksOnly = true,
  shareMessage,
  onShareClick,
  onResults,
  savedDishIds,
  onToggleSave,
  googleMapsUrl,
  postMealDelayMs = 90_000,
  onPostMealDone,
}: MascotAssistantProps) {
  const isExpired = planStatus === "trial_expired";
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelKey, setPanelKey] = useState(0); // increment to force ConciergePanel remount
  const [mascotState, setMascotState] = useState<MascotState>(isExpired ? "sad" : "idle");
  const [warpPhase, setWarpPhase] = useState<WarpPhase>(null);

  // ─── Post-meal adoption flow (Cloche asks "did you order?") ───
  type PostMealPhase = "idle" | "asking" | "review" | "done";
  const [postMealPhase, setPostMealPhase] = useState<PostMealPhase>("idle");
  const postMealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasShownPostMeal = useRef(false);

  // ─── Intro ───
  const [introStep, setIntroStep] = useState<IntroStep>(null);
  const [introExiting, setIntroExiting] = useState(false);

  useEffect(() => {
    if (isExpired) return; // no intro for expired trials
    if (
      !document.cookie
        .split("; ")
        .some((c) => c.startsWith(INTRO_COOKIE_NAME + "="))
    ) {
      setIntroStep("greeting");
      setMascotState("talking");
    }
  }, [isExpired]);

  // ─── Speech bubble ───
  const [bubbleMessage, setBubbleMessage] = useState("");
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const lastIdxRef = useRef(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNextIdleMessage = useCallback(() => {
    if (isExpired) {
      setBubbleMessage(pickSadMessage(lang));
      setBubbleVisible(true);
      return;
    }
    const contextual =
      Math.random() < 0.3
        ? pickContextualMessage(lang, menu, cuisineType)
        : null;
    if (contextual) {
      setBubbleMessage(contextual);
    } else {
      const { message, index } = pickIdleMessage(lang, lastIdxRef.current);
      lastIdxRef.current = index;
      setBubbleMessage(message);
    }
    setBubbleVisible(true);
  }, [lang, menu, cuisineType, isExpired]);

  const scheduleNextMessage = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const interval =
      IDLE_INTERVAL_MIN +
      Math.random() * (IDLE_INTERVAL_MAX - IDLE_INTERVAL_MIN);
    timerRef.current = setTimeout(() => {
      setBubbleVisible(false);
      setTimeout(() => {
        showNextIdleMessage();
        scheduleNextMessage();
      }, BUBBLE_PAUSE);
    }, interval);
  }, [showNextIdleMessage]);

  useEffect(() => {
    if (!panelOpen && introStep === null && !introExiting && warpPhase === null) {
      showNextIdleMessage();
      scheduleNextMessage();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [panelOpen, lang, introStep, introExiting, warpPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Share message override ───
  useEffect(() => {
    if (shareMessage && !panelOpen && introStep === null) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setBubbleMessage(shareMessage);
      setBubbleVisible(true);
      setMascotState("happy");
    }
  }, [shareMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Post-meal: start timer when results are shown ───
  const startPostMealTimer = useCallback(() => {
    if (hasShownPostMeal.current || isExpired) return;
    if (postMealTimerRef.current) clearTimeout(postMealTimerRef.current);
    postMealTimerRef.current = setTimeout(() => {
      if (hasShownPostMeal.current) return;
      hasShownPostMeal.current = true;
      setPostMealPhase("asking");
      // Show Cloche's question bubble (idle mascot, not inside panel)
      if (timerRef.current) clearTimeout(timerRef.current);
      setBubbleMessage(getFlowMessage("postMealAsk", lang));
      setBubbleVisible(true);
      setMascotState("talking");
    }, postMealDelayMs);
  }, [isExpired, lang, postMealDelayMs]);

  useEffect(() => {
    return () => { if (postMealTimerRef.current) clearTimeout(postMealTimerRef.current); };
  }, []);

  function handlePostMealAnswer(adopted: boolean) {
    trackEvent(tenantId, "adoption", { adopted }, lang);
    if (adopted && googleMapsUrl) {
      setPostMealPhase("review");
      setBubbleMessage(getFlowMessage("postMealReview", lang));
      setBubbleVisible(true);
      setMascotState("happy");
    } else {
      setPostMealPhase("done");
      setBubbleMessage(
        getFlowMessage(adopted ? "postMealThanks" : "postMealNoWorries", lang),
      );
      setBubbleVisible(true);
      setMascotState(adopted ? "happy" : "idle");
      setTimeout(() => {
        setPostMealPhase("idle");
        onPostMealDone?.();
      }, 3000);
    }
  }

  function handlePostMealReviewDone() {
    setPostMealPhase("done");
    setBubbleMessage(getFlowMessage("postMealThanks", lang));
    setBubbleVisible(true);
    setMascotState("happy");
    setTimeout(() => {
      setPostMealPhase("idle");
      onPostMealDone?.();
    }, 3000);
  }

  // ─── Intro interactions ───
  function dismissIntro() {
    setIntroExiting(true);
    document.cookie = `${INTRO_COOKIE_NAME}=1; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setTimeout(() => {
      setIntroStep(null);
      setIntroExiting(false);
      setMascotState("idle");
    }, 800);
  }

  function showFeatures() {
    setIntroStep("features");
    setMascotState("happy");
  }

  function backToGreeting() {
    setIntroStep("greeting");
    setMascotState("talking");
  }

  // ─── Panel open (with warp) ───
  function openPanel() {
    if (warpPhase !== null) return;

    // Expired trial: show a random sad phrase instead of opening concierge
    if (isExpired) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setBubbleMessage(pickSadMessage(lang));
      setBubbleVisible(true);
      setMascotState("sad");
      // Auto-hide after 4s
      timerRef.current = setTimeout(() => setBubbleVisible(false), 4000);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    setBubbleVisible(false);

    // 1) Source: vortex opens, mascot shrinks
    setWarpPhase("src-shrink");
    setTimeout(() => {
      // 2) Source: vortex lingers
      setWarpPhase("src-linger");
      setTimeout(() => {
        // 3) Destination: panel opens, vortex opens, mascot grows
        setPanelOpen(true);
        setPanelKey((k) => k + 1);
        setMascotState("talking");
        setBubbleMessage(getFlowMessage("mode", lang));
        setBubbleVisible(true);
        setWarpPhase("dst-grow");
        setTimeout(() => {
          setWarpPhase(null);
        }, WARP_GROW);
      }, WARP_LINGER);
    }, WARP_SHRINK);
  }

  // ─── Panel close (with warp) ───
  function closePanel() {
    if (warpPhase !== null) return;
    setBubbleVisible(false);

    // 1) Panel mascot: vortex opens, mascot shrinks
    setWarpPhase("dst-shrink");
    setTimeout(() => {
      // 2) Panel: vortex lingers
      setWarpPhase("dst-linger");
      setTimeout(() => {
        // 3) Bottom-right: panel closes, vortex opens, mascot grows
        setPanelOpen(false);
        setMascotState("idle");
        setWarpPhase("src-grow");
        setTimeout(() => {
          setWarpPhase(null);
        }, WARP_GROW);
      }, WARP_LINGER);
    }, WARP_SHRINK);
  }

  function handleStepChange(
    step: ConciergeStep,
    hasAllergenWarning?: boolean,
    fallbackUsed?: boolean,
  ) {
    switch (step) {
      case "occasion":
        setMascotState("talking");
        setBubbleMessage(getFlowMessage("occasion", lang));
        break;
      case "mode":
        setMascotState("talking");
        setBubbleMessage(getFlowMessage("mode", lang));
        break;
      case "preferences":
        setMascotState("talking");
        setBubbleMessage(getFlowMessage("preferences", lang));
        break;
      case "loading":
        setMascotState("thinking");
        setBubbleMessage(getFlowMessage("loading", lang));
        break;
      case "results":
        if (fallbackUsed) {
          setMascotState("concerned");
          setBubbleMessage(getFlowMessage("fallback", lang));
        } else if (hasAllergenWarning) {
          setMascotState("concerned");
          setBubbleMessage(getFlowMessage("concerned", lang));
        } else {
          setMascotState("happy");
          setBubbleMessage(getFlowMessage("results", lang));
        }
        startPostMealTimer();
        break;
    }
    setBubbleVisible(true);
  }

  const introMessages = getIntroMessages(lang);
  const showIntro = introStep !== null;

  // Helpers: is vortex visible at source / destination?
  const vortexAtSrc =
    warpPhase === "src-shrink" ||
    warpPhase === "src-linger" ||
    warpPhase === "src-grow";
  const vortexAtDst =
    warpPhase === "dst-grow" ||
    warpPhase === "dst-shrink" ||
    warpPhase === "dst-linger";

  // Should mascot be scaled to 0?
  const srcMascotHidden =
    warpPhase === "src-shrink" ||
    warpPhase === "src-linger";
  const dstMascotHidden =
    warpPhase === "dst-shrink" ||
    warpPhase === "dst-linger";

  return (
    <>
      {/* ── Intro overlay ── */}
      <AnimatePresence>
        {showIntro && !introExiting && (
          <motion.div
            key="intro-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 200,
                delay: 0.1,
              }}
            >
              <CSSMascot
                state={mascotState}
                className="w-[clamp(160px,40vw,260px)] h-[clamp(160px,40vw,260px)]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-4 w-full rounded-2xl border border-[#2a2a32] bg-[#1a1a20] p-5 shadow-2xl"
              style={{ maxWidth: "min(380px, calc(100vw - 3rem))" }}
            >
              {introStep === "greeting" && (
                <>
                  <p className="text-sm leading-6 text-[#f0ece3]">
                    {introMessages.greeting}
                  </p>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={dismissIntro}
                      className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                    >
                      {introMessages.gotIt}
                    </button>
                    <button
                      type="button"
                      onClick={showFeatures}
                      className="flex-1 rounded-xl border border-[#3a3a42] px-4 py-2.5 text-sm font-medium text-[#f0ece3] transition-colors hover:bg-[#2a2a32]"
                    >
                      {introMessages.whatCanYouDo}
                    </button>
                  </div>
                </>
              )}

              {introStep === "features" && (
                <>
                  <ul className="space-y-2.5">
                    {introMessages.features.map((feat, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm leading-5 text-[#f0ece3]"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-400">
                          {i + 1}
                        </span>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={dismissIntro}
                      className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                    >
                      {introMessages.gotIt}
                    </button>
                    <button
                      type="button"
                      onClick={backToGreeting}
                      className="rounded-xl border border-[#3a3a42] px-4 py-2.5 text-sm font-medium text-[#f0ece3] transition-colors hover:bg-[#2a2a32]"
                    >
                      &larr;
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Concierge panel overlay ── */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            key="concierge-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closePanel();
            }}
          >
            <div
              className="relative"
              style={{ width: "min(400px, calc(100vw - 2rem))" }}
            >
              {/* Mascot + bubble anchored above panel top-right */}
              <div
                className="absolute right-2 z-10 flex items-center"
                style={{ pointerEvents: "none", bottom: "100%", marginBottom: 4 }}
              >
                <SpeechBubble
                  message={bubbleMessage}
                  visible={bubbleVisible && !dstMascotHidden}
                  tail="right"
                />
                <div className="relative shrink-0">
                  <AnimatePresence>
                    {vortexAtDst && <Vortex key="vortex-dst" />}
                  </AnimatePresence>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: dstMascotHidden ? 0 : 1 }}
                    transition={{ duration: WARP_GROW / 1000, ease: "easeOut" }}
                  >
                    <CSSMascot
                      state={mascotState}
                      className={MASCOT_SIZE_CLASS}
                    />
                  </motion.div>
                </div>
              </div>

              {/* Panel */}
              <motion.div
                initial={{ y: 40, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 40, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="overflow-y-auto overscroll-contain rounded-2xl shadow-2xl"
                style={{ maxHeight: "75vh", WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <ConciergePanel
                  key={panelKey}
                  lang={lang}
                  menu={menu}
                  excludedAllergens={excludedAllergens}
                  tenantId={tenantId}
                  experienceMode={experienceMode}
                  allowDrinksOnly={allowDrinksOnly}
                  onResults={onResults}
                  onClose={closePanel}
                  onStepChange={handleStepChange}
                  savedDishIds={savedDishIds}
                  onToggleSave={onToggleSave}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Idle mascot (bottom-right) ── */}
      {!showIntro && !panelOpen && (
        <div
          className="fixed bottom-4 z-50"
          style={{ insetInlineEnd: "1rem" }}
        >
          <div className="flex flex-col items-end">
            <SpeechBubble
              message={bubbleMessage}
              visible={bubbleVisible && warpPhase === null}
              onClick={
                postMealPhase === "asking" || postMealPhase === "review"
                  ? undefined
                  : shareMessage
                    ? onShareClick
                    : openPanel
              }
            />

            {/* Post-meal: yes/no buttons under the bubble */}
            <AnimatePresence>
              {postMealPhase === "asking" && (
                <motion.div
                  key="post-meal-ask"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mb-1 flex gap-2"
                >
                  <button
                    type="button"
                    onClick={() => handlePostMealAnswer(true)}
                    className="min-h-[36px] rounded-full px-4 py-1.5 text-xs font-semibold text-carte-bg"
                    style={{ backgroundColor: "var(--carte-primary)" }}
                  >
                    {lang === "zh" ? "点了！" : lang === "fr" ? "Oui !" : "Yes!"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePostMealAnswer(false)}
                    className="min-h-[36px] rounded-full border border-carte-border px-4 py-1.5 text-xs font-medium text-carte-text-muted hover:bg-carte-surface"
                  >
                    {lang === "zh" ? "没有" : lang === "fr" ? "Non" : "Not yet"}
                  </button>
                </motion.div>
              )}
              {postMealPhase === "review" && googleMapsUrl && (
                <motion.div
                  key="post-meal-review"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mb-1 flex gap-2"
                >
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      trackEvent(tenantId, "review_click", { source: "cloche_post_meal" }, lang);
                      handlePostMealReviewDone();
                    }}
                    className="min-h-[36px] rounded-full px-4 py-1.5 text-xs font-semibold text-carte-bg"
                    style={{ backgroundColor: "var(--carte-accent)" }}
                  >
                    ⭐ Google
                  </a>
                  <button
                    type="button"
                    onClick={handlePostMealReviewDone}
                    className="min-h-[36px] rounded-full border border-carte-border px-4 py-1.5 text-xs font-medium text-carte-text-muted hover:bg-carte-surface"
                  >
                    {lang === "zh" ? "下次吧" : lang === "fr" ? "Plus tard" : "Maybe later"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <AnimatePresence>
                {vortexAtSrc && <Vortex key="vortex-src" />}
              </AnimatePresence>
              <motion.div
                initial={{ scale: warpPhase === "src-grow" ? 0 : 1 }}
                animate={{ scale: srcMascotHidden ? 0 : 1 }}
                transition={{ duration: WARP_SHRINK / 1000, ease: "easeInOut" }}
              >
                <CSSMascot
                  state={mascotState}
                  onClick={warpPhase === null ? openPanel : undefined}
                  className={MASCOT_SIZE_CLASS}
                />
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* ── Intro exit: mascot shrinks from center to bottom-right ── */}
      <AnimatePresence>
        {introExiting && (
          <motion.div
            key="intro-exit-mascot"
            initial={{
              position: "fixed",
              top: "50%",
              left: "50%",
              x: "-50%",
              y: "-50%",
              scale: 1,
            }}
            animate={{
              top: "auto",
              bottom: 16,
              right: 16,
              left: "auto",
              x: 0,
              y: 0,
              scale: 0.55,
            }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            className="z-[60]"
            style={{ position: "fixed" }}
          >
            <CSSMascot
              state="idle"
              className="w-[clamp(160px,40vw,260px)] h-[clamp(160px,40vw,260px)]"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
