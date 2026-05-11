import type { LanguageCode } from "@/types/menu";

interface RestaurantHeaderProps {
  name: string;
  cuisineType?: string | null;
  rating?: string | null;
  address?: string | null;
  lang: LanguageCode;
  children?: React.ReactNode;
}

// Cuisine labels — keyed by DB/Google Places value.
// For non-Latin scripts (ja/ko/ar/ru/hi/th), we provide native labels.
// Latin-script languages fall back to English which is universally recognizable for cuisine names.
function c(en: string, fr: string, zh: string, extra?: Record<string, string>): Record<string, string> {
  return { en, fr, zh, ...extra };
}

const cuisineLabels: Record<string, Record<string, string>> = {
  chinese_restaurant: c("Chinese", "Chinois", "中餐", { ja: "中華", ko: "중식", ar: "صيني", ru: "Китайская", hi: "चीनी", th: "จีน" }),
  chinese: c("Chinese", "Chinois", "中餐", { ja: "中華", ko: "중식", ar: "صيني", ru: "Китайская", hi: "चीनी", th: "จีน" }),
  french_restaurant: c("French", "Français", "法餐", { ja: "フレンチ", ko: "프랑스", ar: "فرنسي", ru: "Французская", hi: "फ़्रेंच", th: "ฝรั่งเศส" }),
  french: c("French", "Français", "法餐", { ja: "フレンチ", ko: "프랑스", ar: "فرنسي", ru: "Французская", hi: "फ़्रेंच", th: "ฝรั่งเศส" }),
  indian_restaurant: c("Indian", "Indien", "印度菜", { ja: "インド", ko: "인도", ar: "هندي", ru: "Индийская", hi: "भारतीय", th: "อินเดีย" }),
  indian: c("Indian", "Indien", "印度菜", { ja: "インド", ko: "인도", ar: "هندي", ru: "Индийская", hi: "भारतीय", th: "อินเดีย" }),
  italian_restaurant: c("Italian", "Italien", "意大利菜", { ja: "イタリアン", ko: "이탈리안", ar: "إيطالي", ru: "Итальянская", hi: "इतालवी", th: "อิตาเลียน" }),
  italian: c("Italian", "Italien", "意大利菜", { ja: "イタリアン", ko: "이탈리안", ar: "إيطالي", ru: "Итальянская", hi: "इतालवी", th: "อิตาเลียน" }),
  japanese_restaurant: c("Japanese", "Japonais", "日本料理", { ja: "和食", ko: "일식", ar: "ياباني", ru: "Японская", hi: "जापानी", th: "ญี่ปุ่น" }),
  japanese: c("Japanese", "Japonais", "日本料理", { ja: "和食", ko: "일식", ar: "ياباني", ru: "Японская", hi: "जापानी", th: "ญี่ปุ่น" }),
  japanese_fusion: c("Japanese Fusion", "Fusion japonaise", "日式融合", { ja: "創作和食", ko: "일식 퓨전", ar: "فيوجن ياباني", ru: "Японский фьюжн" }),
  korean_restaurant: c("Korean", "Coréen", "韩国料理", { ja: "韓国", ko: "한식", ar: "كوري", ru: "Корейская", hi: "कोरियाई", th: "เกาหลี" }),
  korean: c("Korean", "Coréen", "韩国料理", { ja: "韓国", ko: "한식", ar: "كوري", ru: "Корейская", hi: "कोरियाई", th: "เกาหลี" }),
  thai_restaurant: c("Thai", "Thaïlandais", "泰国菜", { ja: "タイ", ko: "태국", ar: "تايلاندي", ru: "Тайская", hi: "थाई", th: "ไทย" }),
  thai: c("Thai", "Thaïlandais", "泰国菜", { ja: "タイ", ko: "태국", ar: "تايلاندي", ru: "Тайская", hi: "थाई", th: "ไทย" }),
  mexican_restaurant: c("Mexican", "Mexicain", "墨西哥菜", { ja: "メキシカン", ko: "멕시코", ar: "مكسيكي", ru: "Мексиканская" }),
  mexican: c("Mexican", "Mexicain", "墨西哥菜", { ja: "メキシカン", ko: "멕시코", ar: "مكسيكي", ru: "Мексиканская" }),
  mediterranean_restaurant: c("Mediterranean", "Méditerranéen", "地中海菜", { ja: "地中海", ko: "지중해", ar: "متوسطي", ru: "Средиземноморская" }),
  mediterranean: c("Mediterranean", "Méditerranéen", "地中海菜", { ja: "地中海", ko: "지중해", ar: "متوسطي", ru: "Средиземноморская" }),
  vietnamese_restaurant: c("Vietnamese", "Vietnamien", "越南菜", { ja: "ベトナム", ko: "베트남", ar: "فيتنامي", ru: "Вьетнамская", vi: "Việt Nam", th: "เวียดนาม" }),
  vietnamese: c("Vietnamese", "Vietnamien", "越南菜", { ja: "ベトナム", ko: "베트남", ar: "فيتنامي", ru: "Вьетнамская", vi: "Việt Nam", th: "เวียดนาม" }),
  lebanese_restaurant: c("Lebanese", "Libanais", "黎巴嫩菜", { ar: "لبناني", ru: "Ливанская", ja: "レバノン", ko: "레바논" }),
  lebanese: c("Lebanese", "Libanais", "黎巴嫩菜", { ar: "لبناني", ru: "Ливанская", ja: "レバノン", ko: "레바논" }),
  moroccan_restaurant: c("Moroccan", "Marocain", "摩洛哥菜", { ar: "مغربي", ru: "Марокканская", ja: "モロッコ", ko: "모로코" }),
  moroccan: c("Moroccan", "Marocain", "摩洛哥菜", { ar: "مغربي", ru: "Марокканская", ja: "モロッコ", ko: "모로코" }),
  turkish_restaurant: c("Turkish", "Turc", "土耳其菜", { tr: "Türk", ar: "تركي", ru: "Турецкая", ja: "トルコ", ko: "터키" }),
  turkish: c("Turkish", "Turc", "土耳其菜", { tr: "Türk", ar: "تركي", ru: "Турецкая", ja: "トルコ", ko: "터키" }),
  greek_restaurant: c("Greek", "Grec", "希腊菜", { ar: "يوناني", ru: "Греческая", ja: "ギリシャ", ko: "그리스" }),
  greek: c("Greek", "Grec", "希腊菜", { ar: "يوناني", ru: "Греческая", ja: "ギリシャ", ko: "그리스" }),
  spanish_restaurant: c("Spanish", "Espagnol", "西班牙菜", { es: "Español", ar: "إسباني", ru: "Испанская", ja: "スペイン", ko: "스페인" }),
  spanish: c("Spanish", "Espagnol", "西班牙菜", { es: "Español", ar: "إسباني", ru: "Испанская", ja: "スペイン", ko: "스페인" }),
  brazilian_restaurant: c("Brazilian", "Brésilien", "巴西菜", { pt: "Brasileiro", ru: "Бразильская", ja: "ブラジル", ko: "브라질" }),
  brazilian: c("Brazilian", "Brésilien", "巴西菜", { pt: "Brasileiro", ru: "Бразильская", ja: "ブラジル", ko: "브라질" }),
  peruvian_restaurant: c("Peruvian", "Péruvien", "秘鲁菜", { es: "Peruano", ru: "Перуанская", ja: "ペルー", ko: "페루" }),
  peruvian: c("Peruvian", "Péruvien", "秘鲁菜", { es: "Peruano", ru: "Перуанская", ja: "ペルー", ko: "페루" }),
  caribbean_restaurant: c("Caribbean", "Caribéen", "加勒比菜", { ar: "كاريبي", ru: "Карибская", ja: "カリブ", ko: "카리브" }),
  caribbean: c("Caribbean", "Caribéen", "加勒比菜", { ar: "كاريبي", ru: "Карибская", ja: "カリブ", ko: "카리브" }),
  african_restaurant: c("African", "Africain", "非洲菜", { ar: "أفريقي", ru: "Африканская", ja: "アフリカ", ko: "아프리카" }),
  african: c("African", "Africain", "非洲菜", { ar: "أفريقي", ru: "Африканская", ja: "アフリカ", ko: "아프리카" }),
  fusion: c("Fusion", "Fusion", "融合菜", { ja: "フュージョン", ko: "퓨전", ar: "فيوجن", ru: "Фьюжн" }),
  american: c("American", "Américain", "美式菜", { ja: "アメリカン", ko: "미국", ar: "أمريكي", ru: "Американская" }),
  sichuan: c("Sichuan", "Sichuan", "川菜", { ja: "四川", ko: "쓰촨", ar: "سيشوان", ru: "Сычуаньская" }),
  cantonese: c("Cantonese", "Cantonais", "粤菜", { ja: "広東", ko: "광둥", ar: "كانتوني", ru: "Кантонская" }),
};

