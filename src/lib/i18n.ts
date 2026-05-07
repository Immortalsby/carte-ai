import type { LanguageCode, LocalizedText } from "@/types/menu";
import { isSupportedLanguage } from "./languages";

type Dictionary = {
  concierge: string;
  prompt: string;
  recommend: string;
  browseMenu: string;
  firstTime: string;
  cheap: string;
  signature: string;
  healthy: string;
  notSpicy: string;
  sharing: string;
  scanning: string;
  bestMatch: string;
  alsoGood: string;
  ingredients: string;
  allergens: string;
  calories: string;
  unknownCalories: string;
  safety: string;
  customRequest: string;
  customPlaceholder: string;
  voice: string;
  listening: string;
  voiceUnavailable: string;
  aiImageNotice: string;
  // Mascot assistant
  mascotTapMe: string;
  mascotClose: string;
  // Group meal mode (FR16/FR17)
  groupMealConcierge: string;
  groupMealPrompt: string;
  groupMealRecommend: string;
  twoPersons: string;
  threePersons: string;
  fourPersons: string;
  hotAndCold: string;
  familyStyle: string;
  lightMeal: string;
};

const en: Dictionary = {
  concierge: "AI Menu Concierge",
  prompt: "How do you want to eat today?",
  recommend: "Recommend for me",
  browseMenu: "Browse full menu",
  firstTime: "First time here",
  cheap: "Under EUR 10",
  signature: "Signature dish",
  healthy: "Keep it healthy",
  notSpicy: "Not spicy",
  sharing: "Two people",
  scanning: "Analyzing budget, taste, restrictions and signatures",
  bestMatch: "Best match",
  alsoGood: "Also good",
  ingredients: "Ingredients",
  allergens: "Allergens",
  calories: "Calories",
  unknownCalories: "Not provided",
  safety:
    "Allergen, ingredient and calorie data comes from the restaurant menu. Please confirm with staff when information is incomplete.",
  customRequest: "Anything specific?",
  customPlaceholder: "Example: I want something warm, no cheese, not too heavy.",
  voice: "Voice",
  listening: "Listening...",
  voiceUnavailable: "Voice input is not available in this browser.",
  aiImageNotice: "AI-generated reference image. Please confirm with staff or the real menu photo.",
  // Mascot
  mascotTapMe: "Tap me for suggestions!",
  mascotClose: "Close",
  // Group meal mode
  groupMealConcierge: "Group Meal Advisor",
  groupMealPrompt: "How many people? I'll pair dishes for you",
  groupMealRecommend: "Plan our meal",
  twoPersons: "2 people",
  threePersons: "3-4 people",
  fourPersons: "5+ people",
  hotAndCold: "Hot & cold mix",
  familyStyle: "Family style",
  lightMeal: "Light meal",
};

