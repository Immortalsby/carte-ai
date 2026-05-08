/**
 * Single source of truth for all supported languages.
 *
 * To add a new language:
 *   1. Add an entry to `supportedLanguages` below
 *   2. Add translation overrides in `src/lib/i18n.ts`
 *   That's it — LanguageCode type, language count, and detection all update automatically.
 */

export const supportedLanguages = [
  { code: "fr", label: "Français", short: "FR", dir: "ltr" },
  { code: "en", label: "English", short: "EN", dir: "ltr" },
  { code: "zh", label: "简体中文", short: "中", dir: "ltr" },
  { code: "zh-Hant", label: "繁體中文", short: "繁", dir: "ltr" },
  { code: "es", label: "Español", short: "ES", dir: "ltr" },
  { code: "it", label: "Italiano", short: "IT", dir: "ltr" },
  { code: "de", label: "Deutsch", short: "DE", dir: "ltr" },
  { code: "pt", label: "Português", short: "PT", dir: "ltr" },
  { code: "ar", label: "العربية", short: "AR", dir: "rtl" },
  { code: "ja", label: "日本語", short: "日", dir: "ltr" },
  { code: "ko", label: "한국어", short: "KO", dir: "ltr" },
  { code: "ru", label: "Русский", short: "RU", dir: "ltr" },
  { code: "tr", label: "Türkçe", short: "TR", dir: "ltr" },
  { code: "nl", label: "Nederlands", short: "NL", dir: "ltr" },
  { code: "pl", label: "Polski", short: "PL", dir: "ltr" },
  { code: "uk", label: "Українська", short: "UK", dir: "ltr" },
  { code: "ro", label: "Română", short: "RO", dir: "ltr" },
  { code: "vi", label: "Tiếng Việt", short: "VI", dir: "ltr" },
  { code: "th", label: "ไทย", short: "TH", dir: "ltr" },
  { code: "hi", label: "हिन्दी", short: "HI", dir: "ltr" },
] as const satisfies ReadonlyArray<{
  code: string;
  label: string;
  short: string;
  dir: "ltr" | "rtl";
}>;

/** Derived from supportedLanguages — never hand-write this type */
export type LanguageCode = (typeof supportedLanguages)[number]["code"];

export const supportedLanguageCodes = supportedLanguages.map((item) => item.code) as [
  LanguageCode,
  ...LanguageCode[],
];

/** Number of supported languages — use in marketing copy instead of hardcoding */
export const SUPPORTED_LANGUAGE_COUNT = supportedLanguages.length;

export function isSupportedLanguage(value: string): value is LanguageCode {
  return supportedLanguageCodes.includes(value as LanguageCode);
}

export function languageDirection(language: LanguageCode) {
  return supportedLanguages.find((item) => item.code === language)?.dir ?? "ltr";
}

/**
 * Unified language detection.
 * Replaces detectBrowserLanguage, detectLandingLocale, detectAuthLocale, detectAdminLocale.
 */
export function detectLanguage(options?: {
  accept?: readonly string[];
  cookie?: string;
  supportedSet?: readonly string[];
  fallback?: string;
}): string {
  const supported = options?.supportedSet ?? (supportedLanguageCodes as readonly string[]);
  const fallback = options?.fallback ?? "en";

  // 1. Cookie takes priority (admin use case)
  if (options?.cookie && supported.includes(options.cookie)) {
    return options.cookie;
  }

  // 2. Parse accept languages (navigator.languages or Accept-Language header values)
  const langs = options?.accept ?? (typeof navigator !== "undefined" ? [...navigator.languages] : []);
  for (const raw of langs) {
    const tag = raw.toLowerCase();
    // zh-Hant special case: zh-TW, zh-HK, zh-MO, zh-Hant → zh-Hant
    if (tag.startsWith("zh")) {
      if (["zh-tw", "zh-hk", "zh-mo", "zh-hant"].some((p) => tag.startsWith(p))) {
        if (supported.includes("zh-Hant")) return "zh-Hant";
      }
      if (supported.includes("zh")) return "zh";
      continue;
    }
    const base = tag.split("-")[0];
    if (supported.includes(base)) return base;
  }

  return fallback;
}
