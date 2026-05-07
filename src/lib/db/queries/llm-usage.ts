import { eq, and, gte, lte, sql, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { llm_usage, recommendations_log } from "@/lib/db/schema";

export async function getLlmUsage(tenantId: string, month?: string) {
  const currentMonth = month ?? new Date().toISOString().slice(0, 7);

  const result = await db
    .select()
    .from(llm_usage)
    .where(
      and(eq(llm_usage.tenant_id, tenantId), eq(llm_usage.month, currentMonth)),
    )
    .limit(1);

  return (
    result[0] ?? {
      call_count: 0,
      token_count: 0,
      cost_cents: 0,
    }
  );
}

/** LLM provider distribution + fallback count (FR47) */
export async function getLlmProviderStats(tenantId: string, from: Date, to: Date) {
  const providerDist = await db
    .select({
      provider: recommendations_log.provider,
      count: count(),
    })
    .from(recommendations_log)
    .where(
      and(
        eq(recommendations_log.tenant_id, tenantId),
        gte(recommendations_log.created_at, from),
        lte(recommendations_log.created_at, to),
      ),
    )
    .groupBy(recommendations_log.provider);

  // Non-LLM providers: null (no LLM available), fallback, guardrail_fallback, quota_exceeded
  const degradedProviders = new Set(["fallback", "guardrail_fallback", "quota_exceeded"]);
  const totalCount = providerDist.reduce((sum, p) => sum + p.count, 0);
  const degradedCount = providerDist
    .filter((p) => degradedProviders.has(p.provider ?? "") || !p.provider)
    .reduce((sum, p) => sum + p.count, 0);

  return {
    providerDistribution: providerDist.map((p) => ({
      name: p.provider || "local",
      value: p.count,
    })),
    fallbackCount: degradedCount,
    totalCount,
  };
}

/** Global LLM usage across all tenants — for founder dashboard */
export async function getGlobalLlmUsage(month?: string) {
  const currentMonth = month ?? new Date().toISOString().slice(0, 7);

  const result = await db
    .select({
      call_count: sql<number>`coalesce(sum(${llm_usage.call_count}), 0)`,
      token_count: sql<number>`coalesce(sum(${llm_usage.token_count}), 0)`,
      cost_cents: sql<number>`coalesce(sum(${llm_usage.cost_cents}), 0)`,
    })
    .from(llm_usage)
    .where(eq(llm_usage.month, currentMonth));

  return {
    call_count: Number(result[0]?.call_count ?? 0),
    token_count: Number(result[0]?.token_count ?? 0),
    cost_cents: Number(result[0]?.cost_cents ?? 0),
  };
}

export async function incrementLlmUsage(
  tenantId: string,
  tokens: number,
  costCents: number,
) {
  const month = new Date().toISOString().slice(0, 7);
  // Round to integer — cost_cents column is integer type
  const roundedCost = Math.round(costCents);
  const roundedTokens = Math.round(tokens);

  await db
    .insert(llm_usage)
    .values({
      tenant_id: tenantId,
      month,
      call_count: 1,
      token_count: roundedTokens,
      cost_cents: roundedCost,
    })
    .onConflictDoUpdate({
      target: [llm_usage.tenant_id, llm_usage.month],
      set: {
        call_count: sql`${llm_usage.call_count} + 1`,
        token_count: sql`${llm_usage.token_count} + ${roundedTokens}`,
        cost_cents: sql`${llm_usage.cost_cents} + ${roundedCost}`,
        updated_at: new Date(),
      },
    });
}
