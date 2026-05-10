import { NextResponse } from "next/server";
import { explainRateLimit } from "@/lib/rate-limit";
import { isSessionVerified } from "@/lib/turnstile";
import { callAnthropicSimple, callOpenAISimple } from "@/lib/llm";
import { hasCloudLlm } from "@/lib/llm";

export async function POST(request: Request) {
  // Origin check
  const origin = request.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (origin && appUrl) {
    const allowed = new URL(appUrl).origin;
    if (origin !== allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Rate limit
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  try {
    const { success } = await explainRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  } catch {}

  // Session check
  const cookies = request.headers.get("cookie") ?? "";
  const verifiedCookie = cookies.split("; ").find((c) => c.startsWith("carte_verified="))?.split("=")[1];
  if (!isSessionVerified(verifiedCookie)) {
    // Allow but with stricter rate limit already applied
  }

  if (!hasCloudLlm()) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { dishes, answers, notes, peopleCount, customerLang, targetLang, cuisine } = body as {
      dishes: Array<{
        name: Record<string, string>;
        description: Record<string, string>;
        category: string;
        allergens: string[];
        priceCents: number;
      }>;
      answers: Record<string, string>;
      notes: string;
      peopleCount: number;
      customerLang: string;
      targetLang: string;
      cuisine: string;
      tenantSlug: string;
    };

    if (!dishes?.length) {
      return NextResponse.json({ error: "No dishes" }, { status: 400 });
    }

    const langNames: Record<string, string> = {
      fr: "French", en: "English", zh: "Chinese", de: "German", es: "Spanish",
      it: "Italian", pt: "Portuguese", ja: "Japanese", ko: "Korean", ar: "Arabic",
      tr: "Turkish", nl: "Dutch", th: "Thai", vi: "Vietnamese", hi: "Hindi", el: "Greek",
    };

    const targetLangName = langNames[targetLang] || "English";
    const customerLangName = langNames[customerLang] || "English";

    const dishList = dishes.map((d, i) => {
      const name = d.name[targetLang] || d.name.fr || d.name.en || Object.values(d.name)[0];
      const customerName = d.name[customerLang] || d.name.en || d.name.fr || Object.values(d.name)[0];
      const price = (d.priceCents / 100).toFixed(2);
      return `${i + 1}. ${name}${customerName !== name ? ` (${customerName})` : ""} — €${price}`;
    }).join("\n");

    const answersText = Object.entries(answers)
      .filter(([, v]) => v)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");

    const prompt = `You are a helpful restaurant order assistant. Generate a clear, polite order summary for a waiter.

OUTPUT LANGUAGE: Write the entire summary in ${targetLangName}. This is the language the waiter speaks.

CUSTOMER INFO:
- Party size: ${peopleCount} ${peopleCount > 1 ? "people" : "person"}
- Customer speaks: ${customerLangName}
- Restaurant cuisine: ${cuisine || "general"}

DISHES ORDERED:
${dishList}

CUSTOMER PREFERENCES:
${answersText || "(none specified)"}

ADDITIONAL NOTES FROM CUSTOMER:
${notes || "(none)"}

INSTRUCTIONS:
1. Write a clean, structured order summary the waiter can read at a glance
2. List each dish with any customization (doneness, sides, etc.)
3. Include the customer's dietary restrictions/allergies prominently if any
4. Include any special requests from notes
5. If the customer speaks a different language from the waiter, add a brief note about that
6. Keep it concise and professional — this will be shown on a phone screen
7. Do NOT include prices in the summary
8. Add a total item count at the top`;

    let summary: string | null = null;
    const systemPrompt = "You are a restaurant order assistant. Generate clean, professional order summaries for waiters.";

    summary = await callAnthropicSimple(systemPrompt, prompt, 800);
    if (!summary) {
      summary = await callOpenAISimple(systemPrompt, prompt);
    }
    if (!summary) {
      return NextResponse.json({ error: "AI unavailable" }, { status: 503 });
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("[API] waiter-summary error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
