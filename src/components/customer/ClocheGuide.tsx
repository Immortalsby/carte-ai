"use client";

import { useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LanguageCode } from "@/types/menu";
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
  title: Record<string, string>;
  desc: Record<string, string>;
}

const steps: Step[] = [
  {
    icon: <ListMagnifyingGlassIcon weight="duotone" className="h-5 w-5 text-carte-primary" />,
    title: { en: "Browse the menu", fr: "Parcourir le menu", zh: "浏览菜单" },
    desc: {
      en: "Scroll through dishes by category, or tap Cloché for personalized recommendations.",
      fr: "Parcourez les plats par catégorie, ou touchez Cloché pour des recommandations personnalisées.",
      zh: "按分类浏览菜品，或点击 Cloché 获取个性化推荐。",
    },
  },
  {
    icon: <MagnifyingGlassIcon weight="duotone" className="h-5 w-5 text-carte-primary" />,
    title: { en: "Discover each dish", fr: "Découvrir chaque plat", zh: "了解每道菜" },
    desc: {
      en: "Tap any dish to see details. Ask Cloché to explain unfamiliar dishes, analyze allergens, or estimate calories.",
      fr: "Touchez un plat pour voir les détails. Demandez à Cloché d'expliquer un plat, d'analyser les allergènes ou d'estimer les calories.",
      zh: "点击任意菜品查看详情。让 Cloché 帮你解释不熟悉的菜、分析过敏原或估算卡路里。",
    },
  },
  {
    icon: <HeartIcon weight="duotone" className="h-5 w-5 text-carte-danger" />,
    title: { en: "Save your favorites", fr: "Sauvegardez vos favoris", zh: "收藏喜欢的菜" },
    desc: {
      en: "Tap the heart to add dishes to your wishlist. Review everything before ordering.",
      fr: "Touchez le cœur pour ajouter des plats à votre liste. Vérifiez le tout avant de commander.",
      zh: "点击小心心将菜品加入心愿单，点菜前可以统一查看。",
    },
  },
  {
    icon: <TranslateIcon weight="duotone" className="h-5 w-5 text-carte-primary" />,
    title: { en: "Show to waiter", fr: "Montrer au serveur", zh: "给服务员看" },
    desc: {
      en: "Language barrier? No worries! Cloché translates your order into the local language for the waiter.",
      fr: "Barrière linguistique ? Pas de souci ! Cloché traduit votre commande dans la langue du serveur.",
      zh: "语言不通？没关系！Cloché 会把你的订单翻译成当地语言，直接给服务员看。",
    },
  },
  {
    icon: <FunnelIcon weight="duotone" className="h-5 w-5 text-carte-warning" />,
    title: { en: "Filter allergens", fr: "Filtrer les allergènes", zh: "过滤过敏原" },
    desc: {
      en: "Use the filter button to hide dishes containing allergens you want to avoid.",
      fr: "Utilisez le filtre pour masquer les plats contenant des allergènes que vous souhaitez éviter.",
      zh: "使用过滤按钮隐藏含有你想避免的过敏原的菜品。",
    },
  },
];

const title = { en: "What can Cloché do?", fr: "Que peut faire Cloché ?", zh: "Cloché 能做什么？" };
const closeLabel = { en: "Got it!", fr: "Compris !", zh: "明白了！" };

function l(obj: Record<string, string>, lang: LanguageCode): string {
  return obj[lang.startsWith("zh") ? "zh" : lang === "fr" ? "fr" : "en"];
}

interface ClocheGuideProps {
  visible: boolean;
  lang: LanguageCode;
  onClose: () => void;
}

export function ClocheGuide({ visible, lang, onClose }: ClocheGuideProps) {
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
              <h2 className="text-base font-bold text-carte-text">{l(title, lang)}</h2>
            </div>

            <div className="mt-4 space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3 rounded-xl border border-carte-border bg-carte-surface p-3">
                  <div className="mt-0.5 shrink-0">{step.icon}</div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-carte-text">{l(step.title, lang)}</h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-carte-text-muted">{l(step.desc, lang)}</p>
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
              {l(closeLabel, lang)}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
