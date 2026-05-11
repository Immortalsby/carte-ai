"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { LanguageCode } from "@/types/menu";
import { getDictionary } from "@/lib/i18n";
import { trackEvent } from "@/lib/analytics-client";
import { useToast } from "@/components/ui/Toast";

// shareLabels now served from getDictionary: shareTitle

interface SharePanelProps {
  visible: boolean;
  lang: LanguageCode;
  restaurantName: string;
  slug: string;
  tenantId: string;
  onClose: () => void;
}

export function SharePanel({
  visible,
  lang,
  restaurantName,
  slug,
  tenantId,
  onClose,
}: SharePanelProps) {
  const { toast } = useToast();
  const t = getDictionary(lang);
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/r/${slug}`;
  const shareText = t.shareTextTemplate.replace("{name}", restaurantName);

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `CarteAI - ${restaurantName}`,
          text: shareText,
          url: shareUrl,
        });
        trackEvent(tenantId, "share", { method: "native" }, lang);
      } catch {
        // User cancelled share
      }
    }
  }

  function handleWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(url, "_blank", "noopener");
    trackEvent(tenantId, "share", { method: "whatsapp" }, lang);
  }

  function handleWeChat() {
    // WeChat doesn't support direct URL sharing from web — copy link for user to paste
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    trackEvent(tenantId, "share", { method: "wechat" }, lang);
    toast(t.wechatCopied, "success");
  }

  function handleTelegram() {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener");
    trackEvent(tenantId, "share", { method: "telegram" }, lang);
  }

  function handleInstagram() {
    // Instagram doesn't support direct link sharing — copy link for user to paste in Stories/DM
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    trackEvent(tenantId, "share", { method: "instagram" }, lang);
    window.open("https://instagram.com", "_blank", "noopener");
  }

  function handleXiaohongshu() {
    // Xiaohongshu doesn't have a web share API — copy text for user to paste
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    trackEvent(tenantId, "share", { method: "xiaohongshu" }, lang);
    window.open("https://www.xiaohongshu.com", "_blank", "noopener");
  }

  function handleXTwitter() {
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener");
    trackEvent(tenantId, "share", { method: "x" }, lang);
  }

  function handleFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener");
    trackEvent(tenantId, "share", { method: "facebook" }, lang);
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 300) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-2xl border-t border-carte-border p-5 pb-8"
            style={{ backgroundColor: "var(--carte-bg)" }}
          >
            <div className="mx-auto mb-4 h-1 w-10 cursor-grab rounded-full bg-carte-border active:cursor-grabbing" />

            <h3 className="text-center text-sm font-bold text-carte-text">
              {t.shareTitle}
            </h3>

            <div className="mt-4 grid grid-cols-4 gap-3">
              {/* WeChat — top priority for Chinese users */}
              <button
                type="button"
                onClick={handleWeChat}
                className="flex min-h-[44px] flex-col items-center gap-1 rounded-lg bg-carte-surface p-3 text-carte-text transition-colors hover:bg-carte-surface-hover"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#07C160" }}>
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.127 6.127 0 0 1-.253-1.736c0-3.64 3.45-6.592 7.706-6.592.256 0 .507.013.756.033C16.837 4.546 13.088 2.188 8.691 2.188zm-2.87 4.795a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2zm5.742 0a1.1 1.1 0 1 1 0-2.2 1.1 1.1 0 0 1 0 2.2zm4.383 2.924c-3.732 0-6.76 2.594-6.76 5.79 0 3.2 3.028 5.793 6.76 5.793a8.36 8.36 0 0 0 2.347-.336.723.723 0 0 1 .596.082l1.575.921a.273.273 0 0 0 .14.046.245.245 0 0 0 .24-.245c0-.06-.023-.118-.039-.176l-.326-1.224a.498.498 0 0 1 .176-.547C21.045 18.564 22 16.807 22 14.897c0-3.196-3.028-5.79-6.76-5.79h-.294zm-2.465 3.477a.915.915 0 1 1 0-1.83.915.915 0 0 1 0 1.83zm4.93 0a.915.915 0 1 1 0-1.83.915.915 0 0 1 0 1.83z"/>
                </svg>
                <span className="text-[10px]">WeChat</span>
              </button>

              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex min-h-[44px] flex-col items-center gap-1 rounded-lg bg-carte-surface p-3 text-carte-text transition-colors hover:bg-carte-surface-hover"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#25D366" }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-[10px]">WhatsApp</span>
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={handleTelegram}
                className="flex min-h-[44px] flex-col items-center gap-1 rounded-lg bg-carte-surface p-3 text-carte-text transition-colors hover:bg-carte-surface-hover"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#26A5E4" }}>
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="text-[10px]">Telegram</span>
              </button>

              {/* Instagram */}
              <button
                type="button"
                onClick={handleInstagram}
                className="flex min-h-[44px] flex-col items-center gap-1 rounded-lg bg-carte-surface p-3 text-carte-text transition-colors hover:bg-carte-surface-hover"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#E4405F" }}>
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 1 0 0-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 0 1-2.88 0 1.441 1.441 0 0 1 2.88 0z"/>
                </svg>
                <span className="text-[10px]">Instagram</span>
              </button>

              {/* X (Twitter) */}
              <button
                type="button"
                onClick={handleXTwitter}
                className="flex min-h-[44px] flex-col items-center gap-1 rounded-lg bg-carte-surface p-3 text-carte-text transition-colors hover:bg-carte-surface-hover"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="text-[10px]">X</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={handleFacebook}
                className="flex min-h-[44px] flex-col items-center gap-1 rounded-lg bg-carte-surface p-3 text-carte-text transition-colors hover:bg-carte-surface-hover"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#1877F2" }}>
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-[10px]">Facebook</span>
              </button>

              {/* Xiaohongshu (RED) */}
              <button
                type="button"
                onClick={handleXiaohongshu}
                className="flex min-h-[44px] flex-col items-center gap-1 rounded-lg bg-carte-surface p-3 text-carte-text transition-colors hover:bg-carte-surface-hover"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#FF2442" }}>
                  <path d="M12.53 0H8.124c-.144 0-.29.003-.434.009-.336.015-.672.043-1.005.093a6.15 6.15 0 0 0-.976.223 4.108 4.108 0 0 0-.891.41A4.19 4.19 0 0 0 3.3 2.253a4.108 4.108 0 0 0-.41.891 6.15 6.15 0 0 0-.223.976 10.88 10.88 0 0 0-.093 1.005A16.7 16.7 0 0 0 2.566 5.56v12.88c.003.144.003.29.009.434.015.336.043.672.093 1.005.05.334.122.664.223.976.1.313.235.614.41.891a4.19 4.19 0 0 0 1.518 1.518c.277.175.578.31.891.41.312.101.642.173.976.223.333.05.669.078 1.005.093.144.006.29.009.434.009h8.812c.144 0 .29-.003.434-.009.336-.015.672-.043 1.005-.093.334-.05.664-.122.976-.223.313-.1.614-.235.891-.41a4.19 4.19 0 0 0 1.518-1.518c.175-.277.31-.578.41-.891.101-.312.173-.642.223-.976.05-.333.078-.669.093-1.005.006-.144.009-.29.009-.434V5.56c0-.144-.003-.29-.009-.434a10.88 10.88 0 0 0-.093-1.005 6.15 6.15 0 0 0-.223-.976 4.108 4.108 0 0 0-.41-.891A4.19 4.19 0 0 0 19.234.736a4.108 4.108 0 0 0-.891-.41 6.15 6.15 0 0 0-.976-.223A10.88 10.88 0 0 0 16.362.01 16.7 16.7 0 0 0 15.928 0H12.53zm2.083 6.318h2.007l.39 1.674h1.878l-.25 1.29H16.7l-.502 2.523h1.878l-.25 1.29h-1.878l-.752 3.819c-.073.36.083.502.383.502.18 0 .431-.04.681-.111l-.18 1.29c-.43.14-.861.23-1.291.23-1.11 0-1.672-.58-1.492-1.54l.782-4.19h-1.44l-.42 2.233c-.332 1.74-1.282 3.527-3.838 3.527-1.24 0-2.013-.56-2.013-.56l.57-1.32s.661.45 1.262.45c1.12 0 1.572-.95 1.782-2.003l.461-2.327H9.805l.25-1.29h1.878l.502-2.523H10.557l.25-1.29h1.878l.36-1.674h2.007l-.36 1.674h1.44l-.36 1.674h-1.44l-.502 2.523h1.44z"/>
                </svg>
                <span className="text-[10px]">{lang === "zh" ? "小红书" : "RED"}</span>
              </button>

              {/* Native share (iOS/Android share sheet) */}
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex min-h-[44px] flex-col items-center gap-1 rounded-lg bg-carte-surface p-3 text-carte-text transition-colors hover:bg-carte-surface-hover"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  <span className="text-[10px]">{t.more}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full text-center text-xs text-carte-text-dim"
            >
              {t.close}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
