import { NextResponse } from "next/server";
import { headers } from "next/headers";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { supportedLanguages } from "@/lib/languages";

/**
 * POST /api/translate-promo
 * Translates a short promotional text into all supported languages.
 * Uses OpenAI for quality translations.
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = (await request.json()) as { text?: string };
    if (!text || text.length > 120) {
      return NextResponse.json({ error: "Text is required and must be 120 chars or less" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI not configured" }, { status: 500 });
    }

    const langList = supportedLanguages.map((l) => `${l.code} (${l.label})`).join(", ");

    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: `You are a professional translator for restaurant marketing. Translate the given promotional text into all requested languages. Keep translations natural, short, and appealing. Return ONLY a JSON object with language codes as keys and translations as values. Do not wrap in markdown.`,
        },
        {
          role: "user",
          content: `Translate this restaurant promotional text into these languages: ${langList}

Text: "${text}"

Return JSON like: {"fr": "...", "en": "...", "zh": "...", ...}`,
        },
      ],
    });

    const raw = response.output_text.replace(/```json\n?|```\n?/g, "").trim();
    const translations = JSON.parse(raw) as Record<string, string>;

    return NextResponse.json({ translations });
  } catch (error) {
    console.error("[translate-promo] Error:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
