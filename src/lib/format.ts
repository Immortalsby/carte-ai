import type { Allergen, LanguageCode } from "@/types/menu";
import { getDictionary } from "./i18n";

export function formatPrice(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function formatAllergens(allergens: Allergen[], language: LanguageCode) {
  const t = getDictionary(language);

  if (allergens.includes("unknown")) {
    if (language === "zh") return "餐馆未提供完整过敏原信息，请向店员确认。";
    if (language === "zh-Hant") return "餐館未提供完整過敏原資訊，請向店員確認。";
    if (language === "fr") return "Informations allergènes incomplètes. Confirmez avec l'équipe.";
    if (language === "es") return "Información de alérgenos incompleta. Confirme con el personal.";
    if (language === "ar") return "معلومات مسببات الحساسية غير كاملة. يرجى التأكيد مع الموظفين.";
    return "Allergen information is incomplete. Please confirm with staff.";
  }

  if (allergens.length === 0) {
    if (language === "zh") return "菜单未标注明显过敏原，仍建议向店员确认。";
    if (language === "zh-Hant") return "菜單未標注明顯過敏原，仍建議向店員確認。";
    if (language === "fr") return "Aucun allergène majeur indiqué, à confirmer avec l'équipe.";
    if (language === "es") return "No se indica ningún alérgeno principal, pero confirme con el personal.";
    if (language === "ar") return "لا توجد مسببات حساسية رئيسية مذكورة، لكن يرجى التأكيد مع الموظفين.";
    return "No major allergen is listed, but please confirm with staff.";
  }

  if (language === "zh") return `含 ${allergens.join(", ")}。`;
  if (language === "zh-Hant") return `含 ${allergens.join(", ")}。`;
  if (language === "fr") return `Contient ${allergens.join(", ")}.`;
  if (language === "es") return `Contiene ${allergens.join(", ")}.`;
  if (language === "ar") return `${t.allergens}: ${allergens.join(", ")}.`;
  return `Contains ${allergens.join(", ")}.`;
}
