import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/db/queries/tenants";

const schema = z.object({
  action: z.enum(["translate", "describe"]),
  /** The dish name in whatever language the owner typed */
  name: z.string().min(1),
  /** Cuisine type for better context */
  cuisine: z.string().optional(),
  /** Source language (auto-detected if omitted) */
  sourceLang: z.string().optional(),
  /** Tenant slug — used to read per-tenant AI model settings */
  slug: z.string().optional(),
});

function stripJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? trimmed;
}

async function resolveModelConfig(slug?: string) {
  let provider: string | undefined;
  let model: string | undefined;

  if (slug) {
    const tenant = await getTenantBySlug(slug);
    if (tenant) {
      const settings = (tenant.settings as Record<string, unknown> | null) ?? {};
      provider = (settings.llm_provider as string) || undefined;
      model = (settings.llm_model as string) || undefined;
    }
  }

  // "auto" means no preference — fall through to default logic
  if (provider === "auto") provider = undefined;

  return { provider, model };
}

async function callLlm(
  systemPrompt: string,
  userPrompt: string,
  config?: { provider?: string; model?: string },
) {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const openaiModel = config?.model || process.env.OPENAI_MODEL || "gpt-4.1-mini";
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: openaiKey });
    const response = await client.responses.create({
      model: openaiModel,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    return response.output_text;
  }

  return null;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, name, cuisine, sourceLang, slug } = schema.parse(body);
    const cuisineLabel =
      cuisine?.replace(/_restaurant$/, "").replace(/_/g, " ") ?? "";

    // Resolve per-tenant model config
    const config = await resolveModelConfig(slug);

    if (action === "translate") {
      const systemPrompt =
        "You are a professional food menu translator. Translate dish names accurately, preserving culinary terms. Return ONLY valid JSON, no explanation.";
      const userPrompt = `Translate this dish name to English, French, and Chinese (Simplified).
Dish name: "${name}"
${cuisineLabel ? `Cuisine: ${cuisineLabel}` : ""}
${sourceLang ? `Source language: ${sourceLang}` : "Auto-detect the source language."}

Return JSON: {"en": "English name", "fr": "French name", "zh": "Chinese name"}
Keep the original language value identical to the input.`;

      const result = await callLlm(systemPrompt, userPrompt, config);
      if (!result) {
        return NextResponse.json(
          { error: "LLM unavailable" },
          { status: 503 },
        );
      }
      const translations = JSON.parse(stripJson(result));
      return NextResponse.json({ translations });
    }

    if (action === "describe") {
      const systemPrompt =
        "You are a professional food copywriter. Write appetizing, concise dish descriptions for restaurant menus. Return ONLY valid JSON, no explanation.";
      const userPrompt = `Write a short, appetizing description (1-2 sentences, under 100 characters per language) for this dish:
Dish name: "${name}"
${cuisineLabel ? `Cuisine: ${cuisineLabel}` : ""}

Return JSON: {"en": "English description", "fr": "French description", "zh": "Chinese description"}`;

      const result = await callLlm(systemPrompt, userPrompt, config);
      if (!result) {
        return NextResponse.json(
          { error: "LLM unavailable" },
          { status: 503 },
        );
      }
      const descriptions = JSON.parse(stripJson(result));
      return NextResponse.json({ descriptions });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", detail: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[API] dish-assist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