function getCuisineLabel(cuisineType: string, lang: LanguageCode): string {
  const labels = cuisineLabels[cuisineType];
  if (labels) {
    return labels[lang] || labels.en || cuisineType.replace(/_restaurant$/, "").replace(/_/g, " ");
  }
  return cuisineType.replace(/_restaurant$/, "").replace(/_/g, " ");
}

export function RestaurantHeader({
  name,
  cuisineType,
  rating,
  address,
  lang,
  children,
}: RestaurantHeaderProps) {
  const showRating = rating && parseFloat(rating) >= 4.5;

  return (
    <header className="relative overflow-hidden rounded-2xl bg-carte-surface px-5 py-6 text-center">
      {/* Glow background effect */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, var(--carte-glow) 0%, transparent 70%)",
        }}
      />

      {/* Layer 1: Restaurant name */}
      <h1 className="relative text-[1.75rem] font-bold leading-tight text-carte-text">
        {name}
      </h1>

      {/* Layer 2: Cuisine + Rating */}
      {(cuisineType || showRating) && (
        <p className="relative mt-1.5 flex items-center justify-center gap-2 text-sm">
          {cuisineType && (
            <span className="font-medium capitalize text-carte-primary">
              {getCuisineLabel(cuisineType, lang)}
            </span>
          )}
          {showRating && (
            <span className="inline-flex items-center gap-0.5 text-carte-accent">
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {rating}
            </span>
          )}
        </p>
      )}

      {/* Layer 3: Address */}
      {address && (
        <p className="relative mt-1 text-xs text-carte-text-dim">{address}</p>
      )}

      {/* Layer 4: Optional children (e.g. language switcher) */}
      {children && (
        <div className="relative mt-2.5">{children}</div>
      )}
    </header>
  );
}
