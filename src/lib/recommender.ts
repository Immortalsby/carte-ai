import type { Dish, LanguageCode, RestaurantMenu } from "@/types/menu";
import type {
  RecommendationItem,
  RecommendationRequest,
} from "@/types/recommendation";
import { formatAllergens, formatPrice } from "./format";
import { getDictionary, getLocalizedText } from "./i18n";

function phrase(
  language: LanguageCode,
  values: Partial<Record<LanguageCode, string>> & { en: string },
) {
  return values[language] || (language === "zh-Hant" ? values.zh : undefined) || values.en;
}

function hasAny<T>(items: T[], blocked: T[]) {
  return blocked.some((item) => items.includes(item));
}

function passesHardFilters(dish: Dish, request: RecommendationRequest) {
  if (!dish.available) return false;
  if (request.maxSpiceLevel !== undefined && dish.spiceLevel > request.maxSpiceLevel) {
    return false;
  }
  if (hasAny(dish.allergens, request.excludedAllergens)) return false;

  if (request.excludedTags.includes("vegetarian")) {
    const isVegetarian =
      dish.dietaryTags.includes("vegetarian") || dish.dietaryTags.includes("vegan");
    if (!isVegetarian) return false;
  }

  const blockedTags = request.excludedTags.filter((tag) => tag !== "vegetarian");
  return !hasAny(dish.dietaryTags, blockedTags);
}

function scoreDish(dish: Dish, request: RecommendationRequest) {
  let score = 10;

  if (dish.dietaryTags.includes("popular")) score += 8;
  if (dish.dietaryTags.includes("signature")) score += 8;
  if (dish.dietaryTags.includes("good_value")) score += 7;
  if (dish.marginPriority === 3) score += 3;
  if (dish.portionScore === 3) score += 5;

  const price = dish.priceCents ?? 0;

  if (request.budgetCents) {
    if (price <= request.budgetCents) {
      score += 12;
    } else {
      score -= Math.min(18, Math.ceil((price - request.budgetCents) / 100));
    }
  }

  switch (request.mode) {
    case "cheap":
      if (price <= 1000) score += 15;
      if (dish.dietaryTags.includes("good_value")) score += 10;
      if ((dish.portionScore ?? 1) >= 2) score += 5;
      break;
    case "healthy":
      if (dish.dietaryTags.includes("low_calorie")) score += 12;
      if (dish.dietaryTags.includes("light")) score += 10;
      if (dish.dietaryTags.includes("high_protein")) score += 8;
      if (dish.caloriesKcal !== undefined && dish.caloriesKcal <= 650) score += 8;
      if (dish.spiceLevel <= 1) score += 2;
      break;
    case "first_time":
      if (dish.dietaryTags.includes("popular")) score += 12;
      if (dish.dietaryTags.includes("signature")) score += 10;
      if (dish.spiceLevel <= 1) score += 4;
      break;
    case "signature":
      if (dish.dietaryTags.includes("signature")) score += 15;
      if (dish.dietaryTags.includes("popular")) score += 8;
      break;
    case "sharing":
      if (dish.portionScore === 3) score += 10;
      if (dish.category === "combo") score += 12;
      if (dish.category === "starter" || dish.category === "side") score += 6;
      break;
    case "not_sure":
      if (dish.dietaryTags.includes("popular")) score += 12;
      if (dish.dietaryTags.includes("good_value")) score += 8;
      if (dish.dietaryTags.includes("signature")) score += 8;
      if (dish.spiceLevel <= 1) score += 3;
      break;
  }

  // Category-based scoring: treat new categories like their closest match
  if (dish.category === "sharing") {
    if (request.mode === "sharing") score += 12;
    score += 4; // sharing plates are generally appealing
  }
  if (dish.category === "soup") score += 2; // treat like starter
  if (dish.category === "pasta") score += 2; // treat like main
  if (dish.category === "wine" || dish.category === "cocktail") {
    // treat like drink
    if (request.occasion === "drinks") score += 10;
  }
  if (dish.category === "brunch") score += 2; // treat like main

  // Occasion-based scoring adjustments
  if (request.occasion === "drinks") {
    if (dish.category === "drink" || dish.category === "wine" || dish.category === "cocktail") score += 12;
    if (dish.category === "starter" || dish.category === "sharing") score += 6;
    if (dish.category === "main") score -= 5;
  } else if (request.occasion === "feast") {
    if (dish.portionScore === 3) score += 8;
    if (dish.category === "side") score += 6;
    if (dish.category === "starter") score += 4;
  }

  return score;
}

