"use client";

import { motion, AnimatePresence } from "framer-motion";

interface SpeechBubbleProps {
  message: string;
  visible: boolean;
  onClick?: () => void;
  /** Where the tail points — "bottom" (default, mascot below) or "right" (mascot to the right) */
  tail?: "bottom" | "right";
}

export function SpeechBubble({ message, visible, onClick, tail = "bottom" }: SpeechBubbleProps) {
  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.button
          key={message}
          type="button"
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative max-w-[240px] rounded-2xl border border-carte-border bg-carte-surface/95 px-4 py-2.5 text-left text-xs leading-5 text-carte-text backdrop-blur-md transition-colors hover:border-carte-primary/30"
          style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.25))" }}
        >
          {message}

          {/* Curved SVG tail — bottom (mascot below) */}
          {tail === "bottom" && (
            <svg
              className="absolute -bottom-[10px] right-4"
              width="18"
              height="12"
              viewBox="0 0 18 12"
            >
              {/* Fill overlaps bubble by 2px to cover border seam */}
              <path
                d="M0,2 C4,2 6,6 9,12 C12,6 14,2 18,2 L18,0 L0,0 Z"
                className="fill-carte-surface/95"
              />
              {/* Outer curve stroke only */}
              <path
                d="M0,2 C4,2 6,6 9,12 C12,6 14,2 18,2"
                fill="none"
                className="stroke-carte-border"
                strokeWidth="1"
              />
            </svg>
          )}

          {/* Curved SVG tail — right (mascot to the right) */}
          {tail === "right" && (
            <svg
              className="absolute -right-[10px] top-1/2 -translate-y-1/2"
              width="12"
              height="18"
              viewBox="0 0 12 18"
            >
              <path
                d="M2,0 C2,4 6,6 12,9 C6,12 2,14 2,18 L0,18 L0,0 Z"
                className="fill-carte-surface/95"
              />
              <path
                d="M2,0 C2,4 6,6 12,9 C6,12 2,14 2,18"
                fill="none"
                className="stroke-carte-border"
                strokeWidth="1"
              />
            </svg>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
