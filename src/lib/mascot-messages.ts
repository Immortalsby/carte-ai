import type { LanguageCode } from "@/types/menu";
import type { RestaurantMenu } from "@/types/menu";

/* ─── Idle message pools ─── */
const idle: Record<string, string[]> = {
  en: [
    "Not sure what to order? I can help!",
    "Feeling adventurous today?",
    "Tap me for personalized picks!",
    "Hungry? Let me find something perfect.",
    "First time here? I know the best dishes!",
    "Let me be your dining guide today.",
    "I've got some great suggestions for you!",
    "Want me to pick something special?",
  ],
  fr: [
    "Pas sûr de quoi prendre ? Je peux aider !",
    "Envie de nouveauté aujourd'hui ?",
    "Touchez-moi pour des suggestions perso !",
    "Faim ? Je trouve le plat parfait pour vous.",
    "Première visite ? Je connais les meilleurs plats !",
    "Laissez-moi vous guider aujourd'hui.",
    "J'ai de super suggestions pour vous !",
    "Envie que je vous trouve quelque chose de spécial ?",
  ],
  zh: [
    "不知道吃什么？我来帮你！",
    "嘿嘿，今天想尝点新的吗？",
    "点我，帮你推荐好吃的~",
    "饿了吗？交给我就好！",
    "第一次来？我知道哪些菜最好吃！",
    "今天让我当你的美食向导吧~",
    "我有几个超棒的推荐给你！",
    "想让我帮你挑一道特别的？",
  ],
};

/* ─── Flow step messages ─── */
const flow: Record<string, Record<string, string>> = {
  occasion: {
    en: "What brings you here today?",
    fr: "Qu'est-ce qui vous amène ?",
    zh: "今天什么场合呀？",
  },
  mode: {
    en: "Great! What are you in the mood for?",
    fr: "Super ! Qu'est-ce qui vous ferait envie ?",
    zh: "好的！你想吃什么类型的？",
  },
  preferences: {
    en: "Tell me more about your preferences~",
    fr: "Dites-m'en plus sur vos envies~",
    zh: "告诉我更多你的偏好~",
  },
  loading: {
    en: "Let me think...",
    fr: "Laissez-moi réfléchir...",
    zh: "让我想想...",
  },
  results: {
    en: "Found it! Check these out~",
    fr: "Trouvé ! Regardez ça~",
    zh: "找到啦！看看这些~",
  },
  concerned: {
    en: "Heads up: allergen info below",
    fr: "Attention : info allergènes ci-dessous",
    zh: "注意：有过敏原信息",
  },
  fallback: {
    en: "Oops, I'm feeling a bit sick... These are basic picks, not my best work!",
    fr: "Oups, je suis un peu malade... Ce sont des suggestions basiques, pas mon meilleur travail !",
    zh: "呜呜，我生病了...这些是基础推荐，不是我的最佳发挥！",
  },
  postMealAsk: {
    en: "Did you order one of my picks? 🍽️",
    fr: "Vous avez commandé un de mes choix ? 🍽️",
    zh: "点了我推荐的菜吗？🍽️",
  },
  postMealThanks: {
    en: "Awesome, thanks for the feedback!",
    fr: "Super, merci pour le retour !",
    zh: "太好了，谢谢反馈！",
  },
  postMealNoWorries: {
    en: "No worries! Maybe next time~",
    fr: "Pas de souci ! Peut-être la prochaine fois~",
    zh: "没关系！下次再说~",
  },
  postMealReview: {
    en: "Glad you liked it! Leave a review? ⭐",
    fr: "Content que ça vous ait plu ! Un avis ? ⭐",
    zh: "开心你喜欢！去评价一下？⭐",
  },
};

/* ─── Contextual message generators ─── */
function timeOfDayMessage(hour: number, lang: string): string | null {
  const l = lang.startsWith("zh") ? "zh" : lang === "fr" ? "fr" : "en";
  if (hour >= 6 && hour < 11) {
    return { en: "Good morning! Ready for a great meal?", fr: "Bonjour ! Prêt pour un bon repas ?", zh: "早上好！准备享用美食了吗？" }[l]!;
  }
  if (hour >= 11 && hour < 14) {
    return { en: "Lunchtime! Let me help you decide.", fr: "C'est l'heure du déjeuner !", zh: "午饭时间到！让我帮你选~" }[l]!;
  }
  if (hour >= 18 && hour < 22) {
    return { en: "Dinner time! How about something special?", fr: "L'heure du dîner ! Quelque chose de spécial ?", zh: "晚餐时间，来点好的？" }[l]!;
  }
  return null;
}

function popularDishMessage(dishName: string, lang: string): string {
  const l = lang.startsWith("zh") ? "zh" : lang === "fr" ? "fr" : "en";
  return {
    en: `"${dishName}" is super popular here!`,
    fr: `"${dishName}" est très populaire ici !`,
    zh: `这道${dishName}超多人点的~`,
  }[l]!;
}

