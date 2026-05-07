/**
 * Seed script: 创建 PokeMi 餐厅 tenant + 菜单数据
 *
 * Usage: npx tsx scripts/seed-pokemi.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

// ─── PokeMi 菜单数据（从菜单照片 OCR 提取）───────────────

const pokemiMenu = {
  restaurant: {
    id: "pokemi-roanne",
    slug: "pokemi-roanne",
    name: "PokeMi",
    cuisine: "japanese_fusion",
    city: "Roanne",
    currency: "EUR" as const,
    languages: ["fr", "en", "zh"] as const,
    welcome: {
      fr: "Bienvenue chez PokeMi ! Découvrez nos spécialités japonaises et asiatiques.",
      en: "Welcome to PokeMi! Discover our Japanese and Asian specialties.",
      zh: "欢迎来到 PokeMi！品尝我们的日式和亚洲风味美食。",
    },
  },
  dishes: [
    // ── Sushi & Maki ──
    {
      id: "s1-sushi-maki-combo",
      category: "main" as const,
      name: {
        fr: "Sushi (5p) et Maki (8p)",
        en: "Sushi (5pc) & Maki (8pc) Combo",
        zh: "寿司（5个）+ 卷寿司（8个）套餐",
      },
      description: {
        fr: "Assortiment de 5 sushis et 8 makis",
        en: "Assorted 5 pieces of sushi and 8 pieces of maki",
        zh: "5 个寿司和 8 个卷寿司拼盘",
      },
      priceCents: 990,
      currency: "EUR" as const,
      ingredients: ["rice", "fish", "nori", "wasabi"],
      allergens: ["fish" as const, "soy" as const, "sesame" as const, "gluten" as const],
      dietaryTags: ["contains_seafood" as const, "popular" as const],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "s2-sushi-6p",
      category: "main" as const,
      name: {
        fr: "Sushi (6 pièces)",
        en: "Sushi (6pc)",
        zh: "寿司（6个）",
      },
      description: {
        fr: "6 pièces de sushi variés",
        en: "6 pieces of assorted sushi",
        zh: "6 个什锦寿司",
      },
      priceCents: 890,
      currency: "EUR" as const,
      ingredients: ["rice", "fish", "wasabi"],
      allergens: ["fish" as const, "soy" as const],
      dietaryTags: ["contains_seafood" as const],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "s2-sushi-9p",
      category: "main" as const,
      name: {
        fr: "Sushi (9 pièces)",
        en: "Sushi (9pc)",
        zh: "寿司（9个）",
      },
      description: {
        fr: "9 pièces de sushi variés",
        en: "9 pieces of assorted sushi",
        zh: "9 个什锦寿司",
      },
      priceCents: 1250,
      currency: "EUR" as const,
      ingredients: ["rice", "fish", "wasabi"],
      allergens: ["fish" as const, "soy" as const],
      dietaryTags: ["contains_seafood" as const, "good_value" as const],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "s3-maki-16p",
      category: "main" as const,
      name: {
        fr: "Maki (16 pièces)",
        en: "Maki Rolls (16pc)",
        zh: "卷寿司（16个）",
      },
      description: {
        fr: "16 pièces de maki",
        en: "16 pieces of maki rolls",
        zh: "16 个卷寿司",
      },
      priceCents: 690,
      currency: "EUR" as const,
      ingredients: ["rice", "fish", "nori"],
      allergens: ["fish" as const, "soy" as const, "sesame" as const],
      dietaryTags: ["contains_seafood" as const, "good_value" as const],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "s4-california-16p",
      category: "main" as const,
      name: {
        fr: "California (16 pièces)",
        en: "California Rolls (16pc)",
        zh: "加州卷（16个）",
      },
      description: {
        fr: "16 pièces de california rolls",
        en: "16 pieces of California rolls with avocado",
        zh: "16 个加州卷",
      },
      priceCents: 850,
      currency: "EUR" as const,
      ingredients: ["rice", "crab", "avocado", "cucumber", "sesame"],
      allergens: ["crustaceans" as const, "sesame" as const, "soy" as const],
      dietaryTags: ["contains_seafood" as const],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "c5-californix-sushi",
      category: "main" as const,
      name: {
        fr: "Cali-fornix (5p) et Sushi (4p)",
        en: "Cali-fornix (5pc) & Sushi (4pc)",
        zh: "加州风味卷（5个）+ 寿司（4个）",
      },
      description: {
        fr: "Combo 5 california et 4 sushis",
        en: "Combo of 5 california rolls and 4 sushi pieces",
        zh: "5 个加州卷和 4 个寿司组合",
      },
      priceCents: 850,
      currency: "EUR" as const,
      ingredients: ["rice", "fish", "crab", "avocado"],
      allergens: ["fish" as const, "crustaceans" as const, "soy" as const],
      dietaryTags: ["contains_seafood" as const],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "c6-chirashi",
      category: "main" as const,
      name: {
        fr: "Chirashi",
        en: "Chirashi Bowl",
        zh: "散寿司饭",
      },
      description: {
        fr: "Saumon ou avocat sur riz vinaigré",
        en: "Salmon or avocado on vinegared rice",
        zh: "三文鱼或牛油果配醋饭",
      },
      priceCents: 950,
      currency: "EUR" as const,
      ingredients: ["rice", "salmon", "avocado", "rice vinegar"],
      allergens: ["fish" as const, "soy" as const],
      dietaryTags: ["contains_seafood" as const, "healthy" as const],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "c7-bo-bun",
      category: "main" as const,
      name: {
        fr: "Bo Bun",
        en: "Bo Bun (Vietnamese Noodle Salad)",
        zh: "越南米粉沙拉",
      },
      description: {
        fr: "Légumes, vermicelle, nem et poulet ou bœuf",
        en: "Vegetables, vermicelli, spring rolls with chicken or beef",
        zh: "蔬菜、米粉、春卷配鸡肉或牛肉",
      },
      priceCents: 990,
      currency: "EUR" as const,
      ingredients: ["vermicelli", "vegetables", "spring rolls", "chicken", "beef"],
      allergens: ["gluten" as const, "eggs" as const, "soy" as const],
      dietaryTags: ["popular" as const],
      spiceLevel: 1 as const,
      available: true,
    },

    // ── Starters / Sides ──
    {
      id: "r8-nems-crevettes",
      category: "starter" as const,
      name: {
        fr: "Nems aux crevettes (4p)",
        en: "Shrimp Spring Rolls (4pc)",
        zh: "虾肉春卷（4个）",
      },
      description: {
        fr: "4 nems croustillants aux crevettes",
        en: "4 crispy shrimp spring rolls",
        zh: "4 个酥脆虾肉春卷",
      },
      priceCents: 550,
      currency: "EUR" as const,
      ingredients: ["shrimp", "rice paper", "vegetables"],
      allergens: ["crustaceans" as const, "gluten" as const],
      dietaryTags: ["contains_seafood" as const],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "r9-nems-poulet",
      category: "starter" as const,
      name: {
        fr: "Nems au poulet (4p)",
        en: "Chicken Spring Rolls (4pc)",
        zh: "鸡肉春卷（4个）",
      },
      description: {
        fr: "4 nems croustillants au poulet",
        en: "4 crispy chicken spring rolls",
        zh: "4 个酥脆鸡肉春卷",
      },
      priceCents: 550,
      currency: "EUR" as const,
      ingredients: ["chicken", "rice paper", "vegetables"],
      allergens: ["gluten" as const],
      dietaryTags: [],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "b10-beignets-crevettes",
      category: "starter" as const,
      name: {
        fr: "Beignets de crevettes (5p)",
        en: "Shrimp Fritters (5pc)",
        zh: "炸虾球（5个）",
      },
      description: {
        fr: "5 beignets de crevettes dorés",
        en: "5 golden shrimp fritters",
        zh: "5 个金黄炸虾球",
      },
      priceCents: 650,
      currency: "EUR" as const,
      ingredients: ["shrimp", "flour", "oil"],
      allergens: ["crustaceans" as const, "gluten" as const],
      dietaryTags: ["contains_seafood" as const],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "s11-samoussas-boeuf",
      category: "starter" as const,
      name: {
        fr: "Samoussas au bœuf (5p)",
        en: "Beef Samosas (5pc)",
        zh: "牛肉三角饺（5个）",
      },
      description: {
        fr: "5 samoussas croustillants au bœuf",
        en: "5 crispy beef samosas",
        zh: "5 个酥脆牛肉三角饺",
      },
      priceCents: 650,
      currency: "EUR" as const,
      ingredients: ["beef", "pastry", "onion", "spices"],
      allergens: ["gluten" as const],
      dietaryTags: ["contains_beef" as const],
      spiceLevel: 1 as const,
      available: true,
    },
    {
      id: "r12-raviolis-porc",
      category: "starter" as const,
      name: {
        fr: "Raviolis grillés au porc (4p)",
        en: "Pan-fried Pork Dumplings (4pc)",
        zh: "煎猪肉饺子（4个）",
      },
      description: {
        fr: "4 raviolis grillés garnis au porc",
        en: "4 pan-fried pork dumplings",
        zh: "4 个香煎猪肉饺子",
      },
      priceCents: 650,
      currency: "EUR" as const,
      ingredients: ["pork", "flour", "vegetables"],
      allergens: ["gluten" as const, "soy" as const],
      dietaryTags: ["contains_pork" as const],
      spiceLevel: 0 as const,
      available: true,
    },

    // ── Main Dishes (Image 2) ──
    {
      id: "b20-boeuf-oignons",
      category: "main" as const,
      name: {
        fr: "Bœuf aux oignons",
        en: "Beef with Onions",
        zh: "洋葱牛肉",
      },
      description: {
        fr: "Bœuf sauté aux oignons, servi avec riz",
        en: "Stir-fried beef with onions, served with rice",
        zh: "洋葱炒牛肉，配米饭",
      },
      priceCents: 920,
      currency: "EUR" as const,
      ingredients: ["beef", "onion", "soy sauce", "rice"],
      allergens: ["soy" as const],
      dietaryTags: ["contains_beef" as const],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "c21-canard-laque",
      category: "main" as const,
      name: {
        fr: "Canard laqué",
        en: "Peking Duck",
        zh: "烤鸭",
      },
      description: {
        fr: "Canard laqué à la pékinoise",
        en: "Classic Peking-style roasted duck",
        zh: "经典北京烤鸭",
      },
      priceCents: 1250,
      currency: "EUR" as const,
      ingredients: ["duck", "hoisin sauce", "scallion", "pancakes"],
      allergens: ["gluten" as const, "soy" as const],
      dietaryTags: ["signature" as const],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "b22-riz-cantonais",
      category: "main" as const,
      name: {
        fr: "Riz cantonais",
        en: "Cantonese Fried Rice",
        zh: "广式炒饭",
      },
      description: {
        fr: "Riz, petits pois, jambon et œuf",
        en: "Fried rice with peas, ham and egg",
        zh: "豌豆、火腿和鸡蛋炒饭",
      },
      priceCents: 600,
      currency: "EUR" as const,
      ingredients: ["rice", "peas", "ham", "egg"],
      allergens: ["eggs" as const],
      dietaryTags: ["contains_pork" as const, "good_value" as const],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "b23-riz-blanc",
      category: "side" as const,
      name: {
        fr: "Riz blanc",
        en: "Steamed Rice",
        zh: "白米饭",
      },
      description: {
        fr: "Riz blanc nature",
        en: "Plain steamed white rice",
        zh: "白米饭",
      },
      priceCents: 250,
      currency: "EUR" as const,
      ingredients: ["rice"],
      allergens: [],
      dietaryTags: ["vegan" as const, "vegetarian" as const],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "b24-nouilles-boeuf",
      category: "main" as const,
      name: {
        fr: "Nouilles sautées au bœuf (udon)",
        en: "Stir-fried Udon with Beef",
        zh: "牛肉炒乌冬面",
      },
      description: {
        fr: "Nouilles udon sautées au bœuf et légumes",
        en: "Stir-fried udon noodles with beef and vegetables",
        zh: "牛肉蔬菜炒乌冬面",
      },
      priceCents: 750,
      currency: "EUR" as const,
      ingredients: ["udon noodles", "beef", "vegetables", "soy sauce"],
      allergens: ["gluten" as const, "soy" as const],
      dietaryTags: ["contains_beef" as const],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "b25-nouilles-poulet",
      category: "main" as const,
      name: {
        fr: "Nouilles sautées au poulet (udon)",
        en: "Stir-fried Udon with Chicken",
        zh: "鸡肉炒乌冬面",
      },
      description: {
        fr: "Nouilles udon sautées au poulet et légumes",
        en: "Stir-fried udon noodles with chicken and vegetables",
        zh: "鸡肉蔬菜炒乌冬面",
      },
      priceCents: 750,
      currency: "EUR" as const,
      ingredients: ["udon noodles", "chicken", "vegetables", "soy sauce"],
      allergens: ["gluten" as const, "soy" as const],
      dietaryTags: [],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "n26-nouilles-legumes",
      category: "main" as const,
      name: {
        fr: "Nouilles sautées aux légumes (udon)",
        en: "Stir-fried Udon with Vegetables",
        zh: "蔬菜炒乌冬面",
      },
      description: {
        fr: "Nouilles udon sautées aux légumes",
        en: "Stir-fried udon noodles with seasonal vegetables",
        zh: "时蔬炒乌冬面",
      },
      priceCents: 750,
      currency: "EUR" as const,
      ingredients: ["udon noodles", "vegetables", "soy sauce"],
      allergens: ["gluten" as const, "soy" as const],
      dietaryTags: ["vegetarian" as const],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "c27-nouilles-crevettes",
      category: "main" as const,
      name: {
        fr: "Nouilles sautées aux crevettes (udon)",
        en: "Stir-fried Udon with Shrimp",
        zh: "虾仁炒乌冬面",
      },
      description: {
        fr: "Nouilles udon sautées aux crevettes",
        en: "Stir-fried udon noodles with shrimp",
        zh: "虾仁炒乌冬面",
      },
      priceCents: 750,
      currency: "EUR" as const,
      ingredients: ["udon noodles", "shrimp", "vegetables", "soy sauce"],
      allergens: ["crustaceans" as const, "gluten" as const, "soy" as const],
      dietaryTags: ["contains_seafood" as const],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "b28-rice-burger",
      category: "main" as const,
      name: {
        fr: "Rice Burger",
        en: "Rice Burger",
        zh: "米汉堡",
      },
      description: {
        fr: "Pain brioche maison, œuf, salade et garnitures",
        en: "Homemade brioche bun, egg, salad and toppings",
        zh: "手工面包、鸡蛋、沙拉及配料",
      },
      priceCents: 950,
      currency: "EUR" as const,
      ingredients: ["brioche bun", "egg", "salad", "sauce"],
      allergens: ["gluten" as const, "eggs" as const, "milk" as const],
      dietaryTags: ["comfort_food" as const],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "b29-ramen",
      category: "main" as const,
      name: {
        fr: "Ramen",
        en: "Ramen",
        zh: "拉面",
      },
      description: {
        fr: "Bouillon, nouilles, légumes, porc haché, œuf mariné et feuilles de nori",
        en: "Broth, noodles, vegetables, minced pork, marinated egg and nori",
        zh: "浓汤、面条、蔬菜、猪肉末、溏心蛋、海苔",
      },
      priceCents: 950,
      currency: "EUR" as const,
      ingredients: ["noodles", "pork", "egg", "nori", "vegetables", "broth"],
      allergens: ["gluten" as const, "eggs" as const, "soy" as const],
      dietaryTags: ["contains_pork" as const, "signature" as const, "popular" as const],
      spiceLevel: 1 as const,
      available: true,
    },
    {
      id: "b30-poke-bowl",
      category: "main" as const,
      name: {
        fr: "Poke Bowl",
        en: "Poke Bowl",
        zh: "夏威夷鱼生饭",
      },
      description: {
        fr: "Riz, saumon/thon, avocat, concombre, mangue et sauces",
        en: "Rice, salmon/tuna, avocado, cucumber, mango and sauces",
        zh: "米饭、三文鱼/金枪鱼、牛油果、黄瓜、芒果及酱汁",
      },
      priceCents: 1200,
      currency: "EUR" as const,
      ingredients: ["rice", "salmon", "tuna", "avocado", "cucumber", "mango"],
      allergens: ["fish" as const, "soy" as const, "sesame" as const],
      dietaryTags: ["contains_seafood" as const, "healthy" as const, "signature" as const],
      spiceLevel: 0 as const,
      available: true,
    },
    {
      id: "b31-bap-bibimbap",
      category: "main" as const,
      name: {
        fr: "BAP (Bibimbap)",
        en: "Bibimbap",
        zh: "石锅拌饭",
      },
      description: {
        fr: "Riz blanc, légumes, œuf mariné, sauce pimentée, champignons parfumés et poulet",
        en: "White rice, vegetables, marinated egg, spicy sauce, mushrooms and chicken",
        zh: "白米饭、蔬菜、腌蛋、辣酱、香菇和鸡肉",
      },
      priceCents: 1200,
      currency: "EUR" as const,
      ingredients: ["rice", "vegetables", "egg", "chicken", "mushrooms", "gochujang"],
      allergens: ["eggs" as const, "soy" as const, "sesame" as const],
      dietaryTags: ["spicy" as const, "popular" as const],
      spiceLevel: 2 as const,
      available: true,
    },
  ],
  updatedAt: new Date().toISOString(),
};

async function seed() {
  console.log("🌱 Seeding PokeMi...");

  // 1. Create tenant
  const [tenant] = await sql`
    INSERT INTO tenants (slug, name, cuisine_type, address, owner_id, plan)
    VALUES (
      'pokemi-roanne',
      'PokeMi',
      'japanese_fusion',
      '12 Rue Alexandre Roche, 42300 Roanne',
      'founder-placeholder',
      'free'
    )
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      cuisine_type = EXCLUDED.cuisine_type,
      address = EXCLUDED.address,
      updated_at = NOW()
    RETURNING id, slug
  `;
  console.log(`✅ Tenant created: ${tenant.slug} (${tenant.id})`);

  // 2. Create menu version
  const [menu] = await sql`
    INSERT INTO menus (tenant_id, payload, version, published_at)
    VALUES (
      ${tenant.id},
      ${JSON.stringify(pokemiMenu)},
      1,
      NOW()
    )
    RETURNING id, version
  `;
  console.log(`✅ Menu v${menu.version} published (${pokemiMenu.dishes.length} dishes)`);

  console.log(`\n🎉 Done! Visit: /r/pokemi-roanne`);
  await sql.end();
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
