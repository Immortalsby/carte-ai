import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { isFounder } from "@/lib/roles";
import { getTenantBySlug } from "@/lib/db/queries/tenants";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { detectAdminLocale, getAdminDict } from "@/lib/admin-i18n";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  const tenant = await getTenantBySlug(slug);
  if (!tenant) redirect("/login");

  const founder = isFounder(session.user.email);
  // Founders can access any restaurant; owners can only access their own
  if (!founder && tenant.owner_id !== session.user.id) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("admin_locale")?.value;
  const headerStore = await headers();
  const acceptLang = headerStore.get("accept-language");
  const locale = detectAdminLocale(localeCookie, acceptLang);
  const t = getAdminDict(locale);

  const navItems = [
    { href: "", label: t.dashboard, icon: "📊" },
    { href: "/menu", label: t.menu, icon: "📋" },
    { href: "/analytics", label: t.analytics, icon: "📈" },
    { href: "/poster", label: t.qrPoster, icon: "🖼️" },
    { href: "/settings", label: t.settings, icon: "⚙️" },
  ];

  const customerUrl = `/r/${slug}`;

  const themeLabels = { light: t.themeLight, dark: t.themeDark, system: t.themeSystem };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground lg:flex-row">
      {/* Desktop sidebar */}
      <nav className="hidden w-60 shrink-0 border-r border-border bg-muted/30 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-semibold">{tenant.name}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground capitalize">
            {tenant.cuisine_type?.replace(/_/g, " ")}
          </p>
        </div>

        <AdminSidebarNav slug={slug} items={navItems} />

        {/* Quick links at bottom */}
        <div className="border-t border-border p-3 space-y-2">
          <div className="px-1 pb-1">
            <ThemeToggle labels={themeLabels} />
          </div>
          {founder && (
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-purple-600 hover:bg-purple-500/10 dark:text-purple-400 font-medium"
            >
              <span>← </span>
              {t.founderDashboard}
            </Link>
          )}
          <Link
            href={customerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <span>🔗</span>
            {t.previewCustomerPage}
          </Link>
          <div className="px-3 py-2">
            <p className="text-[10px] text-muted-foreground truncate">{session.user.email}</p>
          </div>
          <Link
            href="/api/auth/sign-out"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 dark:text-red-400"
          >
            <span>🚪</span>
            {t.signOut}
          </Link>
        </div>
      </nav>

      {/* Mobile top bar + hamburger */}
      <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3 lg:hidden">
        <div>
          <h2 className="text-sm font-semibold">{tenant.name}</h2>
          <p className="text-[10px] text-muted-foreground capitalize">
            {tenant.cuisine_type?.replace(/_/g, " ")}
          </p>
        </div>
        <AdminMobileNav
          slug={slug}
          email={session.user.email ?? ""}
          navItems={navItems}
          themeLabels={themeLabels}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-6">{children}</main>
    </div>
  );
}