function cuisineHintMessage(cuisineType: string, lang: string): string | null {
  const l = lang.startsWith("zh") ? "zh" : lang === "fr" ? "fr" : "en";
  const hints: Record<string, Record<string, string>> = {
    chinese: { en: "Authentic Chinese cuisine — I'll help you pick!", fr: "Cuisine chinoise authentique — je vous guide !", zh: "正宗中餐，我帮你选？" },
    japanese: { en: "Japanese delicacies await! Let me guide you.", fr: "Des délices japonais vous attendent !", zh: "日料推荐？交给我！" },
    french: { en: "French gastronomy at its finest. Shall I suggest?", fr: "La gastronomie française à son meilleur. Un conseil ?", zh: "法餐精选，要我推荐吗？" },
    italian: { en: "Buon appetito! Let me find your perfect dish.", fr: "Buon appetito ! Je vous trouve le plat parfait.", zh: "意大利美食，帮你挑？" },
    korean: { en: "Korean flavors! Want some recommendations?", fr: "Saveurs coréennes ! Des suggestions ?", zh: "韩餐推荐？问我就对了！" },
    thai: { en: "Thai cuisine! How spicy do you like it?", fr: "Cuisine thaï ! Vous aimez épicé ?", zh: "泰餐来啦！你能吃多辣？" },
    vietnamese: { en: "Vietnamese flavors! Fresh and delicious.", fr: "Saveurs vietnamiennes ! Fraîches et délicieuses.", zh: "越南菜，清爽又好吃~" },
    indian: { en: "Indian cuisine! Rich flavors await.", fr: "Cuisine indienne ! Des saveurs riches vous attendent.", zh: "印度菜，风味浓郁！" },
    lebanese: { en: "Lebanese delights! Mezze, grills & more.", fr: "Délices libanais ! Mezze, grillades et plus.", zh: "黎巴嫩美食，烤肉拼盘走起！" },
    moroccan: { en: "Moroccan flavors! Tagine or couscous?", fr: "Saveurs marocaines ! Tagine ou couscous ?", zh: "摩洛哥风味，塔吉锅还是库斯库斯？" },
    turkish: { en: "Turkish cuisine! Kebab, pide & baklava.", fr: "Cuisine turque ! Kebab, pide et baklava.", zh: "土耳其菜，烤肉还是甜点？" },
    greek: { en: "Greek flavors! Fresh and sunny.", fr: "Saveurs grecques ! Fraîches et ensoleillées.", zh: "希腊美食，新鲜又阳光！" },
    spanish: { en: "Spanish tapas & more! Let me guide you.", fr: "Tapas espagnoles et plus ! Je vous guide.", zh: "西班牙小食，帮你选？" },
    mexican: { en: "Mexican feast! Ready to explore?", fr: "Festin mexicain ! Prêt à explorer ?", zh: "墨西哥美食，准备好了吗？" },
    brazilian: { en: "Brazilian flavors! Vibrant and bold.", fr: "Saveurs brésiliennes ! Vibrantes et audacieuses.", zh: "巴西风味，热情奔放！" },
    peruvian: { en: "Peruvian cuisine! Ceviche and beyond.", fr: "Cuisine péruvienne ! Ceviche et bien plus.", zh: "秘鲁菜，酸橘汁腌鱼走起！" },
    caribbean: { en: "Caribbean vibes! Tropical flavors await.", fr: "Ambiance caribéenne ! Saveurs tropicales.", zh: "加勒比风情，热带美味！" },
    african: { en: "African cuisine! Bold and soulful.", fr: "Cuisine africaine ! Audacieuse et généreuse.", zh: "非洲美食，浓郁又暖心！" },
    mediterranean: { en: "Mediterranean gems! Let me help.", fr: "Trésors méditerranéens ! Je vous aide.", zh: "地中海风味，帮你选？" },
    fusion: { en: "Fusion cuisine! Creative flavors await.", fr: "Cuisine fusion ! Des saveurs créatives.", zh: "融合菜，创意无限！" },
  };
  return hints[cuisineType]?.[l] ?? null;
}

