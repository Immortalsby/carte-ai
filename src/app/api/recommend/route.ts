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
import { recommendRateLimit } from "@/lib/rate-limit";

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
    const local = recommendFromMenu(menu, localRequest);

    // Resolve actual tenant UUID from slug for logging/quota (FR32)
    const tenant = await getTenantBySlug(menu.restaurant.slug).catch(() => null);
    const tenantId = tenant?.id ?? menu.restaurant.id;

    // FR53/59: Check LLM quota before calling LLM
    let quotaExceeded = false;
    try {
      const tenantSettings = (tenant?.settings ?? {}) as Record<string, unknown>;
      const llmQuotaCalls = (tenantSettings.llm_quota_calls as number) || 5000;
      if (tenant) {
        const currentUsage = await getLlmUsage(tenantId);
        if (currentUsage.call_count >= llmQuotaCalls) {
          quotaExceeded = true;
        }
      }
    } catch {
      // If quota check fails, allow LLM call (fail-open for user experience)
    }

    if (quotaExceeded) {
      // FR53: Auto-degrade to local rules when quota exceeded
      logRecommendation(tenantId, localRequest, local, "quota_exceeded", Date.now() - startTime, parsed.excludedAllergens);
      return NextResponse.json(local);
    }

    try {
      const candidateIds = new Set(local.recommendations.flatMap((item) => item.dishIds));
      const candidates = menu.dishes
        .filter((dish) => candidateIds.has(dish.id))
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
        }));

      // Read tenant-level LLM provider/model preferences
      const tenantSettings = (tenant?.settings ?? {}) as Record<string, unknown>;
      const llmOptions = {
        provider: (tenantSettings.llm_provider as string) || undefined,
        model: (tenantSettings.llm_model as string) || undefined,
      };

      const llm = await recommendWithLlm({
        request: localRequest,
        candidates,
        localRecommendations: local.recommendations,
      }, llmOptions);

      if (!llm) {
        // Log local-only recommendation (FR32)
        logRecommendation(tenantId, localRequest, local, null, Date.now() - startTime, parsed.excludedAllergens);
        return NextResponse.json(local);
      }

      const ai = llm.result;

      // Guardrail #1 enforcement: strip any LLM-recommended dishIds not in candidates
      const validDishIds = new Set(candidates.map((c) => c.id));
      const validatedRecs = ai.recommendations.filter(
        (item: Record<string, unknown>) => {
          const ids = item.dishIds as string[] | undefined;
          return ids?.every((id) => validDishIds.has(id)) ?? false;
        },
      );

      // If LLM hallucinated all dish IDs, fall back to local results
      if (validatedRecs.length === 0) {
        logRecommendation(tenantId, localRequest, local, "guardrail_fallback", Date.now() - startTime, parsed.excludedAllergens);
        return NextResponse.json(local);
      }

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

      // FR53/60: Track LLM usage (fire-and-forget)
      const estimatedTokens = estimateTokens(JSON.stringify(response));
      incrementLlmUsage(tenantId, estimatedTokens, LLM_COST_CENTS_PER_CALL).catch(() => {});

      // Log LLM-enhanced recommendation (FR32)
      logRecommendation(tenantId, localRequest, response, llm.provider, Date.now() - startTime, parsed.excludedAllergens);
      return NextResponse.json(response);
    } catch {
      // Log fallback recommendation (FR32)
      logRecommendation(tenantId, localRequest, local, "fallback", Date.now() - startTime, parsed.excludedAllergens);
      return NextResponse.json(local);
    }
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
