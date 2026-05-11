import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { isFounder } from "@/lib/roles";
import { getTenantBySlug } from "@/lib/db/queries/tenants";
import { getDashboardStats } from "@/lib/db/queries/analytics";
import { getLlmUsage, getLlmProviderStats } from "@/lib/db/queries/llm-usage";
import { getPublishedMenu } from "@/lib/db/queries/menus";
import type { RestaurantMenu } from "@/types/menu";
import { detectAdminLocale, getAdminDict } from "@/lib/admin-i18n";
import { ListBullets, ChartLineUp, Image, LinkSimple } from "@phosphor-icons/react/dist/ssr";

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
  const tAny = t as unknown as Record<string, string>;

  const tz = cookieStore.get("tz")?.value || "Europe/Paris";
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const tenantSettings = (tenant.settings ?? {}) as Record<string, unknown>;
  const llmQuotaCalls = (tenantSettings.llm_quota_calls as number) || LLM_QUOTA_CALLS;

  const [stats, llmUsage, llmProviderStats, publishedMenu] = await Promise.all([
    getDashboardStats(tenant.id, thirtyDaysAgo, now, tz),
    founder ? getLlmUsage(tenant.id) : Promise.resolve({ call_count: 0, cost_cents: 0 }),
    founder ? getLlmProviderStats(tenant.id, thirtyDaysAgo, now) : Promise.resolve({ totalCount: 0, fallbackCount: 0, providerDistribution: [] }),
    getPublishedMenu(tenant.id),
  ]);

  const menuData = publishedMenu?.payload as RestaurantMenu | null;
  const totalDishes = menuData?.dishes.length ?? 0;
  const dishesWithImages = menuData?.dishes.filter((d) => !!d.imageUrl).length ?? 0;
  const dishesNoImages = totalDishes - dishesWithImages;
  const hasActivity = stats.scans > 0;

  const llmQuotaPct = Math.min(
    Math.round((llmUsage.call_count / llmQuotaCalls) * 100),
    100,
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">{t.dashboard}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{tAny.dashOverviewTitle}</p>

      {/* Menu overview cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {menuData ? (
          <>
            <OverviewCard
              label={tAny.dashTotalDishes}
              value={totalDishes}
              accent="primary"
            />
            <OverviewCard
              label={tAny.dashDishesWithImages}
              value={dishesWithImages}
              accent="green"
            />
            <OverviewCard
              label={tAny.dashDishesNoImages}
              value={dishesNoImages}
              accent={dishesNoImages > 0 ? "amber" : "green"}
            />
            <OverviewCard
              label={t.scans}
              value={stats.scans}
              subtitle={tAny.dashLast30Summary}
              accent="primary"
            />
          </>
        ) : (
          <div className="col-span-full rounded-xl border border-dashed border-amber-300 bg-amber-50 p-6 text-center dark:border-amber-700 dark:bg-amber-900/20">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {tAny.dashMenuNotPublished}
            </p>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-muted-foreground">{tAny.dashQuickActions}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            href={`/admin/${slug}/menu`}
            icon={<ListBullets weight="duotone" className="h-5 w-5" />}
            label={tAny.dashEditMenu}
          />
          <QuickAction
            href={`/r/${slug}`}
            icon={<LinkSimple weight="duotone" className="h-5 w-5" />}
            label={tAny.dashViewCustomerPage}
            external
          />
          <QuickAction
            href={`/admin/${slug}/poster`}
            icon={<Image weight="duotone" className="h-5 w-5" />}
            label={tAny.dashCreatePoster}
          />
          <QuickAction
            href={`/admin/${slug}/analytics`}
            icon={<ChartLineUp weight="duotone" className="h-5 w-5" />}
            label={tAny.dashViewAnalytics}
          />
        </div>
      </div>

      {/* Compact 30-day stats */}
      {hasActivity ? (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-muted-foreground">{tAny.dashLast30Summary}</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label={t.scans} value={stats.scans} />
            <StatCard label={t.recommendations} value={stats.recommendations} />
            <StatCard
              label={t.adoptionRate}
              value={`${(stats.adoptionRate * 100).toFixed(1)}%`}
              subtitle={`${stats.adoptions} ${t.adoptions}`}
            />
            <StatCard label={t.shares} value={stats.shares} />
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-border p-6 text-center">
          <p className="text-sm text-muted-foreground">{tAny.dashNoActivity}</p>
        </div>
      )}

      {/* Founder-only: LLM usage */}
      {founder && (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t.llmCostMonth}
              value={`$${(llmUsage.cost_cents / 100).toFixed(2)}`}
              subtitle={`${llmUsage.call_count} ${t.calls}`}
            />
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
                const labels: Record<string, string> = { openai: "OpenAI", gemini: "Gemini" };
                const names = llmProviderStats.providerDistribution
                  .filter((p) => !degraded.has(p.name))
                  .map((p) => labels[p.name] || p.name);
                return names.length > 0 ? names.join(", ") : "—";
              })()}
            />
          </div>

          {/* LLM Quota Progress Bar */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{t.llmMonthlyQuota}</h3>
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
                    llmQuotaPct >= 80 ? "#ef4444" : llmQuotaPct >= 50 ? "#f59e0b" : "#10b981",
                }}
              />
            </div>
            {llmQuotaPct >= 80 && (
              <p className="mt-1 text-xs text-red-600">{t.approachingQuota}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewCard({
  label,
  value,
  subtitle,
  accent = "primary",
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  accent?: "primary" | "green" | "amber";
}) {
  const colors = {
    primary: "border-l-primary",
    green: "border-l-emerald-500",
    amber: "border-l-amber-500",
  };
  return (
    <div className={`rounded-xl border border-border border-l-4 ${colors[accent]} bg-card p-4 shadow-sm`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  external,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  external?: boolean;
}) {
  const cls =
    "flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {icon}
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {icon}
      {label}
    </Link>
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
