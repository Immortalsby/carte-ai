"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Dish, LanguageCode } from "@/types/menu";
import { getDictionary } from "@/lib/i18n";

interface WishlistPanelProps {
  visible: boolean;
  lang: LanguageCode;
  dishes: Dish[];
  cuisine?: string;
  tenantId?: string;
  onRemove: (dishId: string) => void;
  onClear: () => void;
  onClose: () => void;
  onDishTap?: (dish: Dish) => void;
  onShowWaiter?: () => void;
}

export function WishlistPanel({
  visible,
  lang,
  dishes,
  cuisine,
  tenantId,
  onRemove,
  onClear,
  onClose,
  onDishTap,
  onShowWaiter,
}: WishlistPanelProps) {
  const t = getDictionary(lang);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [visible]);

  const total = dishes.reduce((sum, d) => sum + d.priceCents, 0);

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 300) onClose();
            }}
            className="relative w-full max-w-lg rounded-t-2xl border-t border-carte-border px-5 pb-8 pt-4"
            style={{ backgroundColor: "var(--carte-bg)", maxHeight: "80vh" }}
          >
            {/* Drag handle */}
            <div className="mx-auto mb-4 h-1 w-10 cursor-grab rounded-full bg-carte-border active:cursor-grabbing" />

            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-carte-text">
                {t.wishlistTitle}
                {dishes.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-carte-text-muted">
                    ({dishes.length})
                  </span>
                )}
              </h2>
              {dishes.length > 0 && (
                <button
                  type="button"
                  onClick={onClear}
                  className="text-xs text-carte-text-dim hover:text-carte-warning"
                >
                  {t.clearAll}
                </button>
              )}
            </div>

            {dishes.length === 0 ? (
              <p className="mt-8 text-center text-sm text-carte-text-dim">
                {t.wishlistEmpty}
              </p>
            ) : (
              <div className="mt-3 space-y-2 overflow-y-auto" style={{ maxHeight: "calc(80vh - 180px)" }}>
                {dishes.map((dish) => {
                  const name = dish.name[lang] || dish.name.en || dish.name.fr;
                  const desc = dish.description[lang] || dish.description.en || dish.description.fr;
                  const price = (dish.priceCents / 100).toFixed(2);
                  const displayImage = dish.imageUrl;

                  return (
                    <div
                      key={dish.id}
                      className="flex items-start gap-3 rounded-xl border border-carte-border bg-carte-surface p-3 transition-colors hover:bg-carte-surface-hover"
                      role={onDishTap ? "button" : undefined}
                      tabIndex={onDishTap ? 0 : undefined}
                      onClick={() => onDishTap?.(dish)}
                      onKeyDown={(e) => e.key === "Enter" && onDishTap?.(dish)}
                    >
                      {displayImage ? (
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                          <img
                            src={displayImage}
                            alt={name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="h-14 w-14 shrink-0 rounded-lg bg-carte-border" />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-carte-text">{name}</h3>
                        {desc && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-carte-text-muted">{desc}</p>
                        )}
                        <span className="mt-0.5 text-xs font-bold tabular-nums text-carte-primary">
                          &euro;{price}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(dish.id)}
                        className="shrink-0 rounded-full p-1.5 text-carte-text-dim hover:bg-carte-surface-hover hover:text-carte-warning"
                        aria-label="Remove"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total + close */}
            {dishes.length > 0 && (
              <div className="mt-4 flex items-center justify-between border-t border-carte-border pt-3">
                <span className="text-sm text-carte-text-muted">{t.total}</span>
                <span className="text-base font-bold tabular-nums text-carte-primary">
                  &euro;{(total / 100).toFixed(2)}
                </span>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {dishes.length > 0 && onShowWaiter && (
                <button
                  type="button"
                  onClick={onShowWaiter}
                  className="flex-1 rounded-xl border border-carte-border py-3 text-sm font-semibold text-carte-text transition-colors hover:bg-carte-surface active:opacity-80"
                >
                  {t.showWaiter}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl py-3 text-sm font-semibold text-carte-bg active:opacity-80"
                style={{ backgroundColor: "var(--carte-primary)" }}
              >
                {t.close}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
