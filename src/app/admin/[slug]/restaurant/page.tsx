import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isFounder } from "@/lib/roles";
import { getTenantBySlug } from "@/lib/db/queries/tenants";
import { RestaurantForm } from "@/components/admin/RestaurantForm";
import { detectAdminLocale, getAdminDict } from "@/lib/admin-i18n";

export default async function RestaurantPage({
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
  if (!founder && tenant.owner_id !== session.user.id) redirect("/login");

  const cookieStore = await cookies();
  const locale = detectAdminLocale(
    cookieStore.get("admin_locale")?.value,
    (await headers()).get("accept-language"),
  );
  const t = getAdminDict(locale);
  const tAny = t as unknown as Record<string, string>;

  const tenantSettings = (tenant.settings as Record<string, unknown> | null) ?? {};
  const customerUrl = `https://carte-ai.link/r/${slug}`;

  return (
    <div>
      <h1 className="text-2xl font-bold">{tAny.restaurantManagement}</h1>

      <div className="mt-6 max-w-2xl">
        {/* Customer link */}
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{t.customerMenuLink}</p>
          <p className="mt-1 font-mono text-sm text-emerald-600 dark:text-emerald-400">{customerUrl}</p>
          <a
            href={`/r/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-emerald-700 underline dark:text-emerald-300"
          >
            {t.preview} &rarr;
          </a>
        </div>

        <RestaurantForm
          slug={slug}
          initialName={tenant.name}
          initialNameSecondary={(tenantSettings.name_secondary as string) ?? ""}
          initialCuisineType={tenant.cuisine_type ?? ""}
          initialAddress={tenant.address ?? ""}
          initialStructuredAddress={
            tenantSettings.address_country ? {
              street: (tenantSettings.address_street as string) ?? "",
              city: (tenantSettings.address_city as string) ?? "",
              postal: (tenantSettings.address_postal as string) ?? "",
              country: (tenantSettings.address_country as string) ?? "FR",
            } : undefined
          }
          initialPhone={(tenantSettings.phone as string) ?? ""}
          initialBusinessHours={(tenantSettings.business_hours as string) ?? ""}
          initialAllowDrinksOnly={
            (tenantSettings.allow_drinks_only as boolean) ?? true
          }
          initialGoogleMapsLink={
            (tenantSettings.google_maps_url as string) ?? ""
          }
          initialEnableReviewNudge={
            (tenantSettings.enable_review_nudge as boolean) ?? false
          }
          initialReviewPromo={{
            enabled: (tenantSettings.review_promo_enabled as boolean) ?? false,
            clickable: (tenantSettings.review_promo_clickable as boolean) ?? true,
            source: ((tenantSettings.review_promo as Record<string, unknown>)?.source as string) ?? "",
            translations: ((tenantSettings.review_promo as Record<string, unknown>)?.translations as Record<string, string>) ?? {},
          }}
          locale={locale}
        />
      </div>
    </div>
  );
}
