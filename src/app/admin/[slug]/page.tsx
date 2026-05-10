import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isFounder } from "@/lib/roles";
import { getTenantBySlug } from "@/lib/db/queries/tenants";
import { getDashboardStats } from "@/lib/db/queries/analytics";
import { getLlmUsage, getLlmProviderStats } from "@/lib/db/queries/llm-usage";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { detectAdminLocale, getAdminDict } from "@/lib/admin-i18n";

// LLM quota caps per tier (Phase 1: all POC)
const LLM_QUOTA_CALLS = 5000;

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const tenant = await getTenantBySlug(slug);
  if (!tenant) redirect("/login");

  const founder = isFounder(session.user.email);

  const cookieStore = await cookies();
  const locale = detectAdminLocale(
    cookieStore.get("admin_locale")?.value,
    (await headers()).get("accept-language"),
  );
  const t = getAdminDict(locale);

  const tz = cookieStore.get("tz")?.value || "Europe/Paris";
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const tenantSettings = (tenant.settings ?? {}) as Record<string, unknown>;
  const llmQuotaCalls = (tenantSettings.llm_quota_calls as number) || LLM_QUOTA_CALLS;

  const [stats, llmUsage, llmProviderStats] = await Promise.all([
    getDashboardStats(tenant.id, thirtyDaysAgo, now, tz),
    founder ? getLlmUsage(tenant.id) : Promise.resolve({ call_count: 0, cost_cents: 0 }),
    founder ? getLlmProviderStats(tenant.id, thirtyDaysAgo, now) : Promise.resolve({ totalCount: 0, fallbackCount: 0, providerDistribution: [] }),
  ]);

  const languageData = stats.languageDistribution.map((d) => ({
    name: d.language || "unknown",
    value: d.count,
  }));

  const modeData = stats.modeDistribution.map((d) => ({
    name: d.mode || "unknown",
    value: d.count,
  }));

  const dailyData = stats.dailyScans.map((d) => ({
    date: d.date.slice(5), // "MM-DD"
    scans: d.count,
  }));

  const adoptionData = stats.dailyAdoptions.map((d) => ({
    date: d.date.slice(5),
    rate: d.total > 0 ? Math.round((d.adopted / d.total) * 100) : 0,
  }));

  const dwellData = stats.dwellDistribution.map((d) => ({
    name: d.bucket,
    value: d.count,
  }));

  const llmQuotaPct = Math.min(
    Math.round((llmUsage.call_count / llmQuotaCalls) * 100),
    100
  );

  const lastUpdated = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.dashboard}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.last30Days}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {t.updated} {lastUpdated} &middot;{" "}
          <a href="" className="text-primary hover:underline">
            {t.refresh}
          </a>
        </p>
      </div>

      {/* Primary KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t.scans} value={stats.scans} />
        <StatCard label={t.recommendations} value={stats.recommendations} />
        <StatCard label={t.adoptions} value={stats.adoptions} />
        <StatCard
          label={t.adoptionRate}
          value={`${(stats.adoptionRate * 100).toFixed(1)}%`}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t.shares} value={stats.shares} />
        {founder && (
          <StatCard
            label={t.llmCostMonth}
            value={`$${(llmUsage.cost_cents / 100).toFixed(2)}`}
            subtitle={`${llmUsage.call_count} ${t.calls}`}
          />
        )}
      </div>

      {/* LLM Quota Progress Bar — founder only */}
      {founder && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              {t.llmMonthlyQuota}
            </h3>
            <span className="text-xs text-muted-foreground">
              {llmUsage.call_count} / {llmQuotaCalls} {t.calls}
            </span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${llmQuotaPct}%`,
                backgroundColor:
                  llmQuotaPct >= 80
                    ? "#ef4444"
                    : llmQuotaPct >= 50
                      ? "#f59e0b"
                      : "#10b981",
              }}
            />
          </div>
          {llmQuotaPct >= 80 && (
            <p className="mt-1 text-xs text-red-600">
              {t.approachingQuota}
            </p>
          )}
        </div>
      )}

      {/* LLM Provider & Degradation Stats — founder only (FR47) */}
      {founder && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <StatCard label={t.llmTotalRequests} value={llmProviderStats.totalCount} />
          <StatCard
            label={t.fallbackDegraded}
            value={llmProviderStats.fallbackCount}
            subtitle={
              llmProviderStats.totalCount > 0
                ? `${((llmProviderStats.fallbackCount / llmProviderStats.totalCount) * 100).toFixed(1)}% ${t.ofRequests}`
                : ""
            }
          />
          <StatCard
            label={t.providers}
            value={(() => {
              const degraded = new Set(["fallback", "local", "guardrail_fallback", "quota_exceeded"]);
              const labels: Record<string, string> = {
                openai: "OpenAI",
                gemini: "Gemini",
              };
              const names = llmProviderStats.providerDistribution
                .filter((p) => !degraded.has(p.name))
                .map((p) => labels[p.name] || p.name);
              return names.length > 0 ? names.join(", ") : "—";
            })()}
          />
        </div>
      )}

      <DashboardCharts
        languageDistribution={languageData}
        modeDistribution={modeData}
        dailyScans={dailyData}
        dailyAdoptions={adoptionData}
        dwellDistribution={dwellData}
        providerDistribution={founder ? llmProviderStats.providerDistribution : undefined}
        locale={locale}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
