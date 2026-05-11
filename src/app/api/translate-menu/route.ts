import { NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/db/queries/tenants";
import { getPublishedMenu, patchMenuTranslations } from "@/lib/db/queries/menus";
import type { RestaurantMenu, Dish } from "@/types/menu";
import type { LanguageCode } from "@/lib/languages";
import { isSupportedLanguage, supportedLanguages } from "@/lib/languages";
import { builtinCategories } from "@/lib/validation";

/**
 * POST /api/translate-menu
 * On-demand translation: translates all dish names/descriptions into a target language
 * using Gemini Flash, then persists the translations back to the menu JSON.
 *
 * Body: { slug: string, targetLang: LanguageCode }
 * Returns: { ok: true, count: number } on success
 */
export async function POST(request: Request) {
  try {
    const { slug, targetLang } = await request.json();

    if (!slug || !targetLang || !isSupportedLanguage(targetLang)) {
      return NextResponse.json({ error: "Invalid slug or targetLang" }, { status: 400 });
    }

    // Core languages are always present — no need to translate
    if (["zh", "fr", "en"].includes(targetLang)) {
      return NextResponse.json({ ok: true, count: 0 });
    }

    const tenant = await getTenantBySlug(slug);
    if (!tenant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const menu = await getPublishedMenu(tenant.id);
    const menuData = menu?.payload as RestaurantMenu | null;
    if (!menuData || menuData.dishes.length === 0) {
      return NextResponse.json({ error: "No menu" }, { status: 404 });
    }

    // Check if translations already exist for this language
    const needsTranslation = menuData.dishes.some(
      (d) => !d.name[targetLang] || !d.description[targetLang],
    );
    if (!needsTranslation) {
      return NextResponse.json({ ok: true, count: 0 });
    }

    // Build the translation payload — only dishes missing translations
    const toTranslate = menuData.dishes
      .filter((d) => !d.name[targetLang] || !d.description[targetLang])
      .map((d) => ({
        id: d.id,
        name_en: d.name.en,
        name_fr: d.name.fr,
        desc_en: d.description.en,
        desc_fr: d.description.fr,
      }));

    const langLabel = supportedLanguages.find((l) => l.code === targetLang)?.label ?? targetLang;

    // Use Gemini Flash for translation (fast + cheap)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Translation service unavailable" }, { status: 503 });
    }

    const model = process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Split into chunks of CHUNK_SIZE and translate in parallel
    const CHUNK_SIZE = 20;
    const chunks: typeof toTranslate[] = [];
    for (let i = 0; i < toTranslate.length; i += CHUNK_SIZE) {
      chunks.push(toTranslate.slice(i, i + CHUNK_SIZE));
    }

    const translateChunk = async (chunk: typeof toTranslate) => {
      const prompt = `Translate these restaurant menu items into ${langLabel} (${targetLang}).
For each dish, translate the name and description naturally for a restaurant menu — keep it appetizing, not literal.
If a dish name is a proper noun or widely known term (e.g. "Tiramisu", "Pad Thai"), keep it as-is or transliterate appropriately.

Input dishes (JSON array):
${JSON.stringify(chunk)}

Return a JSON array with exactly this structure — same order, same IDs:
[{ "id": "...", "name": "translated name", "description": "translated description" }]`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: "You are a professional restaurant menu translator. Translate naturally and appetizingly." }],
          },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 16000,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        console.error("[translate-menu] Gemini failed for chunk:", response.status);
        return [];
      }

      const geminiData = await response.json();
      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return [];

      try {
        return JSON.parse(text) as Array<{ id: string; name: string; description: string }>;
      } catch {
        console.error("[translate-menu] Failed to parse chunk response");
        return [];
      }
    };

    const results = await Promise.all(chunks.map(translateChunk));
    const translations = results.flat();

    // Apply translations to menu data
    const translationMap = new Map(translations.map((t) => [t.id, t]));
    for (const dish of menuData.dishes) {
      const tr = translationMap.get(dish.id);
      if (tr) {
        (dish.name as Record<string, string>)[targetLang] = tr.name;
        (dish.description as Record<string, string>)[targetLang] = tr.description;
      }
    }

    // Translate custom category names (non-builtin categories used in dishes)
    const builtinSet = new Set<string>(builtinCategories);
    const customCats = [...new Set(menuData.dishes.map((d) => d.category))].filter(
      (c) => !builtinSet.has(c),
    );
    const existingLabels = menuData.categoryLabels ?? {};
    const catsNeedingTranslation = customCats.filter(
      (c) => !existingLabels[c]?.[targetLang],
    );

    if (catsNeedingTranslation.length > 0) {
      const catPrompt = `Translate these restaurant menu category names into ${langLabel} (${targetLang}).
These are section headers on a restaurant menu. Translate naturally and concisely.

Categories: ${JSON.stringify(catsNeedingTranslation)}

Return a JSON object mapping each category to its translation:
{ "beef": "translated", "lamb": "translated", ... }`;

      try {
        const catRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: "You are a professional restaurant menu translator." }],
            },
            contents: [{ parts: [{ text: catPrompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2000,
              responseMimeType: "application/json",
            },
          }),
        });
        if (catRes.ok) {
          const catData = await catRes.json();
          const catText = catData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (catText) {
            const catTranslations = JSON.parse(catText) as Record<string, string>;
            for (const [cat, label] of Object.entries(catTranslations)) {
              if (!existingLabels[cat]) existingLabels[cat] = {};
              existingLabels[cat][targetLang] = label;
            }
            menuData.categoryLabels = existingLabels;
          }
        }
      } catch (e) {
        console.error("[translate-menu] category translation failed:", e);
        // Non-fatal — dish translations still saved
      }
    }

    // Persist back to DB
    await patchMenuTranslations(tenant.id, menuData);

    return NextResponse.json({ ok: true, count: translations.length });
  } catch (error) {
    console.error("[translate-menu] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