/* ─── Intro messages (first visit) ─── */
const intro: Record<string, { greeting: string; features: string[] ; gotIt: string; whatCanYouDo: string }> = {
  en: {
    greeting: "Hi! I'm Cloché, the AI concierge by CarteAI. I help you discover the best dishes on this menu — personalized just for you!",
    features: [
      "Recommend dishes based on your taste and mood",
      "Filter out allergens to keep you safe",
      "Suggest group meals for sharing with friends",
      "Know the best picks for first-time visitors",
      "Speak your language — English, French, Chinese and more",
    ],
    gotIt: "Got it!",
    whatCanYouDo: "What can you do?",
  },
  fr: {
    greeting: "Bonjour ! Je suis Cloché, le concierge IA de CarteAI. Je vous aide à découvrir les meilleurs plats de ce menu — rien que pour vous !",
    features: [
      "Recommander des plats selon vos goûts et envies",
      "Filtrer les allergènes pour votre sécurité",
      "Suggérer des repas de groupe à partager",
      "Connaître les incontournables pour les nouveaux visiteurs",
      "Parler votre langue — français, anglais, chinois et plus",
    ],
    gotIt: "Compris !",
    whatCanYouDo: "Que sais-tu faire ?",
  },
  zh: {
    greeting: "你好！我是 Cloché，CarteAI 的 AI 助手。我能帮你发现这份菜单上最好吃的菜——为你量身推荐！",
    features: [
      "根据你的口味和心情推荐菜品",
      "过滤过敏原，保障你的安全",
      "为朋友聚餐推荐拼桌菜单",
      "第一次来？我知道哪些菜最值得点",
      "支持多语言——中文、英语、法语等",
    ],
    gotIt: "我知道了",
    whatCanYouDo: "你都会做什么？",
  },
};

/* ─── Sad messages (expired trial — AI disabled) ─── */
const sad: Record<string, string[]> = {
  en: [
    "I'm taking a little break... My AI powers are resting.",
    "Sorry, I can't help right now. The menu is still all yours!",
    "I'm feeling sleepy... but the menu is right there for you!",
    "My recommendations are on pause. Browse the menu above!",
    "I miss helping you... Ask the restaurant about CarteAI!",
  ],
  fr: [
    "Je fais une petite pause... Mes pouvoirs IA se reposent.",
    "Désolé, je ne peux pas aider pour l'instant. Le menu est là !",
    "Je suis un peu endormi... mais le menu est juste au-dessus !",
    "Mes recommandations sont en pause. Parcourez le menu !",
    "Vous me manquez... Demandez au restaurant pour CarteAI !",
  ],
  zh: [
    "我在休息一下...我的AI能力暂时关机了。",
    "抱歉，现在帮不了你。菜单还在上面哦！",
    "有点困了...不过菜单就在上面，自己看看吧~",
    "推荐功能暂停中。快去看看菜单吧！",
    "好想帮你...让餐厅了解一下CarteAI吧！",
  ],
};

/* ─── Public API ─── */

/** Pick an idle message, avoiding consecutive repeats */
export function pickIdleMessage(
  lang: LanguageCode,
  lastIndex: number,
): { message: string; index: number } {
  const l = lang.startsWith("zh") ? "zh" : lang === "fr" ? "fr" : "en";
  const pool = idle[l] ?? idle.en;
  let idx: number;
  do {
    idx = Math.floor(Math.random() * pool.length);
  } while (idx === lastIndex && pool.length > 1);
  return { message: pool[idx], index: idx };
}

export type ContextualMessageResult = {
  message: string;
  dishId?: string;
};

/** Pick a contextual message (time / cuisine / popular dish) or null */
export function pickContextualMessage(
  lang: LanguageCode,
  menu: RestaurantMenu,
  cuisineType?: string | null,
): ContextualMessageResult | null {
  const roll = Math.random();

  // 40% time-based
  if (roll < 0.4) {
    const msg = timeOfDayMessage(new Date().getHours(), lang);
    if (msg) return { message: msg };
  }

  // 30% cuisine-based
  if (roll < 0.7 && cuisineType) {
    const msg = cuisineHintMessage(cuisineType, lang);
    if (msg) return { message: msg };
  }

  // 30% popular dish
  const popular = menu.dishes.filter(
    (d) => d.available && d.marginPriority && d.marginPriority >= 3,
  );
  if (popular.length > 0) {
    const dish = popular[Math.floor(Math.random() * popular.length)];
    const name =
      dish.name[lang as keyof typeof dish.name] ||
      dish.name.fr ||
      dish.name.en ||
      Object.values(dish.name)[0];
    if (name) return { message: popularDishMessage(name, lang), dishId: dish.id };
  }

  return null;
}

/** Get the flow message for a given step */
export function getFlowMessage(
  step: string,
  lang: LanguageCode,
): string {
  const l = lang.startsWith("zh") ? "zh" : lang === "fr" ? "fr" : "en";
  return flow[step]?.[l] ?? flow[step]?.en ?? "";
}

/** Pick a random sad message (expired trial) */
export function pickSadMessage(lang: LanguageCode): string {
  const l = lang.startsWith("zh") ? "zh" : lang === "fr" ? "fr" : "en";
  const pool = sad[l] ?? sad.en;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Get intro messages for the first-visit onboarding */
export function getIntroMessages(lang: LanguageCode) {
  const l = lang.startsWith("zh") ? "zh" : lang === "fr" ? "fr" : "en";
  return intro[l] ?? intro.en;
}
