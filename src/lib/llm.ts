import OpenAI from "openai";
import type { RestaurantMenu } from "@/types/menu";
import { supportedLanguageCodes } from "./languages";

type CandidateDish = {
  id: string;
  category: string;
  name: string;
  description: string;
  priceCents: number;
  ingredients: string[];
  allergens: string[];
  dietaryTags: string[];
  caloriesKcal: number | null;
  spiceLevel: number;
  portionScore: 1 | 2 | 3;
};

type LlmRecommendationInput = {
  request: unknown;
  candidates: CandidateDish[];
  localRecommendations?: unknown[];
};

type LlmRecommendationResult = {
  recommendations: Array<Record<string, unknown>>;
  safetyNotice: string;
};

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: string;
        data: string;
      };
    }
  | {
      type: "document";
      source: {
        type: "base64";
        media_type: string;
        data: string;
      };
    };

/**
 * 6 LLM Safety Guardrails (PRD FR31)
 *
 * These are hard constraints enforced in the system prompt and validated
 * at multiple layers (local rules pre-filter + LLM prompt + output validation):
 *
 * 1. NEVER invent dishes — only recommend from the provided candidate list
 * 2. NEVER invent or modify prices — use exact priceCents from menu data
 * 3. NEVER invent or guess allergens — use only declared allergen data
 * 4. NEVER invent calorie/nutrition data — use only declared caloriesKcal
 * 5. ALLERGEN DATA INCOMPLETE → must warn "please confirm with staff"
 * 6. OUTPUT FORMAT — must return valid JSON only, no free-text wrapping
 *
 * Additional enforcement layers:
 * - Local rules (recommender.ts) pre-filter candidates via passesHardFilters()
 * - LLM only sees pre-filtered candidates, cannot access full menu
 * - Output is parsed with JSON.parse(); malformed responses trigger fallback
 * - Fallback to local rules on any LLM error (recommend route.ts)
 * - Allergen disclaimer is rendered unconditionally in UI (NFR11)
 */
const systemPrompt = `You are CarteAI — a warm, knowledgeable friend who happens to know this restaurant's menu inside out. A diner has just asked you for help choosing what to eat. You'll receive their preferences and the full list of available dishes.

## HARD RULES (never violate)
- ONLY recommend dishes from the provided candidates. Never invent dishes or prices.
- Use ONLY declared allergen/calorie data. If unknown, warn: "Please confirm with staff."
- Output valid JSON only. No markdown, no prose wrapping.

## HOW TO READ THE REQUEST
- **mode** meanings: "first_time" = first visit, recommend popular/signature dishes; "cheap" = budget-conscious; "healthy" = light/nutritious; "signature" = restaurant's best/premium; "sharing" = dishes good for sharing; "not_sure" = no strong preference, give a balanced selection.
- **occasion**: "drinks" = casual drinks + snacks; "meal" = normal dining; "feast" = generous group spread.
- **userText** is the diner's own words — their STRONGEST signal. If it conflicts with mode, follow userText but acknowledge the mode (e.g. recommend the fried chicken they asked for, plus a healthy alternative).
- If userText mentions avoiding something ("不要猪肉", "no pork"), check dish names, descriptions, ingredients AND dietaryTags (e.g. contains_pork) to exclude matches.

## BUDGET
- budgetCents = diner's TOTAL meal budget. Your recommendations are separate OPTIONS to pick from, not items to order together.
- ≥2 options must fit the budget. You may include 1 option up to 300 cents over IF it's a much better fit — explain the trade-off warmly in budgetNote.
- For set recommendations with partySize ≥ 2, the set total should fit budget × partySize.

## PORTIONS & QUANTITY
Each candidate dish has a **portionScore**: 1 = small/light (tapas, starter, small side, amuse-bouche, drink, dessert), 2 = standard individual portion (a normal main, a bowl of soup/pasta, a large salad), 3 = large/shareable (family platter, sharing plate, combo, XL portion).
- **partySize = 1**: A complete meal needs total portionScore ≥ 3 (e.g. 1 starter(1) + 1 main(2), or 1 generous main(3)). Don't recommend only small dishes — the diner should be able to eat a full meal.
- **partySize ≥ 2 (set)**: Total portionScore of the set should be ≥ partySize × 2. If you picked many small dishes (portionScore 1), add more items so the group won't be hungry. For "feast" occasion, aim for partySize × 3.
- When portionScore is missing, assume 2 for mains/pasta/soup/brunch, 1 for starters/sides/desserts/drinks, 3 for sharing/combo.
- If a set is light on food, mention it honestly: "you might want to add a side" — don't pretend it's enough.

## WHAT TO RETURN
- **partySize = 1**: Return exactly 3 recommendations, each a different style of dish (e.g. sushi, noodles, rice — not 3 sushi variants).
- **partySize ≥ 2**: Return 1 "set" (a complete meal: starters + mains + sides + drinks) PLUS 1–2 single-dish alternatives. For feast/sharing, be generous in the set.
- Each "single_dish" has exactly 1 dishId. Only "set" type may have multiple dishIds.

## TONE
- Write in the diner's language (request.language).
- Be warm and brief: 1–2 sentence reasons, like a friend talking, not a spec sheet.
- safetyNotice: only mention allergens present in YOUR recommendations, not generic menu-wide warnings.

## JSON SCHEMA
\`\`\`
{
  "recommendations": [
    {
      "type": "single_dish | set",       // single_dish = one dish; set = multi-dish meal
      "dishIds": ["id"],                  // exactly 1 for single_dish, multiple for set
      "title": "dish name or set title",  // in diner's language
      "totalPriceCents": 990,             // sum of all dishIds' prices
      "reason": "why this fits",          // 1-2 sentences, warm tone
      "healthNote": "optional note",      // calorie/health context if relevant, "" if nothing useful
      "budgetNote": "optional note",      // budget context if budgetCents was set, "" otherwise
      "allergenWarning": "contains X, Y"  // list actual allergens, "" if none
    }
  ],
  "safetyNotice": "brief allergen reminder relevant to these specific dishes"
}
\`\`\``;