function localizedReason(dish: Dish, request: RecommendationRequest) {
  const language = request.language;
  const parts: string[] = [];

  // Only mention budget when the user actually set one
  if (request.budgetCents !== undefined) {
    const withinBudget = (dish.priceCents ?? 0) <= request.budgetCents;
    parts.push(
      withinBudget
        ? phrase(language, {
            zh: "预算合适",
            "zh-Hant": "預算合適",
            fr: "respecte le budget",
            es: "encaja con tu presupuesto",
            en: "fits your budget",
          })
        : phrase(language, {
            zh: "略超预算但很接近",
            "zh-Hant": "略超預算但很接近",
            fr: "légèrement au-dessus du budget",
            es: "ligeramente por encima del presupuesto",
            en: "slightly above budget but close",
          }),
    );
  }

  if (dish.dietaryTags.includes("high_protein"))
    parts.push(phrase(language, { zh: "蛋白质较高", "zh-Hant": "蛋白質較高", fr: "riche en protéines", es: "alto en proteínas", en: "high protein" }));
  if (dish.dietaryTags.includes("light"))
    parts.push(phrase(language, { zh: "口味轻盈", "zh-Hant": "口味輕盈", fr: "option légère", es: "opción ligera", en: "light option" }));
  if (dish.dietaryTags.includes("signature"))
    parts.push(phrase(language, { zh: "属于招牌选择", "zh-Hant": "屬於招牌選擇", fr: "plat signature", es: "plato estrella", en: "signature choice" }));
  if (dish.spiceLevel === 0)
    parts.push(phrase(language, { zh: "不辣", "zh-Hant": "不辣", fr: "non épicé", es: "sin picante", en: "not spicy" }));
  if ((dish.portionScore ?? 1) >= 3)
    parts.push(phrase(language, { zh: "分量足", "zh-Hant": "分量足", fr: "portion généreuse", es: "porción generosa", en: "generous portion" }));

  if (parts.length === 0) {
    parts.push(phrase(language, { zh: "适合你", "zh-Hant": "適合你", fr: "adapté pour vous", es: "adecuado para ti", en: "a good match for you" }));
  }

  if (language === "zh") return `${parts.join("、")}，适合你现在的选择。`;
  if (language === "zh-Hant") return `${parts.join("、")}，適合你現在的選擇。`;
  if (language === "fr") return `${parts.join(", ")}. Un bon choix pour votre envie.`;
  if (language === "es") return `${parts.join(", ")}. Una buena opción para ti.`;
  return `${parts.join(", ")}. A practical match for your current choices.`;
}

