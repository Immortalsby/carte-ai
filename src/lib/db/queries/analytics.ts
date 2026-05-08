import { eq, and, gte, lte, sql, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { analytics_events } from "@/lib/db/schema";

/**
 * Validate and sanitize a timezone identifier so it can be safely inlined
 * into SQL via sql.raw(). Only allows IANA-style names (e.g. "Europe/Paris",
 * "America/New_York", "UTC", "US/Eastern").
 */
function safeTz(tz: string): string {
  if (!/^[A-Za-z_\/-]+$/.test(tz)) {
    return "UTC";
  }
  return tz;
}

export async function writeEvent(data: {
  tenant_id: string;
  event_type: string;
  payload?: Record<string, unknown>;
  session_id?: string;
  language?: string;
}) {
  await db.insert(analytics_events).values(data);
}

/** Active tenant counts for business health (FR48) */
export async function getActiveTenantsStats(from: Date, to: Date) {
  const sevenDaysAgo = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(to.getTime() - 24 * 60 * 60 * 1000);

  const dau = await db
    .select({
      count: sql<number>`count(distinct ${analytics_events.tenant_id})`,
    })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.event_type, "scan"),
        gte(analytics_events.created_at, oneDayAgo),
        lte(analytics_events.created_at, to),
      ),
    );

  const wau = await db
    .select({
      count: sql<number>`count(distinct ${analytics_events.tenant_id})`,
    })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.event_type, "scan"),
        gte(analytics_events.created_at, sevenDaysAgo),
        lte(analytics_events.created_at, to),
      ),
    );

  // Average daily scans per active tenant (last 7 days)
  const avgScansPerTenant = await db
    .select({
      avg: sql<number>`round(count(*)::numeric / 7 / greatest(count(distinct ${analytics_events.tenant_id}), 1), 1)`,
    })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.event_type, "scan"),
        gte(analytics_events.created_at, sevenDaysAgo),
        lte(analytics_events.created_at, to),
      ),
    );

  return {
    dau: Number(dau[0]?.count ?? 0),
    wau: Number(wau[0]?.count ?? 0),
    avgDailyScansPerTenant: Number(avgScansPerTenant[0]?.avg ?? 0),
  };
}

/** Global stats across all tenants — for founder dashboard (FR40) */
export async function getGlobalStats(from: Date, to: Date, tz = "Europe/Paris") {
  const scans = await db
    .select({ count: count() })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.event_type, "scan"),
        gte(analytics_events.created_at, from),
        lte(analytics_events.created_at, to),
      ),
    );

  const recommendations = await db
    .select({ count: count() })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.event_type, "recommend_view"),
        gte(analytics_events.created_at, from),
        lte(analytics_events.created_at, to),
      ),
    );

  const adoptions = await db
    .select({
      count: sql<number>`count(*) filter (where (${analytics_events.payload}->>'adopted')::text = 'true')`,
    })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.event_type, "adoption"),
        gte(analytics_events.created_at, from),
        lte(analytics_events.created_at, to),
      ),
    );

  const dailyScans = await db
    .select({
      date: sql<string>`to_char(created_at AT TIME ZONE '${sql.raw(safeTz(tz))}', 'YYYY-MM-DD')`,
      count: count(),
    })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.event_type, "scan"),
        gte(analytics_events.created_at, from),
        lte(analytics_events.created_at, to),
      ),
    )
    .groupBy(sql`to_char(created_at AT TIME ZONE '${sql.raw(safeTz(tz))}', 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(created_at AT TIME ZONE '${sql.raw(safeTz(tz))}', 'YYYY-MM-DD')`);

  // Per-tenant breakdown
  const perTenant = await db
    .select({
      tenant_id: analytics_events.tenant_id,
      count: count(),
    })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.event_type, "scan"),
        gte(analytics_events.created_at, from),
        lte(analytics_events.created_at, to),
      ),
    )
    .groupBy(analytics_events.tenant_id)
    .orderBy(sql`count(*) desc`);

  return {
    scans: scans[0]?.count ?? 0,
    recommendations: recommendations[0]?.count ?? 0,
    adoptions: adoptions[0]?.count ?? 0,
    adoptionRate:
      recommendations[0]?.count
        ? (adoptions[0]?.count ?? 0) / recommendations[0].count
        : 0,
    dailyScans,
    perTenant,
  };
}