const jsonInstruction = "Return ONLY the JSON object described in the schema. No markdown fences, no explanation.";

function stripJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? trimmed;
}

function getAnthropicModel() {
  if (process.env.ANTHROPIC_MODEL === "OPUS") {
    return process.env.ANTHROPIC_DEFAULT_OPUS_MODEL || "claude-opus-4-6";
  }

  return process.env.ANTHROPIC_MODEL || process.env.ANTHROPIC_DEFAULT_OPUS_MODEL;
}

function getAnthropicUrl() {
  const base = process.env.ANTHROPIC_FOUNDRY_BASE_URL?.replace(/\/$/, "");
  return base ? `${base}/v1/messages` : undefined;
}

export function hasCloudLlm() {
  return Boolean(
    (process.env.ANTHROPIC_FOUNDRY_API_KEY && getAnthropicUrl() && getAnthropicModel()) ||
      process.env.OPENAI_API_KEY,
  );
}

async function recommendWithAnthropic(input: LlmRecommendationInput, modelOverride?: string) {
  const apiKey = process.env.ANTHROPIC_FOUNDRY_API_KEY;
  const url = getAnthropicUrl();
  const model = modelOverride || getAnthropicModel();

  if (!apiKey || !url || !model) return null;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `${jsonInstruction}\n\n${JSON.stringify(input)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic Foundry failed with ${response.status}`);
  }

  const payload = await response.json();
  const text =
    payload?.content
      ?.map((part: { type?: string; text?: string }) =>
        part.type === "text" ? part.text : "",
      )
      .join("") ?? "";
  return JSON.parse(stripJson(text)) as LlmRecommendationResult;
}

