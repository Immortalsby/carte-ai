import { NextResponse } from "next/server";
import { explainDishWithLlm } from "@/lib/llm";
import { explainRateLimit, explainRateLimitStrict } from "@/lib/rate-limit";
import { getLlmUsage, incrementLlmUsage } from "@/lib/db/queries/llm-usage";
import { getTenantBySlug } from "@/lib/db/queries/tenants";
import { hasActiveAccess } from "@/lib/trial";
import { isSessionVerified } from "@/lib/turnstile";
import { getLocalizedText } from "@/lib/i18n";
import type { LanguageCode, LocalizedText } from "@/types/menu";

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

  // IP rate-limit
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  try {
    const { success } = await explainRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }
  } catch {
    // Redis down — fail open
  }

  // Session verification: check cookie set by /api/verify-session (Turnstile verified once on page load)
  const cookies = request.headers.get("cookie") ?? "";
  const verifiedCookie = cookies.split("; ").find((c) => c.startsWith("carte_verified="))?.split("=")[1];
  if (!isSessionVerified(verifiedCookie)) {
    try {
      const { success } = await explainRateLimitStrict.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 },
        );
      }
    } catch {
      // Redis down — fail open
    }
  }

  try {
    const body = await request.json();
    const { dishName, dishDescription, ingredients, cuisine, lang, tenantSlug } = body as {
      dishName: Record<string, string>;
      dishDescription: Record<string, string>;
      ingredients: string[];
      cuisine: string;
      lang: string;
      tenantSlug: string;
    };

    if (!dishName || !lang) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Tenant quota check
    const tenant = await getTenantBySlug(tenantSlug).catch(() => null);
    const tenantId = tenant?.id ?? "unknown";
    const tenantSettings = (tenant?.settings ?? {}) as Record<string, unknown>;

    if (tenant && !hasActiveAccess(tenant)) {
      return NextResponse.json({ error: "Trial expired" }, { status: 403 });
    }

    try {
      const llmQuotaCalls = (tenantSettings.llm_quota_calls as number) || 5000;
      if (tenant) {
        const currentUsage = await getLlmUsage(tenantId);
        if (currentUsage.call_count >= llmQuotaCalls) {
          return NextResponse.json({ error: "LLM quota exceeded" }, { status: 429 });
        }
      }
    } catch {
      // Quota check fail — allow
    }

    const result = await explainDishWithLlm({
      dishName: getLocalizedText(dishName as LocalizedText, lang as LanguageCode),
      dishDescription: getLocalizedText(dishDescription as LocalizedText, lang as LanguageCode),
      ingredients: ingredients ?? [],
      cuisine: cuisine || "unknown",
      lang,
    }, { provider: (tenantSettings.llm_provider as string) || undefined });

    if (!result) {
      return NextResponse.json({ error: "LLM unavailable" }, { status: 503 });
    }

    // Count against quota (cheaper than recommend — still 1 call)
    incrementLlmUsage(tenantId, Math.ceil(result.text.length / 4), 1).catch(() => {});

    return NextResponse.json({ explanation: result.text, provider: result.provider });
  } catch (error) {
    console.error("[API] dish-explain error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
