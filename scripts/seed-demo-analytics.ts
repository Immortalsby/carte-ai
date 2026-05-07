/**
 * Seed script: 为 PokeMi + 一个 demo 门店生成 30 天的假 analytics 数据
 * 让 Founder Dashboard 和门店 Dashboard 图表好看
 *
 * Usage: npx tsx scripts/seed-demo-analytics.ts
 *
 * 生成内容：
 * - 1 个假门店 "Le Petit Dragon" (中餐)
 * - 30 天 analytics_events (scan, recommend_view, adoption, dwell, share, culture_match, mode_switch)
 * - recommendations_log 记录
 * - llm_usage 月度汇总
 *
 * 安全：幂等可重跑，先清理旧 demo 数据再插入
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

const DEMO_SLUG = "le-petit-dragon-demo";
const DEMO_OWNER_ID = "demo-owner-000"; // 假 owner，不关联真实用户

const languages = ["zh", "fr", "en", "es", "ar", "zh-Hant"];
const langWeights = [0.30, 0.25, 0.20, 0.10, 0.08, 0.07]; // 权重
const modes = ["first_time", "cheap", "healthy", "signature", "sharing", "not_sure"];
const modeWeights = [0.20, 0.15, 0.15, 0.15, 0.10, 0.25];
const providers = ["openai", "anthropic"];

function weightedRandom<T>(items: T[], weights: number[]): T {
  const r = Math.random();
  let sum = 0;
  for (let i = 0; i < items.length; i++) {
    sum += weights[i];
    if (r <= sum) return items[i];
  }
  return items[items.length - 1];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(day: Date, hourMin: number, hourMax: number): Date {
  const d = new Date(day);
  d.setHours(randomInt(hourMin, hourMax), randomInt(0, 59), randomInt(0, 59), randomInt(0, 999));
  return d;
}

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// Demo 菜单
const demoMenu = {
  restaurant: {
    id: DEMO_SLUG,
    slug: DEMO_SLUG,
    name: "Le Petit Dragon",
    cuisine: "chinese",
    city: "Lyon",
    currency: "EUR" as const,
    languages: ["fr", "en", "zh"] as const,
    welcome: {
      fr: "Bienvenue au Petit Dragon ! Savourez nos spécialités chinoises authentiques.",
      en: "Welcome to Le Petit Dragon! Enjoy our authentic Chinese specialties.",
      zh: "欢迎来到小龙餐厅！品尝正宗中国美食。",
    },
  },
  dishes: [
    { id: "d1", category: "starter", name: { fr: "Raviolis vapeur", en: "Steamed dumplings", zh: "蒸饺" }, description: { fr: "Raviolis vapeur au porc", en: "Pork steamed dumplings", zh: "猪肉蒸饺" }, priceCents: 680, currency: "EUR", ingredients: ["pork", "flour", "ginger"], allergens: ["gluten"], dietaryTags: ["contains_pork", "popular"], spiceLevel: 0, available: true },
    { id: "d2", category: "starter", name: { fr: "Nems poulet", en: "Chicken spring rolls", zh: "鸡肉春卷" }, description: { fr: "4 nems croustillants", en: "4 crispy spring rolls", zh: "4个酥脆春卷" }, priceCents: 550, currency: "EUR", ingredients: ["chicken", "vegetables"], allergens: ["gluten"], dietaryTags: [], spiceLevel: 0, available: true },
    { id: "d3", category: "main", name: { fr: "Canard laqué", en: "Peking duck", zh: "北京烤鸭" }, description: { fr: "Canard laqué traditionnel", en: "Traditional Peking duck", zh: "传统北京烤鸭" }, priceCents: 1580, currency: "EUR", ingredients: ["duck"], allergens: ["gluten", "soy"], dietaryTags: ["signature", "popular"], spiceLevel: 0, available: true },
    { id: "d4", category: "main", name: { fr: "Poulet Kung Pao", en: "Kung Pao chicken", zh: "宫保鸡丁" }, description: { fr: "Poulet sauté aux cacahuètes", en: "Stir-fried chicken with peanuts", zh: "花生炒鸡丁" }, priceCents: 1280, currency: "EUR", ingredients: ["chicken", "peanuts"], allergens: ["peanuts", "soy"], dietaryTags: ["spicy", "popular"], spiceLevel: 2, available: true },
    { id: "d5", category: "main", name: { fr: "Mapo Tofu", en: "Mapo tofu", zh: "麻婆豆腐" }, description: { fr: "Tofu épicé du Sichuan", en: "Sichuan-style spicy tofu", zh: "四川麻婆豆腐" }, priceCents: 980, currency: "EUR", ingredients: ["tofu", "pork"], allergens: ["soy"], dietaryTags: ["spicy", "contains_pork"], spiceLevel: 3, available: true },
    { id: "d6", category: "main", name: { fr: "Boeuf aux oignons", en: "Beef with onions", zh: "洋葱牛肉" }, description: { fr: "Boeuf sauté aux oignons", en: "Stir-fried beef", zh: "洋葱炒牛肉" }, priceCents: 1180, currency: "EUR", ingredients: ["beef", "onions"], allergens: ["soy"], dietaryTags: ["contains_beef"], spiceLevel: 0, available: true },
    { id: "d7", category: "main", name: { fr: "Riz cantonais", en: "Cantonese fried rice", zh: "广式炒饭" }, description: { fr: "Riz sauté classique", en: "Classic fried rice", zh: "经典炒饭" }, priceCents: 780, currency: "EUR", ingredients: ["rice", "egg", "ham"], allergens: ["eggs"], dietaryTags: ["good_value", "popular"], spiceLevel: 0, available: true },
    { id: "d8", category: "main", name: { fr: "Nouilles sautées", en: "Stir-fried noodles", zh: "炒面" }, description: { fr: "Nouilles sautées aux légumes", en: "Vegetable stir-fried noodles", zh: "蔬菜炒面" }, priceCents: 880, currency: "EUR", ingredients: ["noodles", "vegetables"], allergens: ["gluten", "soy"], dietaryTags: ["vegetarian"], spiceLevel: 0, available: true },
    { id: "d9", category: "side", name: { fr: "Riz blanc", en: "White rice", zh: "白米饭" }, description: { fr: "Riz nature", en: "Plain rice", zh: "白米饭" }, priceCents: 250, currency: "EUR", ingredients: ["rice"], allergens: [], dietaryTags: ["vegan"], spiceLevel: 0, available: true },
    { id: "d10", category: "drink", name: { fr: "Thé au jasmin", en: "Jasmine tea", zh: "茉莉花茶" }, description: { fr: "Thé parfumé", en: "Fragrant tea", zh: "香气四溢的茉莉花茶" }, priceCents: 350, currency: "EUR", ingredients: ["tea"], allergens: [], dietaryTags: [], spiceLevel: 0, available: true },
    { id: "d11", category: "drink", name: { fr: "Bière Tsingtao", en: "Tsingtao beer", zh: "青岛啤酒" }, description: { fr: "Bière chinoise", en: "Chinese beer", zh: "中国啤酒" }, priceCents: 450, currency: "EUR", ingredients: [], allergens: ["alcohol"], dietaryTags: [], spiceLevel: 0, available: true },
    { id: "d12", category: "dessert", name: { fr: "Perles de coco", en: "Coconut balls", zh: "椰丝球" }, description: { fr: "Boules de coco sucrées", en: "Sweet coconut balls", zh: "甜椰丝球" }, priceCents: 480, currency: "EUR", ingredients: ["coconut", "rice flour"], allergens: [], dietaryTags: [], spiceLevel: 0, available: true },
  ],
  updatedAt: new Date().toISOString(),
};

async function main() {
  console.log("🐉 Seeding demo data...\n");

  // 1. Create demo tenant
  const [tenant] = await sql`
    INSERT INTO tenants (slug, name, cuisine_type, owner_id, plan, address, settings)
    VALUES (
      ${DEMO_SLUG}, 'Le Petit Dragon', 'chinese', ${DEMO_OWNER_ID}, 'pro',
      '42 Rue de la République, 69002 Lyon',
      ${{ llm_provider: "openai", llm_model: "gpt-4.1-mini", llm_quota_calls: 10000 }}::jsonb
    )
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      settings = EXCLUDED.settings,
      updated_at = now()
    RETURNING id
  `;
  const tenantId = tenant.id;
  console.log(`✅ Tenant: ${DEMO_SLUG} (${tenantId})`);

  // 2. Create menu
  await sql`
    INSERT INTO menus (tenant_id, payload, version, published_at)
    VALUES (${tenantId}, ${JSON.stringify(demoMenu)}::jsonb, 1, now())
    ON CONFLICT DO NOTHING
  `;
  console.log("✅ Menu created");

  // 3. Clear old demo analytics
  await sql`DELETE FROM analytics_events WHERE tenant_id = ${tenantId}`;
  await sql`DELETE FROM recommendations_log WHERE tenant_id = ${tenantId}`;
  await sql`DELETE FROM llm_usage WHERE tenant_id = ${tenantId}`;
  console.log("🧹 Cleared old demo events");

  // 4. Also seed events for PokeMi
  const [pokemi] = await sql`SELECT id FROM tenants WHERE slug = 'pokemi-roanne'`;
  const pokemiId = pokemi?.id;
  if (pokemiId) {
    await sql`DELETE FROM analytics_events WHERE tenant_id = ${pokemiId}`;
    await sql`DELETE FROM recommendations_log WHERE tenant_id = ${pokemiId}`;
    console.log("🧹 Cleared old PokeMi events");
  }

  // 5. Generate 30 days of events for both tenants
  const now = new Date();
  const events: Array<Record<string, unknown>> = [];
  const recLogs: Array<Record<string, unknown>> = [];

  for (const tid of [tenantId, pokemiId].filter(Boolean)) {
    const isDragon = tid === tenantId;
    // Dragon is busier (big city Lyon), PokeMi is smaller (Roanne)
    const baseScansPerDay = isDragon ? 45 : 25;

    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      const day = new Date(now);
      day.setDate(day.getDate() - dayOffset);
      day.setHours(0, 0, 0, 0);

      // Weekend boost
      const dow = day.getDay();
      const isWeekend = dow === 0 || dow === 5 || dow === 6;
      const dailyMultiplier = isWeekend ? 1.4 : 1.0;
      // Growth trend: more recent = slightly more traffic
      const trendMultiplier = 0.7 + (0.3 * (30 - dayOffset) / 30);

      const scansToday = Math.round(baseScansPerDay * dailyMultiplier * trendMultiplier * (0.85 + Math.random() * 0.3));

      for (let s = 0; s < scansToday; s++) {
        const sessionId = uuid();
        const lang = weightedRandom(languages, langWeights);
        // Lunch (11-14) or dinner (18-22) bias
        const isLunch = Math.random() < 0.4;
        const ts = randomDate(day, isLunch ? 11 : 18, isLunch ? 14 : 22);

        // scan event
        events.push({
          tenant_id: tid,
          event_type: "scan",
          payload: {},
          session_id: sessionId,
          language: lang,
          created_at: ts,
        });

        // dwell event (70% of scans)
        if (Math.random() < 0.7) {
          const seconds = randomInt(5, 300);
          events.push({
            tenant_id: tid,
            event_type: "dwell",
            payload: { seconds },
            session_id: sessionId,
            language: lang,
            created_at: new Date(ts.getTime() + seconds * 1000),
          });
        }

        // culture_match (15% — user's detected language matches restaurant setting)
        if (Math.random() < 0.15) {
          events.push({
            tenant_id: tid,
            event_type: "culture_match",
            payload: { detected: lang },
            session_id: sessionId,
            language: lang,
            created_at: new Date(ts.getTime() + 2000),
          });
        }

        // recommend_view (40% of scans)
        if (Math.random() < 0.40) {
          const mode = weightedRandom(modes, modeWeights);
          const recTs = new Date(ts.getTime() + randomInt(10, 60) * 1000);

          events.push({
            tenant_id: tid,
            event_type: "recommend_view",
            payload: { mode, count: randomInt(1, 4) },
            session_id: sessionId,
            language: lang,
            created_at: recTs,
          });

          // recommendations_log
          recLogs.push({
            tenant_id: tid,
            request: { language: lang, mode, partySize: randomInt(1, 3) },
            response: { recommendations: [{ id: "rec-1", dishIds: ["d1"] }], fallbackUsed: false },
            provider: weightedRandom(providers, [0.6, 0.4]),
            latency_ms: randomInt(400, 2500),
            allergens_filtered: Math.random() < 0.2 ? ["gluten"] : null,
            created_at: recTs,
          });

          // adoption (55% of recommendations)
          if (Math.random() < 0.55) {
            const adopted = Math.random() < 0.7; // 70% positive adoption
            events.push({
              tenant_id: tid,
              event_type: "adoption",
              payload: { adopted: adopted.toString(), dishId: `d${randomInt(1, 8)}` },
              session_id: sessionId,
              language: lang,
              created_at: new Date(recTs.getTime() + randomInt(5, 30) * 1000),
            });
          }

          // mode_switch (10% of recommendations)
          if (Math.random() < 0.10) {
            events.push({
              tenant_id: tid,
              event_type: "mode_switch",
              payload: { from: mode, to: weightedRandom(modes, modeWeights) },
              session_id: sessionId,
              language: lang,
              created_at: new Date(recTs.getTime() + 3000),
            });
          }
        }

        // share (5% of scans)
        if (Math.random() < 0.05) {
          events.push({
            tenant_id: tid,
            event_type: "share",
            payload: { method: weightedRandom(["link", "qr", "social"], [0.5, 0.3, 0.2]) },
            session_id: sessionId,
            language: lang,
            created_at: new Date(ts.getTime() + randomInt(30, 120) * 1000),
          });
        }
      }
    }
  }

  // 6. Batch insert events (500 per batch)
  console.log(`\n📊 Inserting ${events.length} analytics events...`);
  for (let i = 0; i < events.length; i += 500) {
    const batch = events.slice(i, i + 500);
    await sql`
      INSERT INTO analytics_events ${sql(batch, "tenant_id", "event_type", "payload", "session_id", "language", "created_at")}
    `;
    process.stdout.write(`  ${Math.min(i + 500, events.length)}/${events.length}\r`);
  }
  console.log(`\n✅ Analytics events inserted`);

  // 7. Batch insert recommendation logs
  console.log(`📝 Inserting ${recLogs.length} recommendation logs...`);
  for (let i = 0; i < recLogs.length; i += 500) {
    const batch = recLogs.slice(i, i + 500);
    await sql`
      INSERT INTO recommendations_log ${sql(batch, "tenant_id", "request", "response", "provider", "latency_ms", "allergens_filtered", "created_at")}
    `;
  }
  console.log("✅ Recommendation logs inserted");

  // 8. LLM usage summary
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  for (const tid of [tenantId, pokemiId].filter(Boolean)) {
    const isDragon = tid === tenantId;
    const calls = isDragon ? randomInt(1200, 1800) : randomInt(600, 900);
    const tokens = calls * randomInt(800, 1500);
    const cost = Math.round(calls * 2.2);
    await sql`
      INSERT INTO llm_usage (tenant_id, month, call_count, token_count, cost_cents)
      VALUES (${tid}, ${month}, ${calls}, ${tokens}, ${cost})
      ON CONFLICT (tenant_id, month) DO UPDATE SET
        call_count = EXCLUDED.call_count,
        token_count = EXCLUDED.token_count,
        cost_cents = EXCLUDED.cost_cents,
        updated_at = now()
    `;
  }
  console.log("✅ LLM usage inserted");

  // Summary
  const totalScans = events.filter(e => e.event_type === "scan").length;
  const totalRecs = events.filter(e => e.event_type === "recommend_view").length;
  const totalAdoptions = events.filter(e => e.event_type === "adoption").length;
  console.log(`\n📈 Summary:`);
  console.log(`   Scans: ${totalScans}`);
  console.log(`   Recommendations: ${totalRecs}`);
  console.log(`   Adoptions: ${totalAdoptions}`);
  console.log(`   Rec logs: ${recLogs.length}`);
  console.log(`   Events total: ${events.length}`);

  await sql.end();
  console.log("\n🎉 Done!");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
