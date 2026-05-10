"use client";

import { useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LanguageCode } from "@/types/menu";
import { getDictionary } from "@/lib/i18n";
import { CSSMascot } from "./CSSMascot";
import {
  ListMagnifyingGlassIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  TranslateIcon,
  FunnelIcon,
} from "@phosphor-icons/react";

interface Step {
  icon: ReactNode;
  titleKey: "guideBrowse" | "guideDiscover" | "guideSave" | "guideWaiter" | "guideFilter";
  descKey: "guideBrowseDesc" | "guideDiscoverDesc" | "guideSaveDesc" | "guideWaiterDesc" | "guideFilterDesc";
}

const steps: Step[] = [
  {
    icon: <ListMagnifyingGlassIcon weight="duotone" className="h-5 w-5 text-carte-primary" />,
    titleKey: "guideBrowse",
    descKey: "guideBrowseDesc",
  },
  {
    icon: <MagnifyingGlassIcon weight="duotone" className="h-5 w-5 text-carte-primary" />,
    titleKey: "guideDiscover",
    descKey: "guideDiscoverDesc",
  },
  {
    icon: <HeartIcon weight="duotone" className="h-5 w-5 text-carte-danger" />,
    titleKey: "guideSave",
    descKey: "guideSaveDesc",
  },
  {
    icon: <TranslateIcon weight="duotone" className="h-5 w-5 text-carte-primary" />,
    titleKey: "guideWaiter",
    descKey: "guideWaiterDesc",
  },
  {
    icon: <FunnelIcon weight="duotone" className="h-5 w-5 text-carte-warning" />,
    titleKey: "guideFilter",
    descKey: "guideFilterDesc",
  },
];

interface ClocheGuideProps {
  visible: boolean;
  lang: LanguageCode;
  onClose: () => void;
}

export function ClocheGuide({ visible, lang, onClose }: ClocheGuideProps) {
  const t = getDictionary(lang);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full max-w-lg rounded-t-2xl border-t border-carte-border px-5 pb-8 pt-4 overflow-y-auto"
            style={{ backgroundColor: "var(--carte-bg)", maxHeight: "85vh" }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-carte-border" />

            <div className="flex items-center gap-3">
              <CSSMascot state="happy" className="h-10 w-10 shrink-0" />
              <h2 className="text-base font-bold text-carte-text">{t.guideTitle}</h2>
            </div>

            <div className="mt-4 space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3 rounded-xl border border-carte-border bg-carte-surface p-3">
                  <div className="mt-0.5 shrink-0">{step.icon}</div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-carte-text">{t[step.titleKey]}</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-carte-text-muted">{t[step.descKey]}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-xl py-3 text-sm font-semibold text-carte-bg active:opacity-80"
              style={{ backgroundColor: "var(--carte-primary)" }}
            >
              {t.guideGotIt}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
