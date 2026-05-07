import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isFounder } from "@/lib/roles";
import { getTenantsByOwnerId, getAllTenants } from "@/lib/db/queries/tenants";
import { getGlobalStats, getActiveTenantsStats } from "@/lib/db/queries/analytics";
import { getGlobalLlmUsage } from "@/lib/db/queries/llm-usage";
import { getAllUsersWithTenants } from "@/lib/db/queries/users";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/auth-schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { ApproveButton } from "@/components/admin/ApproveButton";

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

  // Founder sees global dashboard; owner sees their restaurant list
  if (founder) {
    return <FounderDashboard />;
  }

  const restaurants = await getTenantsByOwnerId(session.user.id);

  // If owner has exactly one restaurant, go directly to its dashboard
  if (restaurants.length === 1) {
    redirect(`/admin/${restaurants[0].slug}`);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Restaurants</h1>
        <Link
          href="/admin/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Add Restaurant
        </Link>
      </div>

      {restaurants.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-lg text-muted-foreground">No restaurants yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first restaurant to get started with CarteAI.
          </p>
          <Link
            href="/admin/new"
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Restaurant
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
async function FounderDashboard() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [allTenants, globalStats, activeStats, llmUsage, usersWithTenants] = await Promise.all([
    getAllTenants(),
    getGlobalStats(thirtyDaysAgo, now),
    getActiveTenantsStats(thirtyDaysAgo, now),
    getGlobalLlmUsage(),
    getAllUsersWithTenants(),
  ]);

  const dailyData = globalStats.dailyScans.map((d) => ({
    date: d.date.slice(5),
    scans: d.count,
  }));

  // Map tenant_id → name for the per-tenant table
  const tenantMap = new Map(allTenants.map((t) => [t.id, t]));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Founder Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Global overview &middot; Last 30 days
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + New Restaurant
          </Link>
          <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-400">
            Founder
          </span>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GCard label="Total Restaurants" value={allTenants.length} />
        <GCard label="Total Scans" value={globalStats.scans} />
        <GCard label="Recommendations" value={globalStats.recommendations} />
        <GCard
          label="Adoption Rate"
          value={`${(globalStats.adoptionRate * 100).toFixed(1)}%`}
          subtitle={`${globalStats.adoptions} adoptions`}
        />
      </div>

      {/* Business Health + LLM */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GCard label="DAU (Restaurants)" value={activeStats.dau} />
        <GCard label="WAU (Restaurants)" value={activeStats.wau} />
        <GCard
          label="Avg Scans / Restaurant"
          value={activeStats.avgDailyScansPerTenant}
        />
        <GCard
          label="LLM Cost (month)"
          value={`$${(llmUsage.cost_cents / 100).toFixed(2)}`}
          subtitle={`${llmUsage.call_count} calls · ${llmUsage.token_count} tokens`}
        />
      </div>

      {/* Daily scan trend (simple table — no client chart dependency) */}
      {dailyData.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">
            Daily Scans (last 30 days)
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
            Restaurants ({allTenants.length})
          </h3>
          <Link
            href="/admin/new"
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
          >
            + Add
          </Link>
        </div>
        <div className="divide-y">
          {globalStats.perTenant.map((row) => {
            const t = tenantMap.get(row.tenant_id);
            return (
              <Link
                key={row.tenant_id}
                href={`/admin/${t?.slug ?? row.tenant_id}`}
                className="group flex items-center justify-between px-4 py-3 hover:bg-muted"
              >
                <div>
                  <p className="text-sm font-medium">
                    {t?.name ?? row.tenant_id}
                  </p>
                  {t?.cuisine_type && (
                    <p className="text-xs capitalize text-muted-foreground">
                      {t.cuisine_type.replace(/_/g, " ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-foreground">
                    {row.count} scans
                  </span>
                  <span className="text-xs text-muted-foreground group-hover:text-emerald-600">
                    Manage →
                  </span>
                </div>
              </Link>
            );
          })}
          {/* Show restaurants with zero scans */}
          {allTenants
            .filter((t) => !globalStats.perTenant.some((r) => r.tenant_id === t.id))
            .map((t) => (
              <Link
                key={t.id}
                href={`/admin/${t.slug}`}
                className="group flex items-center justify-between px-4 py-3 hover:bg-muted"
              >
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  {t.cuisine_type && (
                    <p className="text-xs capitalize text-muted-foreground">
                      {t.cuisine_type.replace(/_/g, " ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">0 scans</span>
                  <span className="text-xs text-muted-foreground group-hover:text-emerald-600">
                    Manage →
                  </span>
                </div>
              </Link>
            ))}
          {allTenants.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No restaurants yet
            </p>
          )}
        </div>
      </div>

      {/* User management */}
      <div className="mt-6 rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            Users ({usersWithTenants.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">User</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Restaurant</th>
                <th className="px-4 py-2 font-medium">Registered</th>
                <th className="px-4 py-2 font-medium">Action</th>
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
                          Email verified
                        </span>
                      ) : (
                        <span className="inline-block w-fit rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                          Email unverified
                        </span>
                      )}
                      {u.approved ? (
                        <span className="inline-block w-fit rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-block w-fit rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
                          Pending approval
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
                      <span className="text-xs text-muted-foreground">No restaurant</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {u.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <ApproveButton userId={u.id} approved={u.approved} />
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