export async function getDashboardStats(
  tenantId: string,
  from: Date,
  to: Date,
  tz = "Europe/Paris",
) {
  const scans = await db
    .select({ count: count() })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.tenant_id, tenantId),
        eq(analytics_events.event_type, "scan"),
        gte(analytics_events.created_at, from),
        lte(analytics_events.created_at, to),
      ),
    );

  const recommendations = await db
    .select({ count: count() })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.tenant_id, tenantId),
        eq(analytics_events.event_type, "recommend_view"),
        gte(analytics_events.created_at, from),
        lte(analytics_events.created_at, to),
      ),
    );

  const adoptions = await db
    .select({
      count: sql<number>`count(*) filter (where (${analytics_events.payload}->>'adopted')::text = 'true')`,
    })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.tenant_id, tenantId),
        eq(analytics_events.event_type, "adoption"),
        gte(analytics_events.created_at, from),
        lte(analytics_events.created_at, to),
      ),
    );

  const languageDistribution = await db
    .select({
      language: analytics_events.language,
      count: count(),
    })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.tenant_id, tenantId),
        eq(analytics_events.event_type, "scan"),
        gte(analytics_events.created_at, from),
        lte(analytics_events.created_at, to),
      ),
    )
    .groupBy(analytics_events.language);

  const modeDistribution = await db
    .select({
      mode: sql<string>`payload->>'mode'`,
      count: count(),
    })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.tenant_id, tenantId),
        eq(analytics_events.event_type, "recommend_view"),
        gte(analytics_events.created_at, from),
        lte(analytics_events.created_at, to),
      ),
    )
    .groupBy(sql`payload->>'mode'`);

  // Daily scan trend
  const dailyScans = await db
    .select({
      date: sql<string>`to_char(created_at AT TIME ZONE '${sql.raw(safeTz(tz))}', 'YYYY-MM-DD')`,
      count: count(),
    })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.tenant_id, tenantId),
        eq(analytics_events.event_type, "scan"),
        gte(analytics_events.created_at, from),
        lte(analytics_events.created_at, to),
      ),
    )
    .groupBy(sql`to_char(created_at AT TIME ZONE '${sql.raw(safeTz(tz))}', 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(created_at AT TIME ZONE '${sql.raw(safeTz(tz))}', 'YYYY-MM-DD')`);

  // Culture match count (FR37)
  const cultureMatches = await db
    .select({ count: count() })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.tenant_id, tenantId),
        eq(analytics_events.event_type, "culture_match"),
        gte(analytics_events.created_at, from),
        lte(analytics_events.created_at, to),
      ),
    );

  // Share events
  const shares = await db
    .select({ count: count() })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.tenant_id, tenantId),
        eq(analytics_events.event_type, "share"),
        gte(analytics_events.created_at, from),
        lte(analytics_events.created_at, to),
      ),
    );

  // Daily adoption trend (FR44)
  const dailyAdoptions = await db
    .select({
      date: sql<string>`to_char(created_at AT TIME ZONE '${sql.raw(safeTz(tz))}', 'YYYY-MM-DD')`,
      total: count(),
      adopted: sql<number>`count(*) filter (where payload->>'adopted' = 'true')`,
    })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.tenant_id, tenantId),
        eq(analytics_events.event_type, "adoption"),
        gte(analytics_events.created_at, from),
        lte(analytics_events.created_at, to),
      ),
    )
    .groupBy(sql`to_char(created_at AT TIME ZONE '${sql.raw(safeTz(tz))}', 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(created_at AT TIME ZONE '${sql.raw(safeTz(tz))}', 'YYYY-MM-DD')`);

  // Dwell time distribution (FR45)
  const dwellDistribution = await db
    .select({
      bucket: sql<string>`case
        when (payload->>'seconds')::int < 10 then '<10s'
        when (payload->>'seconds')::int < 30 then '10-30s'
        when (payload->>'seconds')::int < 60 then '30-60s'
        when (payload->>'seconds')::int < 120 then '1-2min'
        else '2min+'
      end`,
      count: count(),
    })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.tenant_id, tenantId),
        eq(analytics_events.event_type, "dwell"),
        gte(analytics_events.created_at, from),
        lte(analytics_events.created_at, to),
      ),
    )
    .groupBy(sql`case
      when (payload->>'seconds')::int < 10 then '<10s'
      when (payload->>'seconds')::int < 30 then '10-30s'
      when (payload->>'seconds')::int < 60 then '30-60s'
      when (payload->>'seconds')::int < 120 then '1-2min'
      else '2min+'
    end`);

  // Wishlist heart events — per-dish breakdown
  const wishlistHearts = await db
    .select({
      dishId: sql<string>`payload->>'dishId'`,
      count: count(),
    })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.tenant_id, tenantId),
        eq(analytics_events.event_type, "wishlist_heart"),
        gte(analytics_events.created_at, from),
        lte(analytics_events.created_at, to),
      ),
    )
    .groupBy(sql`payload->>'dishId'`)
    .orderBy(sql`count(*) desc`);

  const totalHearts = await db
    .select({ count: count() })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.tenant_id, tenantId),
        eq(analytics_events.event_type, "wishlist_heart"),
        gte(analytics_events.created_at, from),
        lte(analytics_events.created_at, to),
      ),
    );

  // Mode switch count (FR46)
  const modeSwitches = await db
    .select({ count: count() })
    .from(analytics_events)
    .where(
      and(
        eq(analytics_events.tenant_id, tenantId),
        eq(analytics_events.event_type, "mode_switch"),
        gte(analytics_events.created_at, from),
        lte(analytics_events.created_at, to),
      ),
    );

  return {
    scans: Number(scans[0]?.count ?? 0),
    recommendations: Number(recommendations[0]?.count ?? 0),
    adoptions: Number(adoptions[0]?.count ?? 0),
    adoptionRate:
      Number(recommendations[0]?.count)
        ? Number(adoptions[0]?.count ?? 0) / Number(recommendations[0].count)
        : 0,
    cultureMatches: Number(cultureMatches[0]?.count ?? 0),
    cultureMatchRate:
      Number(scans[0]?.count)
        ? Number(cultureMatches[0]?.count ?? 0) / Number(scans[0].count)
        : 0,
    modeSwitches: Number(modeSwitches[0]?.count ?? 0),
    modeSwitchRate:
      Number(scans[0]?.count)
        ? Number(modeSwitches[0]?.count ?? 0) / Number(scans[0].count)
        : 0,
    shares: Number(shares[0]?.count ?? 0),
    totalHearts: Number(totalHearts[0]?.count ?? 0),
    wishlistHearts,
    languageDistribution,
    modeDistribution,
    dailyScans,
    dailyAdoptions,
    dwellDistribution,
  };
}

