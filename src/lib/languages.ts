import type { LanguageCode } from "@/types/menu";

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
] as const satisfies Array<{
  code: LanguageCode;
  label: string;
  short: string;
  dir: "ltr" | "rtl";
}>;

export const supportedLanguageCodes = supportedLanguages.map((item) => item.code) as [
  LanguageCode,
  ...LanguageCode[],
];

export function isSupportedLanguage(value: string): value is LanguageCode {
  return supportedLanguageCodes.includes(value as LanguageCode);
}

export function languageDirection(language: LanguageCode) {
  return supportedLanguages.find((item) => item.code === language)?.dir ?? "ltr";
}
