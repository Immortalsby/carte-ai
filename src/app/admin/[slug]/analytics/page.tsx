import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isFounder } from "@/lib/roles";
import { getTenantBySlug } from "@/lib/db/queries/tenants";
import { getDashboardStats } from "@/lib/db/queries/analytics";
import { getLlmProviderStats } from "@/lib/db/queries/llm-usage";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { detectAdminLocale, getAdminDict } from "@/lib/admin-i18n";

export default async function AnalyticsPage({
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

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [stats, llmProviderStats] = await Promise.all([
    getDashboardStats(tenant.id, thirtyDaysAgo, now),
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
    date: d.date.slice(5),
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

  return (
    <div>
      <h1 className="text-2xl font-bold">{t.analyticsTitle}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.last30Days} &middot; {t.detailedBreakdown}</p>

      {/* Summary stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label={t.scans} value={stats.scans} />
        <MiniStat label={t.recommendationsViewed} value={stats.recommendations} />
        <MiniStat
          label={t.adoptionRate}
          value={`${(stats.adoptionRate * 100).toFixed(1)}%`}
          subtitle={`${stats.adoptions} ${t.adoptions}`}
        />
        <MiniStat label={t.shares} value={stats.shares} />
      </div>

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

function MiniStat({
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
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      {subtitle && <p className="mt-0.5 text-[10px] text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