function notesFor(dish: Dish, request: RecommendationRequest) {
  const language = request.language;
  const budgetNote = request.budgetCents
    ? (dish.priceCents ?? 0) <= request.budgetCents
      ? phrase(language, {
          zh: `符合 ${formatPrice(request.budgetCents)} 以内预算。`,
          "zh-Hant": `符合 ${formatPrice(request.budgetCents)} 以內預算。`,
          fr: `Dans votre budget de ${formatPrice(request.budgetCents)}.`,
          es: `Dentro de tu presupuesto de ${formatPrice(request.budgetCents)}.`,
          en: `Within your ${formatPrice(request.budgetCents)} budget.`,
        })
      : phrase(language, {
          zh: `价格 ${formatPrice(dish.priceCents ?? 0)}，略高于预算。`,
          "zh-Hant": `價格 ${formatPrice(dish.priceCents ?? 0)}，略高於預算。`,
          fr: `${formatPrice(dish.priceCents ?? 0)}, légèrement au-dessus du budget.`,
          es: `${formatPrice(dish.priceCents ?? 0)}, ligeramente por encima del presupuesto.`,
          en: `${formatPrice(dish.priceCents ?? 0)}, slightly above budget.`,
        })
    : undefined;

  const healthNote =
    dish.caloriesKcal !== undefined
      ? phrase(language, {
          zh: `餐馆提供约 ${dish.caloriesKcal} kcal。`,
          "zh-Hant": `餐館提供約 ${dish.caloriesKcal} kcal。`,
          fr: `Environ ${dish.caloriesKcal} kcal selon le restaurant.`,
          es: `Aproximadamente ${dish.caloriesKcal} kcal según el restaurante.`,
          en: `About ${dish.caloriesKcal} kcal according to the restaurant.`,
        })
      : phrase(language, {
          zh: "餐馆未提供卡路里数据。",
          "zh-Hant": "餐館未提供卡路里資料。",
          fr: "Calories non fournies par le restaurant.",
          es: "El restaurante no proporcionó calorías.",
          en: "Calories not provided by the restaurant.",
        });

  return {
    budgetNote,
    healthNote,
    allergenWarning: formatAllergens(dish.allergens, language),
  };
}

function toItem(
  dish: Dish,
  request: RecommendationRequest,
  index: number,
  score: number,
): RecommendationItem {
  return {
    id: `rec-${index + 1}`,
    type: dish.category === "combo" ? "combo" : "single_dish",
    dishIds: [dish.id],
    title: getLocalizedText(dish.name, request.language),
    totalPriceCents: dish.priceCents || 0,
    reason: localizedReason(dish, request),
    confidence: Number.isFinite(score) ? Math.max(0.55, Math.min(0.96, score / 70)) : 0.55,
    ...notesFor(dish, request),
  };
}