async function createAnthropicMessage(content: string | AnthropicContentBlock[]) {
  const apiKey = process.env.ANTHROPIC_FOUNDRY_API_KEY;
  const url = getAnthropicUrl();
  const model = getAnthropicModel();

  if (!apiKey || !url || !model) return null;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 16000,
      temperature: 0,
      system:
        "You are CarteAI's menu ingestion engine. Extract ALL dishes from the restaurant menu into strict JSON. Never skip dishes — include every single item. Never invent allergens, calories, ingredients, prices, or dish names. If a field is missing, use safe placeholders and mark allergens as unknown when needed.",
      messages: [{ role: "user", content }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic Foundry failed with ${response.status}`);
  }

  const payload = await response.json();
  return (
    payload?.content
      ?.map((part: { type?: string; text?: string }) =>
        part.type === "text" ? part.text : "",
      )
      .join("") ?? ""
  );
}

export function hasGeminiVision() {
  return Boolean(process.env.GEMINI_API_KEY);
}

async function createGeminiMessage(
  systemInstruction: string,
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>,
) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 32000,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => "");
    throw new Error(`Gemini API failed with ${response.status}: ${err}`);
  }

  const payload = await response.json();
  return (
    payload?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? ""
  );
}

async function recommendWithOpenAI(input: LlmRecommendationInput, modelOverride?: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model: modelOverride || process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: `${systemPrompt} ${jsonInstruction}`,
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
  });

  return JSON.parse(stripJson(response.output_text)) as LlmRecommendationResult;
}

export async function recommendWithLlm(
  input: LlmRecommendationInput,
  options?: { provider?: string; model?: string },
) {
  const pref = options?.provider ?? "auto";

  if (pref === "openai") {
    const openai = await recommendWithOpenAI(input, options?.model);
    if (openai) return { provider: "openai", result: openai };
    return null;
  }

  if (pref === "anthropic") {
    const anthropic = await recommendWithAnthropic(input, options?.model);
    if (anthropic) return { provider: "anthropic", result: anthropic };
    return null;
  }

  // "auto" — try Anthropic first, then OpenAI
  const anthropic = await recommendWithAnthropic(input, options?.model);
  if (anthropic) return { provider: "anthropic", result: anthropic };

  const openai = await recommendWithOpenAI(input, options?.model);
  if (openai) return { provider: "openai", result: openai };

  return null;
}

/**
 * Test LLM connection with a simple prompt.
 * Used by the admin settings to verify provider/model configuration.
 */
export async function testLlmConnection(
  provider: "anthropic" | "openai" | "gemini",
  modelOverride?: string,
): Promise<{ success: boolean; model?: string; response?: string; error?: string }> {
  try {
    if (provider === "anthropic") {
      const apiKey = process.env.ANTHROPIC_FOUNDRY_API_KEY;
      const url = getAnthropicUrl();
      const model = modelOverride || getAnthropicModel();
      if (!apiKey || !url || !model) {
        return { success: false, error: "Anthropic Foundry not configured (missing API key, URL, or model)" };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 50,
          temperature: 0,
          messages: [{ role: "user", content: "Reply with exactly: OK" }],
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        return { success: false, error: `HTTP ${response.status}: ${text.slice(0, 200)}` };
      }

      const payload = await response.json();
      const text =
        payload?.content
          ?.map((p: { type?: string; text?: string }) => (p.type === "text" ? p.text : ""))
          .join("") ?? "";
      return { success: true, model, response: text.trim() };
    }

    if (provider === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return { success: false, error: "OpenAI not configured (missing OPENAI_API_KEY)" };
      }

      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({ apiKey });
      const model = modelOverride || process.env.OPENAI_MODEL || "gpt-4.1-mini";
      const response = await client.responses.create({
        model,
        input: [{ role: "user", content: "Reply with exactly: OK" }],
      });
      return { success: true, model, response: response.output_text.trim() };
    }

    if (provider === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return { success: false, error: "Gemini not configured (missing GEMINI_API_KEY)" };
      }

      const model = modelOverride || process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Reply with exactly: OK" }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 10 },
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        return { success: false, error: `HTTP ${response.status}: ${text.slice(0, 200)}` };
      }

      const payload = await response.json();
      const text =
        payload?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text ?? "")
          .join("") ?? "";
      return { success: true, model, response: text.trim() };
    }

    return { success: false, error: "Unknown provider" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/* ─── Dish Explanation (customer-facing) ─── */

export type DishExplainInput = {
  dishName: string;
  dishDescription: string;
  ingredients: string[];
  cuisine: string;
  lang: string;
};

const explainSystemPrompt = `You are a friendly food concierge. A diner points at a dish and asks "what is this?". Explain the dish in their language in 2-3 short sentences.

Rules:
- Sentence 1: What the dish is and how it's prepared (main ingredients, cooking method).
- Sentence 2: Flavor profile — taste, texture, aroma.
- Optional sentence 3: ONLY if the dish is clearly foreign to the diner's culture AND you can think of a genuinely similar dish from the diner's food culture, briefly compare. E.g. for a Chinese speaker eating Moroccan tagine: "有点类似红烧，但用北非香料慢炖". Do NOT force a comparison — if the dish belongs to the diner's own cuisine, or if there is no natural analogy, simply omit this sentence.
- Tone: warm, casual, like a knowledgeable friend — not a textbook.
- Do NOT use markdown, bullet points, or labels. Just natural sentences.
- Do NOT mention allergens or prices — the UI already shows those.
- Reply in the language specified, nothing else.`;

async function explainWithAnthropic(input: DishExplainInput): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_FOUNDRY_API_KEY;
  const url = getAnthropicUrl();
  const model = getAnthropicModel();
  if (!apiKey || !url || !model) return null;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 300,
      temperature: 0.4,
      system: explainSystemPrompt,
      messages: [{
        role: "user",
        content: `Language: ${input.lang}\nCuisine: ${input.cuisine}\nDish: ${input.dishName}\nDescription: ${input.dishDescription}\nIngredients: ${input.ingredients.join(", ") || "not listed"}`,
      }],
    }),
  });

  if (!response.ok) return null;
  const payload = await response.json();
  return payload?.content
    ?.map((part: { type?: string; text?: string }) => part.type === "text" ? part.text : "")
    .join("") ?? null;
}

async function explainWithOpenAI(input: DishExplainInput): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [
      { role: "system", content: explainSystemPrompt },
      {
        role: "user",
        content: `Language: ${input.lang}\nCuisine: ${input.cuisine}\nDish: ${input.dishName}\nDescription: ${input.dishDescription}\nIngredients: ${input.ingredients.join(", ") || "not listed"}`,
      },
    ],
  });
  return response.output_text?.trim() || null;
}

export async function explainDishWithLlm(
  input: DishExplainInput,
  options?: { provider?: string },
): Promise<{ provider: string; text: string } | null> {
  const pref = options?.provider ?? "auto";

  if (pref === "openai") {
    const text = await explainWithOpenAI(input);
    return text ? { provider: "openai", text } : null;
  }
  if (pref === "anthropic") {
    const text = await explainWithAnthropic(input);
    return text ? { provider: "anthropic", text } : null;
  }

  // auto: Anthropic first, then OpenAI
  const anthropic = await explainWithAnthropic(input);
  if (anthropic) return { provider: "anthropic", text: anthropic };

  const openai = await explainWithOpenAI(input);
  if (openai) return { provider: "openai", text: openai };

  return null;
}

// ── Allergen analysis ──

const allergenAnalysisPrompt = `You are a food safety assistant. Given a dish name, description, and ingredients, analyze which of the 14 EU allergens the dish LIKELY contains.

The 14 allergens: gluten, crustaceans, eggs, fish, peanuts, soy, milk, nuts, celery, mustard, sesame, sulphites, lupin, molluscs.

Rules:
- Return a JSON object: { "allergens": ["gluten", "milk", ...], "none": false }
- If the dish likely contains NO common allergens, return: { "allergens": [], "none": true }
- Be conservative — if an ingredient commonly contains an allergen, include it.
- Only include allergens you have reasonable confidence about based on the ingredients and dish type.
- Return ONLY the JSON, no explanation.`;

export async function analyzeAllergens(
  input: DishExplainInput,
  options?: { provider?: string },
): Promise<{ provider: string; allergens: string[]; none: boolean } | null> {
  const userContent = `Cuisine: ${input.cuisine}\nDish: ${input.dishName}\nDescription: ${input.dishDescription}\nIngredients: ${input.ingredients.join(", ") || "not listed"}`;

  const pref = options?.provider ?? "auto";
  let text: string | null = null;
  let provider = "anthropic";

  if (pref === "openai") {
    text = await callOpenAISimple(allergenAnalysisPrompt, userContent);
    provider = "openai";
  } else if (pref === "anthropic") {
    text = await callAnthropicSimple(allergenAnalysisPrompt, userContent);
  } else {
    text = await callAnthropicSimple(allergenAnalysisPrompt, userContent);
    if (!text) {
      text = await callOpenAISimple(allergenAnalysisPrompt, userContent);
      provider = "openai";
    }
  }

  if (!text) return null;

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      provider,
      allergens: Array.isArray(parsed.allergens) ? parsed.allergens : [],
      none: !!parsed.none,
    };
  } catch {
    return null;
  }
}

// ── Calorie estimation ──

const calorieEstimatePrompt = `You are a nutrition estimation assistant. Given a dish name, description, and ingredients, estimate the approximate calorie count (kcal) for a standard serving.

Rules:
- Return a JSON object: { "kcal": 450, "range": "400-500" }
- "kcal" is your best single estimate, "range" is a reasonable range.
- Base your estimate on typical restaurant portions.
- Return ONLY the JSON, no explanation.`;

export async function estimateCalories(
  input: DishExplainInput,
  options?: { provider?: string },
): Promise<{ provider: string; kcal: number; range: string } | null> {
  const userContent = `Cuisine: ${input.cuisine}\nDish: ${input.dishName}\nDescription: ${input.dishDescription}\nIngredients: ${input.ingredients.join(", ") || "not listed"}`;

  const pref = options?.provider ?? "auto";
  let text: string | null = null;
  let provider = "anthropic";

  if (pref === "openai") {
    text = await callOpenAISimple(calorieEstimatePrompt, userContent);
    provider = "openai";
  } else if (pref === "anthropic") {
    text = await callAnthropicSimple(calorieEstimatePrompt, userContent);
  } else {
    text = await callAnthropicSimple(calorieEstimatePrompt, userContent);
    if (!text) {
      text = await callOpenAISimple(calorieEstimatePrompt, userContent);
      provider = "openai";
    }
  }

  if (!text) return null;

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      provider,
      kcal: typeof parsed.kcal === "number" ? parsed.kcal : 0,
      range: parsed.range || "",
    };
  } catch {
    return null;
  }
}

// ── Shared helpers for simple system+user prompts ──

async function callAnthropicSimple(system: string, user: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_FOUNDRY_API_KEY;
  const url = getAnthropicUrl();
  const model = getAnthropicModel();
  if (!apiKey || !url || !model) return null;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 200,
      temperature: 0.2,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!response.ok) return null;
  const payload = await response.json();
  return payload?.content
    ?.map((part: { type?: string; text?: string }) => part.type === "text" ? part.text : "")
    .join("") ?? null;
}

async function callOpenAISimple(system: string, user: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return response.output_text?.trim() || null;
}

export async function extractMenuDraftWithLlm(input: {
  fileName: string;
  mimeType: string;
  text?: string;
  base64?: string;
}) {
  const schemaInstruction = `Return only a RestaurantMenu JSON object with this exact TypeScript-compatible shape.
IMPORTANT: Extract EVERY dish from the menu. Do NOT truncate or skip any items. Include all starters, mains, sides, desserts, drinks, combos, sharing plates, soups, pasta, wines, cocktails, and brunch items.
Supported language codes: ${supportedLanguageCodes.join(", ")}.
Every localized text field must include at least zh, fr and en. Add other supported language keys when you are confident; otherwise the app will fall back safely.
{
  "restaurant": {
    "id": "string",
    "slug": "string",
    "name": "string",
    "cuisine": "string",
    "city": "string",
    "currency": "EUR",
    "languages": ${JSON.stringify(supportedLanguageCodes)},
    "welcome": { "zh": "string", "fr": "string", "en": "string" }
  },
  "updatedAt": "ISO date string",
  "dishes": [{
    "id": "kebab-case-id",
    "category": "starter|main|side|dessert|drink|combo|sharing|soup|pasta|wine|cocktail|brunch",
    "name": { "zh": "string", "fr": "string", "en": "string" },
    "description": { "zh": "string", "fr": "string", "en": "string" },
    "priceCents": 123,
    "currency": "EUR",
    "ingredients": ["only if present or clearly stated"],
    "allergens": ["unknown"],
    "dietaryTags": [],
    "spiceLevel": 0,
    "available": true,
    "marginPriority": 1,
    "portionScore": 2
  }]
}
Allowed allergens: gluten, crustaceans, eggs, fish, peanuts, soy, milk, nuts, celery, mustard, sesame, sulphites, lupin, molluscs, alcohol, unknown.
Allowed dietaryTags: vegetarian, vegan, halal_possible, contains_pork, contains_beef, contains_seafood, high_protein, low_calorie, healthy, spicy, signature, popular, good_value, light, comfort_food.
If the source does not provide allergens, use ["unknown"]. If calories are absent, omit caloriesKcal.
portionScore guidelines: 1 = small/light (tapas, amuse-bouche, small side, single drink, small dessert), 2 = standard individual portion (a normal main, a bowl of soup, a salad, a regular starter), 3 = large/shareable (family-style platter, sharing plate, large combo, XL portion). Default to 2 if unsure.`;

  if (input.text) {
    const text = await createAnthropicMessage(
      `${schemaInstruction}\n\nFile name: ${input.fileName}\nMIME: ${input.mimeType}\n\nMenu source:\n${input.text}`,
    );
    if (!text) return null;
    return JSON.parse(stripJson(text)) as RestaurantMenu;
  }

  if (input.base64) {
    const contentType = input.mimeType || "application/octet-stream";
    const visionSystemPrompt =
      "You are CarteAI's menu ingestion engine. Extract ALL dishes from the restaurant menu into strict JSON. Never skip dishes — include every single item on every page. Never invent allergens, calories, ingredients, prices, or dish names. If a field is missing, use safe placeholders and mark allergens as unknown when needed.";
    const prompt = `${schemaInstruction}\n\nFile name: ${input.fileName}\nMIME: ${input.mimeType}`;

    // Try Gemini first for vision tasks (images/PDFs)
    if (hasGeminiVision()) {
      try {
        const text = await createGeminiMessage(visionSystemPrompt, [
          { text: prompt },
          { inlineData: { mimeType: contentType, data: input.base64 } },
        ]);
        if (text) return JSON.parse(stripJson(text)) as RestaurantMenu;
      } catch {
        // Fall through to Anthropic
      }
    }

    // Fallback: Anthropic vision
    const fileBlock: AnthropicContentBlock =
      contentType === "application/pdf"
        ? {
            type: "document",
            source: {
              type: "base64",
              media_type: contentType,
              data: input.base64,
            },
          }
        : {
            type: "image",
            source: {
              type: "base64",
              media_type: contentType,
              data: input.base64,
            },
          };

    const text = await createAnthropicMessage([
      { type: "text", text: prompt },
      fileBlock,
    ]);
    if (!text) return null;
    return JSON.parse(stripJson(text)) as RestaurantMenu;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Two-step menu import: OCR (Gemini) → Structure (OpenAI)
// ---------------------------------------------------------------------------

/**
 * Step 1: OCR only — extract raw text from menu image/PDF via Gemini Vision.
 * Returns plain text with dish names, prices, and any visible info in the
 * original language. No translation, no JSON structuring.
 */
export async function extractMenuOcr(input: {
  fileName: string;
  mimeType: string;
  base64: string;
}): Promise<string | null> {
  const contentType = input.mimeType || "application/octet-stream";

  const ocrPrompt = `You are an OCR engine for restaurant menus. Extract ALL text from this menu image exactly as written.

Rules:
- Preserve the original language(s) — do NOT translate anything
- Keep dish names, prices, descriptions, section headers, and any notes
- Format output as a clean list grouped by section/category if visible
- Use this format for each item: "DISH NAME — PRICE" (e.g. "Couscous Royal — 18.50€")
- Include any visible notes about allergens, ingredients, or dietary info
- If a section header is visible (e.g. "Entrées", "Plats", "Desserts"), include it as a header line
- Extract EVERY item, do not skip or truncate
- Do NOT add any commentary or explanation — output only the extracted text`;

  // For OCR, skip JSON response format — we want plain text
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash";

  if (apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: ocrPrompt }] },
          contents: [{ parts: [
            { text: `File: ${input.fileName}` },
            { inlineData: { mimeType: contentType, data: input.base64 } },
          ] }],
          generationConfig: { temperature: 0, maxOutputTokens: 8000 },
        }),
      });
      if (response.ok) {
        const payload = await response.json();
        const text = payload?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text ?? "")
          .join("") ?? "";
        if (text) return text;
      }
    } catch {
      // Fall through to Anthropic
    }
  }

  // Fallback: Anthropic vision
  const fileBlock: AnthropicContentBlock =
    contentType === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: contentType, data: input.base64 } }
      : { type: "image", source: { type: "base64", media_type: contentType, data: input.base64 } };

  return createAnthropicMessage([
    { type: "text", text: ocrPrompt },
    fileBlock,
  ]);
}

/**
 * Step 2: Structure OCR text into a RestaurantMenu JSON using OpenAI (text-only, fast).
 * Translates to 3 languages, categorizes, infers allergens, generates descriptions.
 */
export async function structureMenuWithLlm(ocrText: string): Promise<RestaurantMenu | null> {
  const structurePrompt = `You are CarteAI's menu structuring engine. Convert raw OCR text from a restaurant menu into a structured JSON object.

Input: Raw text extracted from a menu image (may be in any language).

Your tasks:
1. Parse each dish: name, price, description (if present), section/category
2. Translate names and descriptions into zh, fr, and en (keep the original language accurate, translate the others)
3. Categorize: starter, main, side, dessert, drink, combo, sharing (tapas/shared plates), soup, pasta, wine, cocktail, or brunch
4. Infer likely allergens from dish names and ingredients — use ["unknown"] if unsure
5. Infer dietary tags where obvious (vegetarian, vegan, contains_pork, contains_beef, etc.)
6. Generate a short appetizing description in each language if not provided
7. Generate a kebab-case ID for each dish from its English name

Return ONLY a valid JSON object with this exact shape:
{
  "restaurant": {
    "id": "imported",
    "slug": "imported",
    "name": "Imported Menu",
    "cuisine": "",
    "city": "",
    "currency": "EUR",
    "languages": ${JSON.stringify(supportedLanguageCodes)},
    "welcome": { "zh": "欢迎", "fr": "Bienvenue", "en": "Welcome" }
  },
  "updatedAt": "${new Date().toISOString()}",
  "dishes": [{
    "id": "kebab-case-id",
    "category": "starter|main|side|dessert|drink|combo|sharing|soup|pasta|wine|cocktail|brunch",
    "name": { "zh": "中文名", "fr": "Nom français", "en": "English name" },
    "description": { "zh": "描述", "fr": "Description", "en": "Description" },
    "priceCents": 1850,
    "currency": "EUR",
    "ingredients": [],
    "allergens": ["unknown"],
    "dietaryTags": [],
    "spiceLevel": 0,
    "available": true,
    "marginPriority": 1,
    "portionScore": 2
  }]
}

Allowed allergens: gluten, crustaceans, eggs, fish, peanuts, soy, milk, nuts, celery, mustard, sesame, sulphites, lupin, molluscs, alcohol, unknown.
Allowed dietaryTags: vegetarian, vegan, halal_possible, contains_pork, contains_beef, contains_seafood, high_protein, low_calorie, healthy, spicy, signature, popular, good_value, light, comfort_food.
Prices must be in cents (e.g. 18.50€ = 1850). If no currency symbol, assume EUR.
portionScore guidelines: 1 = small/light (tapas, amuse-bouche, small side, single drink, small dessert), 2 = standard individual portion (a normal main, a bowl of soup, a salad, a regular starter), 3 = large/shareable (family-style platter, sharing plate, large combo, XL portion). Default to 2 if unsure.`;

  // Try OpenAI first (fast for text-only tasks)
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const client = new OpenAI({ apiKey: openaiKey });
      const response = await client.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          { role: "system", content: structurePrompt },
          { role: "user", content: `Here is the raw OCR text from the menu:\n\n${ocrText}` },
        ],
      });
      const text = response.output_text;
      if (text) return JSON.parse(stripJson(text)) as RestaurantMenu;
    } catch {
      // Fall through to Anthropic
    }
  }

  // Fallback: Anthropic
  const text = await createAnthropicMessage(
    `${structurePrompt}\n\nHere is the raw OCR text from the menu:\n\n${ocrText}`,
  );
  if (!text) return null;
  return JSON.parse(stripJson(text)) as RestaurantMenu;
}