const overrides: Partial<Record<LanguageCode, Partial<Dictionary>>> = {
  fr: {
    concierge: "Concierge menu IA",
    prompt: "Comment voulez-vous manger aujourd'hui ?",
    recommend: "Me recommander",
    browseMenu: "Voir tout le menu",
    firstTime: "Première visite",
    cheap: "Moins de 10 EUR",
    signature: "Signature",
    healthy: "Plus léger",
    notSpicy: "Non épicé",
    sharing: "Pour deux",
    scanning: "Analyse du budget, des envies, restrictions et signatures",
    bestMatch: "Le meilleur choix",
    alsoGood: "Autres options",
    ingredients: "Ingrédients",
    allergens: "Allergènes",
    calories: "Calories",
    unknownCalories: "Non fourni",
    safety:
      "Allergènes, ingrédients et calories proviennent du menu fourni par le restaurant. Confirmez avec l'équipe si l'information est incomplète.",
    customRequest: "Une demande spéciale ?",
    customPlaceholder: "Exemple : je veux quelque chose de chaud, sans fromage, pas trop lourd.",
    voice: "Voix",
    listening: "Écoute...",
    voiceUnavailable: "La saisie vocale n'est pas disponible dans ce navigateur.",
    aiImageNotice: "Image de référence générée par IA. Confirmez avec l'équipe ou la vraie photo du menu.",
    mascotTapMe: "Touchez-moi pour des suggestions !",
    mascotClose: "Fermer",
    groupMealConcierge: "Conseiller repas de groupe",
    groupMealPrompt: "Combien de personnes ? Je compose le repas pour vous",
    groupMealRecommend: "Composer notre repas",
    twoPersons: "2 personnes",
    threePersons: "3-4 personnes",
    fourPersons: "5+ personnes",
    hotAndCold: "Chaud & froid",
    familyStyle: "Pour la table",
    lightMeal: "Repas léger",
  },
  zh: {
    concierge: "AI 菜单顾问",
    prompt: "你今天想怎么吃？",
    recommend: "帮我推荐",
    browseMenu: "浏览完整菜单",
    firstTime: "第一次来",
    cheap: "10欧以内",
    signature: "招牌菜",
    healthy: "健康点",
    notSpicy: "不辣",
    sharing: "两个人吃",
    scanning: "正在分析预算、口味、忌口和招牌菜",
    bestMatch: "最适合你",
    alsoGood: "备选推荐",
    ingredients: "食材",
    allergens: "过敏原",
    calories: "卡路里",
    unknownCalories: "未提供",
    safety:
      "过敏原、食材和卡路里信息基于餐馆提供的菜单数据；信息不完整时请向店员确认。",
    customRequest: "有特别要求吗？",
    customPlaceholder: "例如：想吃热一点，不要奶酪，不要太撑。",
    voice: "语音",
    listening: "正在听...",
    voiceUnavailable: "当前浏览器不支持语音输入。",
    aiImageNotice: "AI 生成参考图，请向服务员确认或以真实菜单图片为准。",
    mascotTapMe: "点我，帮你推荐好吃的~",
    mascotClose: "关闭",
    groupMealConcierge: "组菜顾问",
    groupMealPrompt: "几个人吃？帮你搭配菜品",
    groupMealRecommend: "帮我们组菜",
    twoPersons: "2个人",
    threePersons: "3-4个人",
    fourPersons: "5人以上",
    hotAndCold: "冷热搭配",
    familyStyle: "家庭聚餐",
    lightMeal: "简单吃点",
  },
  "zh-Hant": {
    concierge: "AI 菜單顧問",
    prompt: "你今天想怎麼吃？",
    recommend: "幫我推薦",
    browseMenu: "瀏覽完整菜單",
    firstTime: "第一次來",
    cheap: "10歐以內",
    signature: "招牌菜",
    healthy: "健康點",
    notSpicy: "不辣",
    sharing: "兩個人吃",
    scanning: "正在分析預算、口味、忌口和招牌菜",
    bestMatch: "最適合你",
    alsoGood: "備選推薦",
    ingredients: "食材",
    allergens: "過敏原",
    calories: "卡路里",
    unknownCalories: "未提供",
    safety:
      "過敏原、食材和卡路里資訊基於餐館提供的菜單資料；資訊不完整時請向店員確認。",
    customRequest: "有特別要求嗎？",
    customPlaceholder: "例如：想吃熱一點，不要起司，不要太撐。",
    voice: "語音",
    listening: "正在聽...",
    voiceUnavailable: "目前瀏覽器不支援語音輸入。",
    aiImageNotice: "AI 生成參考圖，請向店員確認或以真實菜單圖片為準。",
  },
  es: {
    concierge: "Conserje de menú IA",
    prompt: "¿Cómo quieres comer hoy?",
    recommend: "Recomiéndame",
    browseMenu: "Ver menú completo",
    firstTime: "Primera vez",
    cheap: "Menos de 10 EUR",
    signature: "Plato estrella",
    healthy: "Más saludable",
    notSpicy: "Sin picante",
    sharing: "Para dos",
    scanning: "Analizando presupuesto, gustos, restricciones y platos estrella",
    bestMatch: "Mejor opción",
    alsoGood: "Otra opción",
    ingredients: "Ingredientes",
    allergens: "Alérgenos",
    calories: "Calorías",
    unknownCalories: "No indicado",
    customRequest: "¿Algo específico?",
    customPlaceholder: "Ejemplo: algo caliente, sin queso, no muy pesado.",
    voice: "Voz",
    listening: "Escuchando...",
    voiceUnavailable: "La entrada de voz no está disponible en este navegador.",
    aiImageNotice: "Imagen de referencia generada por IA. Confirme con el personal o la foto real del menú.",
  },
  it: {
    concierge: "Concierge menu IA",
    prompt: "Come vuoi mangiare oggi?",
    recommend: "Consigliami",
    browseMenu: "Vedi tutto il menu",
    firstTime: "Prima volta",
    cheap: "Sotto 10 EUR",
    signature: "Piatto firma",
    healthy: "Più leggero",
    notSpicy: "Non piccante",
    sharing: "Per due",
    bestMatch: "Scelta migliore",
    alsoGood: "Altra opzione",
    ingredients: "Ingredienti",
    allergens: "Allergeni",
    calories: "Calorie",
    unknownCalories: "Non fornito",
  },
  de: {
    concierge: "KI-Menü Concierge",
    prompt: "Wie möchten Sie heute essen?",
    recommend: "Empfehlen",
    browseMenu: "Ganzes Menü ansehen",
    firstTime: "Zum ersten Mal",
    cheap: "Unter 10 EUR",
    signature: "Signature-Gericht",
    healthy: "Leichter essen",
    notSpicy: "Nicht scharf",
    sharing: "Für zwei",
    bestMatch: "Beste Wahl",
    alsoGood: "Weitere Option",
    ingredients: "Zutaten",
    allergens: "Allergene",
    calories: "Kalorien",
    unknownCalories: "Nicht angegeben",
  },
  pt: {
    concierge: "Concierge de menu IA",
    prompt: "Como quer comer hoje?",
    recommend: "Recomendar",
    browseMenu: "Ver menu completo",
    firstTime: "Primeira vez",
    cheap: "Menos de 10 EUR",
    signature: "Prato assinatura",
    healthy: "Mais saudável",
    notSpicy: "Sem picante",
    sharing: "Para dois",
    bestMatch: "Melhor escolha",
    alsoGood: "Outra opção",
    ingredients: "Ingredientes",
    allergens: "Alergénios",
    calories: "Calorias",
    unknownCalories: "Não fornecido",
  },
  ar: {
    concierge: "مساعد قائمة الطعام بالذكاء الاصطناعي",
    prompt: "كيف تريد أن تأكل اليوم؟",
    recommend: "اقترح لي",
    browseMenu: "عرض القائمة كاملة",
    firstTime: "أول زيارة",
    cheap: "أقل من 10 يورو",
    signature: "طبق مميز",
    healthy: "اختيار صحي",
    notSpicy: "غير حار",
    sharing: "لشخصين",
    bestMatch: "أفضل اختيار",
    alsoGood: "خيار آخر",
    ingredients: "المكونات",
    allergens: "مسببات الحساسية",
    calories: "السعرات",
    unknownCalories: "غير متوفر",
    customRequest: "هل لديك طلب خاص؟",
    customPlaceholder: "مثال: أريد شيئاً دافئاً، بدون جبن، وليس ثقيلاً.",
    voice: "صوت",
    listening: "جارٍ الاستماع...",
    voiceUnavailable: "الإدخال الصوتي غير متوفر في هذا المتصفح.",
    aiImageNotice: "صورة مرجعية مولدة بالذكاء الاصطناعي. يرجى التأكد من الموظفين أو صورة القائمة الحقيقية.",
  },
  ja: {
    prompt: "今日はどんな食事にしますか？",
    recommend: "おすすめを見る",
    browseMenu: "全メニューを見る",
    firstTime: "初めて",
    cheap: "10ユーロ以下",
    signature: "看板料理",
    healthy: "ヘルシー",
    notSpicy: "辛くない",
    sharing: "二人で",
    bestMatch: "おすすめ",
    alsoGood: "別の候補",
    ingredients: "食材",
    allergens: "アレルゲン",
    calories: "カロリー",
    unknownCalories: "未提供",
  },
  ko: {
    prompt: "오늘은 어떻게 드시고 싶나요?",
    recommend: "추천 받기",
    browseMenu: "전체 메뉴 보기",
    firstTime: "처음 방문",
    cheap: "10유로 이하",
    signature: "대표 메뉴",
    healthy: "건강하게",
    notSpicy: "맵지 않게",
    sharing: "두 명",
    bestMatch: "가장 추천",
    alsoGood: "다른 추천",
    ingredients: "재료",
    allergens: "알레르겐",
    calories: "칼로리",
    unknownCalories: "제공되지 않음",
  },
  ru: {
    prompt: "Что вы хотите съесть сегодня?",
    recommend: "Порекомендовать",
    browseMenu: "Открыть всё меню",
    firstTime: "Первый раз",
    cheap: "До 10 EUR",
    signature: "Фирменное блюдо",
    healthy: "Полегче",
    notSpicy: "Не острое",
    sharing: "На двоих",
    bestMatch: "Лучший выбор",
    alsoGood: "Другой вариант",
    ingredients: "Ингредиенты",
    allergens: "Аллергены",
    calories: "Калории",
    unknownCalories: "Не указано",
  },
  tr: {
    prompt: "Bugün nasıl yemek istersiniz?",
    recommend: "Öner",
    browseMenu: "Tüm menü",
    firstTime: "İlk kez",
    cheap: "10 EUR altı",
    signature: "İmza yemek",
    healthy: "Daha hafif",
    notSpicy: "Acısız",
    sharing: "İki kişi",
    bestMatch: "En iyi seçim",
    alsoGood: "Diğer seçenek",
    ingredients: "İçindekiler",
    allergens: "Alerjenler",
    calories: "Kalori",
    unknownCalories: "Belirtilmemiş",
  },
  nl: {
    prompt: "Hoe wilt u vandaag eten?",
    recommend: "Aanbevelen",
    browseMenu: "Volledig menu",
    firstTime: "Eerste keer",
    cheap: "Onder 10 EUR",
    signature: "Signatuurgerecht",
    healthy: "Gezonder",
    notSpicy: "Niet pittig",
    sharing: "Voor twee",
    bestMatch: "Beste keuze",
    ingredients: "Ingrediënten",
    allergens: "Allergenen",
  },
  pl: {
    prompt: "Na co masz dziś ochotę?",
    recommend: "Poleć mi",
    browseMenu: "Całe menu",
    firstTime: "Pierwszy raz",
    cheap: "Poniżej 10 EUR",
    signature: "Danie firmowe",
    healthy: "Zdrowiej",
    notSpicy: "Nieostre",
    sharing: "Dla dwóch",
    bestMatch: "Najlepszy wybór",
    ingredients: "Składniki",
    allergens: "Alergeny",
  },
  uk: {
    prompt: "Що ви хочете сьогодні з'їсти?",
    recommend: "Порекомендувати",
    browseMenu: "Усе меню",
    firstTime: "Перший раз",
    cheap: "До 10 EUR",
    signature: "Фірмова страва",
    healthy: "Здоровіше",
    notSpicy: "Не гостре",
    sharing: "Для двох",
    bestMatch: "Найкращий вибір",
    ingredients: "Інгредієнти",
    allergens: "Алергени",
  },
  ro: {
    prompt: "Cum vrei să mănânci azi?",
    recommend: "Recomandă-mi",
    browseMenu: "Meniu complet",
    firstTime: "Prima dată",
    cheap: "Sub 10 EUR",
    signature: "Specialitatea casei",
    healthy: "Mai sănătos",
    notSpicy: "Nepicant",
    sharing: "Pentru doi",
    bestMatch: "Cea mai bună alegere",
    ingredients: "Ingrediente",
    allergens: "Alergeni",
  },
  vi: {
    prompt: "Hôm nay bạn muốn ăn thế nào?",
    recommend: "Gợi ý cho tôi",
    browseMenu: "Xem toàn bộ menu",
    firstTime: "Lần đầu",
    cheap: "Dưới 10 EUR",
    signature: "Món đặc trưng",
    healthy: "Lành mạnh hơn",
    notSpicy: "Không cay",
    sharing: "Hai người",
    bestMatch: "Phù hợp nhất",
    ingredients: "Nguyên liệu",
    allergens: "Chất gây dị ứng",
  },
  th: {
    prompt: "วันนี้อยากกินแบบไหน?",
    recommend: "แนะนำให้ฉัน",
    browseMenu: "ดูเมนูทั้งหมด",
    firstTime: "มาครั้งแรก",
    cheap: "ต่ำกว่า 10 EUR",
    signature: "เมนูแนะนำ",
    healthy: "สุขภาพดี",
    notSpicy: "ไม่เผ็ด",
    sharing: "สองคน",
    bestMatch: "เหมาะที่สุด",
    ingredients: "ส่วนผสม",
    allergens: "สารก่อภูมิแพ้",
  },
  hi: {
    prompt: "आज आप क्या खाना चाहेंगे?",
    recommend: "मेरे लिए सुझाएँ",
    browseMenu: "पूरा मेनू देखें",
    firstTime: "पहली बार",
    cheap: "10 EUR से कम",
    signature: "विशेष डिश",
    healthy: "स्वस्थ विकल्प",
    notSpicy: "बिना तीखा",
    sharing: "दो लोगों के लिए",
    bestMatch: "सबसे अच्छा विकल्प",
    ingredients: "सामग्री",
    allergens: "एलर्जन",
  },
};

export function getDictionary(language: LanguageCode): Dictionary {
  return { ...en, ...(overrides[language] ?? {}) };
}

export function getLocalizedText(text: LocalizedText, language: LanguageCode) {
  return (
    text[language] ||
    (language === "zh-Hant" ? text.zh : undefined) ||
    text.en ||
    text.fr ||
    text.zh
  );
}

export function detectBrowserLanguage(languages: readonly string[]) {
  for (const raw of languages) {
    const normalized = raw.toLowerCase();
    if (normalized === "zh-tw" || normalized === "zh-hk" || normalized === "zh-mo") {
      return "zh-Hant";
    }
    if (normalized.startsWith("zh")) return "zh";
    const primary = normalized.split("-")[0];
    if (isSupportedLanguage(raw)) return raw;
    if (isSupportedLanguage(primary)) return primary;
  }

  return "fr";
}