function buildSet(
  menu: RestaurantMenu,
  request: RecommendationRequest,
  scored: Array<{ dish: Dish; score: number }>,
): RecommendationItem | undefined {
  // Generate set when: has occasion, sharing mode, party size >= 2, or decent budget
  if (
    !request.occasion &&
    request.partySize < 2 &&
    request.mode !== "sharing" &&
    (!request.budgetCents || request.budgetCents < 1500)
  ) {
    return undefined;
  }

  const ps = request.partySize;
  const occasion = request.occasion || "meal";
  const used = new Set<string>();

  function pickN(category: string, n: number): Dish[] {
    const picks: Dish[] = [];
    for (const { dish } of scored) {
      if (picks.length >= n) break;
      if (dish.category === category && !used.has(dish.id)) {
        picks.push(dish);
        used.add(dish.id);
      }
    }
    return picks;
  }

  let dishes: Dish[];

  if (occasion === "drinks") {
    // Afterwork: mainly drinks + shareable snacks
    // Include wine/cocktail as drink alternatives
    const drinkCount = ps + 1;
    const starterCount = ps >= 3 ? 2 : 1;
    const sharingCount = ps >= 2 ? 1 : 0;
    const drinks = pickN("drink", drinkCount);
    const wines = pickN("wine", Math.max(1, Math.floor(drinkCount / 2)));
    const cocktails = pickN("cocktail", Math.max(1, Math.floor(drinkCount / 2)));
    const allDrinks = [...drinks, ...wines, ...cocktails].slice(0, drinkCount + 1);
    const starters = pickN("starter", starterCount);
    const sharing = pickN("sharing", sharingCount);
    dishes = [...allDrinks, ...sharing, ...starters];
  } else if (occasion === "feast") {
    // Family-style sharing (e.g. Chinese): more dishes to share + rice/sides
    // 2p: 3 mains + 1 starter + 1 side + 2 drinks
    // 3p: 4 mains + 1 starter + 2 sides + 2 drinks
    // 4p: 5 mains + 2 starters + 2 sides + 3 drinks
    const mainCount = ps + 1;
    const starterCount = ps >= 4 ? 2 : 1;
    const sideCount = ps >= 3 ? 2 : 1;
    const drinkCount = ps >= 4 ? 3 : 2;
    const mains = pickN("main", mainCount);
    const starters = pickN("starter", starterCount);
    const sides = pickN("side", sideCount);
    const drinks = pickN("drink", drinkCount);
    dishes = [...mains, ...starters, ...sides, ...drinks];
  } else {
    // Regular meal: each person gets ~1 main
    // 1p: 1 main + 1 drink
    // 2p: 2 mains + 1 starter + 2 drinks
    // 3p: 3 mains + 1 starter + 1 side + 2 drinks
    // 4p: 4 mains + 2 starters + 1 side + 3 drinks
    const mains = pickN("main", Math.max(ps, 1));
    const starters = pickN("starter", ps >= 4 ? 2 : ps >= 2 ? 1 : 0);
    const sides = pickN("side", ps >= 3 ? 1 : 0);
    const drinks = pickN("drink", ps >= 4 ? 3 : ps >= 2 ? 2 : 1);
    dishes = [...mains, ...starters, ...sides, ...drinks];
  }

  if (dishes.length < 2) return undefined;

  // Portion validation: ensure enough food for the group
  const defaultPortion = (cat: string) =>
    ["main", "pasta", "soup", "brunch"].includes(cat) ? 2 : ["sharing", "combo"].includes(cat) ? 3 : 1;
  let totalPortion = dishes.reduce((sum, d) => sum + (d.portionScore ?? defaultPortion(d.category)), 0);
  const targetPortion = occasion === "feast" ? ps * 3 : ps * 2;

  // If not enough food, add more dishes from scored list
  if (totalPortion < targetPortion) {
    const fillCategories = occasion === "feast" ? ["main", "sharing", "side", "starter"] : ["main", "side", "pasta"];
    for (const cat of fillCategories) {
      if (totalPortion >= targetPortion) break;
      const extras = pickN(cat, 2);
      for (const extra of extras) {
        if (totalPortion >= targetPortion) break;
        dishes.push(extra);
        totalPortion += extra.portionScore ?? defaultPortion(extra.category);
      }
    }
  }

  const total = dishes.reduce((sum, dish) => sum + (dish.priceCents || 0), 0);
  // Budget check: allow 20% overshoot for group meals
  const budgetLimit = request.budgetCents
    ? request.budgetCents * ps + request.budgetCents * 0.2
    : undefined;
  if (budgetLimit && total > budgetLimit) return undefined;

  const dishNames = dishes
    .map((d) => getLocalizedText(d.name, request.language))
    .filter(Boolean);

  const sizeLabel = phrase(request.language, {
    zh: `${request.partySize}人`,
    "zh-Hant": `${request.partySize}人`,
    fr: `${request.partySize} pers.`,
    es: `${request.partySize} pers.`,
    en: `${request.partySize}p`,
  });

  const occasionLabel = occasion === "drinks"
    ? phrase(request.language, { zh: "小酌方案", "zh-Hant": "小酌方案", fr: "Apéro", es: "Aperitivo", en: "Drinks" })
    : occasion === "feast"
      ? phrase(request.language, { zh: "合菜方案", "zh-Hant": "合菜方案", fr: "Festin", es: "Festín", en: "Feast" })
      : phrase(request.language, { zh: "推荐套餐", "zh-Hant": "推薦套餐", fr: "Combo", es: "Combo", en: "Combo" });

  const title = phrase(request.language, {
    zh: `${sizeLabel}${occasionLabel}：${dishNames.join(" + ")}`,
    "zh-Hant": `${sizeLabel}${occasionLabel}：${dishNames.join(" + ")}`,
    fr: `${occasionLabel} ${sizeLabel} : ${dishNames.join(" + ")}`,
    es: `${occasionLabel} ${sizeLabel}: ${dishNames.join(" + ")}`,
    en: `${sizeLabel} ${occasionLabel}: ${dishNames.join(" + ")}`,
  });

  // Count dishes by category for the reason text
  const catCounts = new Map<string, number>();
  for (const d of dishes) {
    catCounts.set(d.category, (catCounts.get(d.category) || 0) + 1);
  }

  const catLabels: Record<string, Record<string, string>> = {
    main:     { zh: "主菜", "zh-Hant": "主菜", fr: "plat", es: "plato", en: "main" },
    starter:  { zh: "前菜", "zh-Hant": "前菜", fr: "entrée", es: "entrada", en: "starter" },
    side:     { zh: "配菜", "zh-Hant": "配菜", fr: "accomp.", es: "acomp.", en: "side" },
    drink:    { zh: "饮品", "zh-Hant": "飲品", fr: "boisson", es: "bebida", en: "drink" },
    dessert:  { zh: "甜点", "zh-Hant": "甜點", fr: "dessert", es: "postre", en: "dessert" },
    combo:    { zh: "套餐", "zh-Hant": "套餐", fr: "combo", es: "combo", en: "combo" },
    sharing:  { zh: "分享", "zh-Hant": "分享", fr: "partage", es: "para compartir", en: "sharing" },
    soup:     { zh: "汤品", "zh-Hant": "湯品", fr: "soupe", es: "sopa", en: "soup" },
    pasta:    { zh: "意面", "zh-Hant": "義大利麵", fr: "pâtes", es: "pasta", en: "pasta" },
    wine:     { zh: "葡萄酒", "zh-Hant": "葡萄酒", fr: "vin", es: "vino", en: "wine" },
    cocktail: { zh: "鸡尾酒", "zh-Hant": "雞尾酒", fr: "cocktail", es: "cóctel", en: "cocktail" },
    brunch:   { zh: "早午餐", "zh-Hant": "早午餐", fr: "brunch", es: "brunch", en: "brunch" },
  };

  function catSummary(lang: string): string {
    const parts: string[] = [];
    for (const [cat, count] of catCounts) {
      const label = catLabels[cat]?.[lang] || catLabels[cat]?.en || cat;
      if (lang === "zh" || lang === "zh-Hant") {
        parts.push(`${count}个${label}`);
      } else if (lang === "fr") {
        parts.push(`${count} ${label}${count > 1 ? "s" : ""}`);
      } else if (lang === "es") {
        parts.push(`${count} ${label}${count > 1 ? "s" : ""}`);
      } else {
        parts.push(`${count} ${label}${count > 1 ? "s" : ""}`);
      }
    }
    return parts.join(lang === "zh" || lang === "zh-Hant" ? "、" : ", ");
  }

  const portionShort = totalPortion < targetPortion;
  const portionNote = portionShort
    ? phrase(request.language, {
        zh: " 分量可能偏少，建议再加一个配菜。",
        "zh-Hant": " 分量可能偏少，建議再加一個配菜。",
        fr: " Portions un peu justes — pensez à ajouter un accompagnement.",
        es: " Las porciones pueden ser justas — considere añadir un acompañamiento.",
        en: " Portions may be light — consider adding a side.",
      })
    : "";

  const reason = phrase(request.language, {
    zh: `搭配了${catSummary("zh")}，适合${request.partySize}人一起享用。${portionNote}`,
    "zh-Hant": `搭配了${catSummary("zh-Hant")}，適合${request.partySize}人一起享用。${portionNote}`,
    fr: `${catSummary("fr")} pour ${request.partySize} personnes.${portionNote}`,
    es: `${catSummary("es")} para ${request.partySize} personas.${portionNote}`,
    en: `${catSummary("en")} for ${request.partySize} people.${portionNote}`,
  });

  return {
    id: "rec-set-1",
    type: "set",
    dishIds: dishes.map((dish) => dish.id),
    title,
    totalPriceCents: total,
    reason,
    healthNote: dishes.some((dish) => dish.caloriesKcal === undefined)
      ? notesFor(dishes[0], request).healthNote
      : phrase(request.language, {
          zh: `餐馆提供合计约 ${dishes.reduce((sum, dish) => sum + (dish.caloriesKcal ?? 0), 0)} kcal。`,
          "zh-Hant": `餐館提供合計約 ${dishes.reduce((sum, dish) => sum + (dish.caloriesKcal ?? 0), 0)} kcal。`,
          fr: `Environ ${dishes.reduce((sum, dish) => sum + (dish.caloriesKcal ?? 0), 0)} kcal au total selon le restaurant.`,
          es: `Aproximadamente ${dishes.reduce((sum, dish) => sum + (dish.caloriesKcal ?? 0), 0)} kcal en total según el restaurante.`,
          en: `About ${dishes.reduce((sum, dish) => sum + (dish.caloriesKcal ?? 0), 0)} kcal total according to the restaurant.`,
        }),
    budgetNote: request.budgetCents
      ? total <= request.budgetCents
        ? phrase(request.language, {
            zh: "组合符合预算。",
            "zh-Hant": "組合符合預算。",
            fr: "Le combo respecte le budget.",
            es: "El combo encaja con el presupuesto.",
            en: "The set fits the budget.",
          })
        : phrase(request.language, {
            zh: "组合略高于预算。",
            "zh-Hant": "組合略高於預算。",
            fr: "Le combo est légèrement au-dessus du budget.",
            es: "El combo está ligeramente por encima del presupuesto.",
            en: "The set is slightly above budget.",
          })
      : undefined,
    allergenWarning: formatAllergens(
      Array.from(new Set(dishes.flatMap((dish) => dish.allergens))),
      request.language,
    ),
    confidence: 0.82,
  };
}

