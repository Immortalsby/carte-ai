import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isFounder } from "@/lib/roles";
import { getTenantsByOwnerId, getAllTenants } from "@/lib/db/queries/tenants";
import { getGlobalStats, getActiveTenantsStats } from "@/lib/db/queries/analytics";
import { getGlobalLlmUsage } from "@/lib/db/queries/llm-usage";
import { getAllUsersWithTenants } from "@/lib/db/queries/users";
import { getAllReferralStats } from "@/lib/db/queries/referrals";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/auth-schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ApproveButton } from "@/components/admin/ApproveButton";
import { DeleteUserButton } from "@/components/admin/DeleteUserButton";
import { AssignOwnerButton } from "@/components/admin/AssignOwnerButton";
import { detectAdminLocale, getAdminDict, type AdminLocale } from "@/lib/admin-i18n";
import { TzCookie } from "@/components/admin/TzCookie";

async function getLocale(): Promise<AdminLocale> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  return detectAdminLocale(
    cookieStore.get("admin_locale")?.value,
    headerStore.get("accept-language"),
  );
}

export default async function AdminIndexPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const founder = isFounder(session.user.email);

  // Check approval status (founders bypass)
  if (!founder) {
    const [row] = await db
      .select({ approved: userTable.approved })
      .from(userTable)
      .where(eq(userTable.id, session.user.id));
    if (!row?.approved) {
      redirect("/welcome");
    }
  }

  const locale = await getLocale();
  const t = getAdminDict(locale);

  // Founder sees global dashboard; owner sees their restaurant list
  if (founder) {
    return <FounderDashboard locale={locale} founderId={session.user.id} />;
  }

  const restaurants = await getTenantsByOwnerId(session.user.id);

  // If owner has exactly one restaurant, go directly to its dashboard
  if (restaurants.length === 1) {
    redirect(`/admin/${restaurants[0].slug}`);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.myRestaurants}</h1>
        <Link
          href="/admin/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t.addRestaurant}
        </Link>
      </div>

      {restaurants.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-lg text-muted-foreground">{t.noRestaurantsYet}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.noRestaurantsDesc}
          </p>
          <Link
            href="/admin/new"
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t.createRestaurant}
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {restaurants.map((r) => (
            <Link
              key={r.id}
              href={`/admin/${r.slug}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div>
                <p className="font-semibold">{r.name}</p>
                <p className="text-sm text-muted-foreground">
                  /r/{r.slug}
                  {r.cuisine_type && (
                    <span className="ml-2 capitalize">
                      &middot; {r.cuisine_type.replace(/_/g, " ")}
                    </span>
                  )}
                </p>
              </div>
              <span className="text-sm text-muted-foreground">&rarr;</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

/** Founder-only global dashboard — cross-tenant overview (FR40) */
async function FounderDashboard({ locale, founderId }: { locale: AdminLocale; founderId: string }) {
  const t = getAdminDict(locale);
  const cookieStore = await cookies();
  const tz = cookieStore.get("tz")?.value || "Europe/Paris";
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [allTenants, globalStats, activeStats, llmUsage, usersWithTenants, referralStats] = await Promise.all([
    getAllTenants(),
    getGlobalStats(thirtyDaysAgo, now, tz),
    getActiveTenantsStats(thirtyDaysAgo, now),
    getGlobalLlmUsage(),
    getAllUsersWithTenants(),
    getAllReferralStats(),
  ]);

  const dailyData = globalStats.dailyScans.map((d) => ({
    date: d.date.slice(5),
    scans: d.count,
  }));

  // Map tenant_id → name for the per-tenant table
  const tenantMap = new Map(allTenants.map((tn) => [tn.id, tn]));

  // Eligible users for owner assignment: verified + approved
  const eligibleUsers = usersWithTenants
    .filter((u) => u.emailVerified && u.approved)
    .map((u) => ({ id: u.id, name: u.name, email: u.email }));

  // Build owner map: user ID → user info
  const ownerMap = new Map(usersWithTenants.map((u) => [u.id, u]));

  // A restaurant is "unowned" if its owner is the founder or the owner doesn't exist in the user list
  const isUnowned = (ownerId: string) =>
    ownerId === founderId || !ownerMap.has(ownerId);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <TzCookie />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.founderDashboardTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.globalOverview} &middot; {t.last30Days}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t.newRestaurant}
          </Link>
          <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-400">
            Founder
          </span>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GCard label={t.totalRestaurants} value={allTenants.length} />
        <GCard label={t.totalScans} value={globalStats.scans} />
        <GCard label={t.recommendations} value={globalStats.recommendations} />
        <GCard
          label={t.adoptionRate}
          value={`${(globalStats.adoptionRate * 100).toFixed(1)}%`}
          subtitle={`${globalStats.adoptions} ${t.adoptions.toLowerCase()}`}
        />
      </div>

      {/* Business Health + LLM */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GCard label={t.dauRestaurants} value={activeStats.dau} />
        <GCard label={t.wauRestaurants} value={activeStats.wau} />
        <GCard
          label={t.avgScansPerRestaurant}
          value={activeStats.avgDailyScansPerTenant}
        />
        <GCard
          label={t.llmCostMonth}
          value={`$${(llmUsage.cost_cents / 100).toFixed(2)}`}
          subtitle={`${llmUsage.call_count} calls · ${llmUsage.token_count} tokens`}
        />
      </div>

      {/* Daily scan trend */}
      {dailyData.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">
            {t.dailyScans30}
          </h3>
          <div className="mt-3 flex h-32 items-end gap-px">
            {dailyData.map((d) => {
              const max = Math.max(...dailyData.map((x) => x.scans), 1);
              const pct = (d.scans / max) * 100;
              return (
                <div
                  key={d.date}
                  className="flex-1 rounded-t bg-emerald-400"
                  style={{ height: `${Math.max(pct, 2)}%` }}
                  title={`${d.date}: ${d.scans}`}
                />
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{dailyData[0]?.date}</span>
            <span>{dailyData[dailyData.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Per-restaurant breakdown */}
      <div className="mt-6 rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            {t.restaurants} ({allTenants.length})
          </h3>
          <Link
            href="/admin/new"
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
          >
            {t.add}
          </Link>
        </div>
        <div className="divide-y">
          {globalStats.perTenant.map((row) => {
            const tn = tenantMap.get(row.tenant_id);
            const unowned = tn ? isUnowned(tn.owner_id) : false;
            const owner = tn ? ownerMap.get(tn.owner_id) : undefined;
            return (
              <div key={row.tenant_id} className="group flex items-center justify-between px-4 py-3 hover:bg-muted">
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/${tn?.slug ?? row.tenant_id}`} className="text-sm font-medium hover:text-emerald-600">
                    {tn?.name ?? row.tenant_id}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {tn?.cuisine_type && (
                      <span className="capitalize">{tn.cuisine_type.replace(/_/g, " ")}</span>
                    )}
                    {owner && !unowned && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                        {owner.name}
                      </span>
                    )}
                    {unowned && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        No owner
                      </span>
                    )}
                  </div>
                  {unowned && tn && (
                    <div className="mt-1.5">
                      <AssignOwnerButton tenantId={tn.id} tenantName={tn.name} eligibleUsers={eligibleUsers} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-foreground">
                    {row.count} {t.scans.toLowerCase()}
                  </span>
                  <Link href={`/admin/${tn?.slug ?? row.tenant_id}`} className="text-xs text-muted-foreground hover:text-emerald-600">
                    {t.manage} →
                  </Link>
                </div>
              </div>
            );
          })}
          {/* Show restaurants with zero scans */}
          {allTenants
            .filter((tn) => !globalStats.perTenant.some((r) => r.tenant_id === tn.id))
            .map((tn) => {
              const unowned = isUnowned(tn.owner_id);
              const owner = ownerMap.get(tn.owner_id);
              return (
                <div key={tn.id} className="group flex items-center justify-between px-4 py-3 hover:bg-muted">
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/${tn.slug}`} className="text-sm font-medium hover:text-emerald-600">
                      {tn.name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {tn.cuisine_type && (
                        <span className="capitalize">{tn.cuisine_type.replace(/_/g, " ")}</span>
                      )}
                      {owner && !unowned && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                          {owner.name}
                        </span>
                      )}
                      {unowned && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                          No owner
                        </span>
                      )}
                    </div>
                    {unowned && (
                      <div className="mt-1.5">
                        <AssignOwnerButton tenantId={tn.id} tenantName={tn.name} eligibleUsers={eligibleUsers} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">0 {t.scans.toLowerCase()}</span>
                    <Link href={`/admin/${tn.slug}`} className="text-xs text-muted-foreground hover:text-emerald-600">
                      {t.manage} →
                    </Link>
                  </div>
                </div>
              );
            })}
          {allTenants.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t.noRestaurantsYet}
            </p>
          )}
        </div>
      </div>

      {/* User management */}
      <div className="mt-6 rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            {t.users} ({usersWithTenants.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">{t.userCol}</th>
                <th className="px-4 py-2 font-medium">{t.emailCol}</th>
                <th className="px-4 py-2 font-medium">{t.statusCol}</th>
                <th className="px-4 py-2 font-medium">{t.restaurantCol}</th>
                <th className="px-4 py-2 font-medium">{t.registeredCol}</th>
                <th className="px-4 py-2 font-medium">Referred by</th>
                <th className="px-4 py-2 font-medium">Invites</th>
                <th className="px-4 py-2 font-medium">{t.actionCol}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {usersWithTenants.map((u) => (
                <tr key={u.id} className="hover:bg-muted">
                  <td className="px-4 py-2.5 font-medium">{u.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-col gap-1">
                      {u.emailVerified ? (
                        <span className="inline-block w-fit rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          {t.emailVerified}
                        </span>
                      ) : (
                        <span className="inline-block w-fit rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                          {t.emailUnverified}
                        </span>
                      )}
                      {u.approved ? (
                        <span className="inline-block w-fit rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          {t.approved}
                        </span>
                      ) : (
                        <span className="inline-block w-fit rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
                          {t.pendingApproval}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {u.tenants.length > 0 ? (
                      u.tenants.map((tenant) => (
                        <Link
                          key={tenant.id}
                          href={`/admin/${tenant.slug}`}
                          className="mr-2 inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                        >
                          {tenant.name}
                        </Link>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">{t.noRestaurant}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {u.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {referralStats.get(u.id)?.referredByName ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {(() => {
                      const rs = referralStats.get(u.id);
                      if (!rs || rs.totalInvited === 0) return <span className="text-muted-foreground">0</span>;
                      return (
                        <span className="text-foreground">
                          <strong>{rs.qualifiedInvited}</strong>
                          <span className="text-muted-foreground">/{rs.totalInvited}</span>
                          {rs.permanentFree && (
                            <span className="ml-1 rounded-full bg-green-500/15 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
                              FREE
                            </span>
                          )}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <ApproveButton userId={u.id} approved={u.approved} />
                      <DeleteUserButton userId={u.id} userName={u.name} tenantCount={u.tenants.length} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function GCard({
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
