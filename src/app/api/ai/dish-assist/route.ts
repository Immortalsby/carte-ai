import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";

const schema = z.object({
  action: z.enum(["translate", "describe"]),
  /** The dish name in whatever language the owner typed */
  name: z.string().min(1),
  /** Cuisine type for better context */
  cuisine: z.string().optional(),
  /** Source language (auto-detected if omitted) */
  sourceLang: z.string().optional(),
});

function stripJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? trimmed;
}

async function callLlm(systemPrompt: string, userPrompt: string) {
  // Try Anthropic Foundry first
  const anthropicKey = process.env.ANTHROPIC_FOUNDRY_API_KEY;
  const baseUrl = process.env.ANTHROPIC_FOUNDRY_BASE_URL?.replace(/\/$/, "");
  const model =
    process.env.ANTHROPIC_MODEL === "OPUS"
      ? process.env.ANTHROPIC_DEFAULT_OPUS_MODEL || "claude-opus-4-6"
      : process.env.ANTHROPIC_MODEL || process.env.ANTHROPIC_DEFAULT_OPUS_MODEL;

  if (anthropicKey && baseUrl && model) {
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 800,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (res.ok) {
      const payload = await res.json();
      const text =
        payload?.content
          ?.map((p: { type?: string; text?: string }) =>
            p.type === "text" ? p.text : "",
          )
          .join("") ?? "";
      return text;
    }
  }

  // Fallback to OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: openaiKey });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
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
    const { action, name, cuisine, sourceLang } = schema.parse(body);
    const cuisineLabel =
      cuisine?.replace(/_restaurant$/, "").replace(/_/g, " ") ?? "";

    if (action === "translate") {
      const systemPrompt =
        "You are a professional food menu translator. Translate dish names accurately, preserving culinary terms. Return ONLY valid JSON, no explanation.";
      const userPrompt = `Translate this dish name to English, French, and Chinese (Simplified).
Dish name: "${name}"
${cuisineLabel ? `Cuisine: ${cuisineLabel}` : ""}
${sourceLang ? `Source language: ${sourceLang}` : "Auto-detect the source language."}

Return JSON: {"en": "English name", "fr": "French name", "zh": "Chinese name"}
Keep the original language value identical to the input.`;

      const result = await callLlm(systemPrompt, userPrompt);
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

      const result = await callLlm(systemPrompt, userPrompt);
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