export function recommendFromMenu(menu: RestaurantMenu, request: RecommendationRequest) {
  const filtered = menu.dishes.filter((dish) => passesHardFilters(dish, request));
  const source = filtered.length > 0 ? filtered : menu.dishes.filter((dish) => dish.available);

  const scored = source
    .map((dish) => ({ dish, score: scoreDish(dish, request) }))
    .sort((a, b) => b.score - a.score || (a.dish.priceCents ?? 0) - (b.dish.priceCents ?? 0));

  // Build the set first so we know which dishes it uses
  const set = buildSet(menu, request, scored);
  const setDishIds = new Set(set?.dishIds ?? []);

  // For single-dish recommendations, prefer variety:
  // pick top dishes that are not already in the set (if possible)
  const singles: RecommendationItem[] = [];
  let idx = 0;
  for (const { dish, score } of scored) {
    if (singles.length >= 3) break;
    // Skip dishes already in the set when we have alternatives
    if (setDishIds.has(dish.id) && singles.length < 2 && scored.length > 5) continue;
    singles.push(toItem(dish, request, idx, score));
    idx++;
  }

  // If we couldn't fill 3, fill from top scored regardless
  if (singles.length < 3) {
    for (const { dish, score } of scored) {
      if (singles.length >= 3) break;
      if (singles.some((s) => s.dishIds.includes(dish.id))) continue;
      singles.push(toItem(dish, request, idx, score));
      idx++;
    }
  }

  const recommendations = [...singles];
  if (set) recommendations.splice(1, 0, set);

  return {
    recommendations: recommendations.slice(0, 4),
    fallbackUsed: true,
    safetyNotice: getDictionary(request.language).safety,
    noExactMatch: filtered.length === 0,
  };
}
