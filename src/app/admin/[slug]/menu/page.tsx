import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/db/queries/tenants";
import { getLatestMenu } from "@/lib/db/queries/menus";
import { detectAdminLocale } from "@/lib/admin-i18n";
import type { RestaurantMenu } from "@/types/menu";
import { MenuPage } from "./MenuPageClient";

export default async function MenuManagementPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const tenant = await getTenantBySlug(slug);
  if (!tenant) redirect("/login");

  const cookieStore = await cookies();
  const locale = detectAdminLocale(
    cookieStore.get("admin_locale")?.value,
    (await headers()).get("accept-language"),
  );

  const menu = await getLatestMenu(tenant.id);
  const menuData = menu?.payload as RestaurantMenu | null;

  return (
    <MenuPage
      menu={menuData}
      slug={slug}
      version={menu?.version ?? 1}
      cuisine={tenant.cuisine_type ?? undefined}
      locale={locale}
    />
  );
}
