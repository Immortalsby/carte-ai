import { NextResponse } from "next/server";
import { getLocalizedText } from "@/lib/i18n";
import { getDefaultMenu, parseMenu } from "@/lib/menu";
import { recommendWithLlm } from "@/lib/llm";
import { recommendFromMenu } from "@/lib/recommender";
import { recommendationRequestSchema } from "@/lib/validation";
import { db } from "@/lib/db";
import { recommendations_log } from "@/lib/db/schema";
import { getLlmUsage, incrementLlmUsage } from "@/lib/db/queries/llm-usage";
import { getTenantBySlug } from "@/lib/db/queries/tenants";
import { recommendRateLimit, recommendRateLimitStrict } from "@/lib/rate-limit";
import { hasActiveAccess } from "@/lib/trial";
import { isSessionVerified } from "@/lib/turnstile";

/** Estimate token count from a string (rough: 1 token ≈ 4 chars) */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Cost per LLM call in cents (estimated: ~$0.02 per call = 2 cents) */
const LLM_COST_CENTS_PER_CALL = 2;

export async function POST(request: Request) {
  // Origin check — reject cross-origin browser requests
  const origin = request.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (origin && appUrl) {
    const allowed = new URL(appUrl).origin;
    if (origin !== allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // IP rate limiting — 60 requests/min per IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  try {
    const { success } = await recommendRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }
  } catch {
    // If Redis is down, fail open — per-tenant quota is the backstop
  }

  // Session verification: check cookie set by /api/verify-session (Turnstile verified once on page load)
  const cookies = request.headers.get("cookie") ?? "";
  const verifiedCookie = cookies.split("; ").find((c) => c.startsWith("carte_verified="))?.split("=")[1];
  if (!isSessionVerified(verifiedCookie)) {
    // Unverified session: apply stricter rate-limit (10/min vs 60/min)
    try {
      const { success } = await recommendRateLimitStrict.limit(ip);
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

  const startTime = Date.now();
  try {
    const json = await request.json();
    const parsed = recommendationRequestSchema.parse(json);
    const menu = parsed.menu ? parseMenu(parsed.menu) : getDefaultMenu();
    const localRequest = {
      language: parsed.language,
      budgetCents: parsed.budgetCents,
      mode: parsed.mode,
      occasion: parsed.occasion,
      partySize: parsed.partySize,
      excludedTags: parsed.excludedTags,
      excludedAllergens: parsed.excludedAllergens,
      maxSpiceLevel: parsed.maxSpiceLevel,
      userText: parsed.userText,
    };
    // Resolve actual tenant UUID from slug for logging/quota (FR32)
    const tenant = await getTenantBySlug(menu.restaurant.slug).catch(() => null);
    const tenantId = tenant?.id ?? menu.restaurant.id;
    const tenantSettings = (tenant?.settings ?? {}) as Record<string, unknown>;

    // ── Build candidate pool: all dishes passing hard safety filters ──
    const candidates = menu.dishes
      .filter((dish) => {
        if (!dish.available) return false;
        if (parsed.maxSpiceLevel !== undefined && dish.spiceLevel > parsed.maxSpiceLevel) return false;
        if (parsed.excludedAllergens.some((a) => dish.allergens.includes(a))) return false;
        if (parsed.excludedTags.some((t) => dish.dietaryTags.includes(t))) return false;
        return true;
      })
      .map((dish) => ({
        id: dish.id,
        category: dish.category,
        name: getLocalizedText(dish.name, parsed.language),
        description: getLocalizedText(dish.description, parsed.language),
        priceCents: dish.priceCents,
        ingredients: dish.ingredients,
        allergens: dish.allergens,
        dietaryTags: dish.dietaryTags,
        caloriesKcal: dish.caloriesKcal ?? null,
        spiceLevel: dish.spiceLevel,
        portionScore: dish.portionScore ?? (["main", "pasta", "soup", "brunch"].includes(dish.category) ? 2 : ["sharing", "combo"].includes(dish.category) ? 3 : 1) as 1 | 2 | 3,
      }));

    // ── LLM-first: try AI recommendation with full candidate pool ──
    // Block LLM if trial expired (local rules still work)
    const trialActive = tenant ? hasActiveAccess(tenant) : true;
    let quotaExceeded = !trialActive;
    try {
      const llmQuotaCalls = (tenantSettings.llm_quota_calls as number) || 5000;
      if (tenant) {
        const currentUsage = await getLlmUsage(tenantId);
        if (currentUsage.call_count >= llmQuotaCalls) quotaExceeded = true;
      }
    } catch {
      // If quota check fails, allow LLM call (fail-open)
    }

    if (!quotaExceeded) {
      try {
        const llmOptions = {
          provider: (tenantSettings.llm_provider as string) || undefined,
          model: (tenantSettings.llm_model as string) || undefined,
        };

        const llm = await recommendWithLlm({
          request: localRequest,
          candidates,
        }, llmOptions);

        if (llm) {
          const ai = llm.result;

          // Guardrail: strip any hallucinated dishIds not in candidates
          const validDishIds = new Set(candidates.map((c) => c.id));
          const validatedRecs = ai.recommendations.filter(
            (item: Record<string, unknown>) => {
              const ids = item.dishIds as string[] | undefined;
              return ids?.every((id) => validDishIds.has(id)) ?? false;
            },
          );

          if (validatedRecs.length > 0) {
            const response = {
              ...ai,
              recommendations: validatedRecs.map(
                (item: Record<string, unknown>, index: number) => ({
                  id: `rec-ai-${index + 1}`,
                  ...item,
                }),
              ),
              fallbackUsed: false,
              provider: llm.provider,
            };

            const estimatedTokens = estimateTokens(JSON.stringify(response));
            incrementLlmUsage(tenantId, estimatedTokens, LLM_COST_CENTS_PER_CALL).catch(() => {});
            logRecommendation(tenantId, localRequest, response, llm.provider, Date.now() - startTime, parsed.excludedAllergens);
            return NextResponse.json(response);
          }
          // All dish IDs hallucinated — fall through to local
        }
      } catch {
        // LLM failed — fall through to local
      }
    }

    // ── Fallback: local rules (LLM unavailable / quota exceeded / error) ──
    const local = recommendFromMenu(menu, localRequest);
    const fallbackReason = quotaExceeded ? "quota_exceeded" : "fallback";
    logRecommendation(tenantId, localRequest, local, fallbackReason, Date.now() - startTime, parsed.excludedAllergens);
    return NextResponse.json(local);
  } catch (error) {
    console.error("[API] recommend error:", error);
    return NextResponse.json(
      { error: "Invalid recommendation request" },
      { status: 400 },
    );
  }
}

/** Fire-and-forget: log recommendation for compliance audit (FR32) */
function logRecommendation(
  tenantId: string,
  request: Record<string, unknown>,
  response: Record<string, unknown>,
  provider: string | null,
  latencyMs: number,
  allergensFiltered: string[],
) {
  db.insert(recommendations_log)
    .values({
      tenant_id: tenantId,
      request,
      response,
      provider,
      latency_ms: latencyMs,
      allergens_filtered: allergensFiltered.length > 0 ? allergensFiltered : null,
    })
    .catch(() => {
      // Silent fail — logging should never break recommendations
    });
}
