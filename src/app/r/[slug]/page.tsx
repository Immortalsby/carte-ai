import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenantBySlug } from "@/lib/db/queries/tenants";
import { getPublishedMenu } from "@/lib/db/queries/menus";
import type { RestaurantMenu } from "@/types/menu";
import { getPlanStatus } from "@/lib/trial";
import { CustomerExperience } from "@/components/customer/CustomerExperience";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return {};
  const cuisine = tenant.cuisine_type?.replace(/_/g, " ") ?? "";
  const title = `${tenant.name} | CarteAI`;
  const description = cuisine
    ? `Browse the menu of ${tenant.name} (${cuisine}) — AI-powered recommendations in your language.`
    : `Browse the menu of ${tenant.name} — AI-powered recommendations in your language.`;
  return {
    title,
    description,
    openGraph: { title, description },
  };
}

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const menu = await getPublishedMenu(tenant.id);
  const menuData = menu?.payload as RestaurantMenu | null;

  return (
    <main
      className="h-full overflow-y-auto overscroll-none bg-carte-bg"
      data-cuisine={tenant.cuisine_type ?? undefined}
    >
      <div className="mx-auto max-w-lg md:max-w-3xl px-4 py-6">
      {menuData && menuData.dishes.length > 0 ? (
        <CustomerExperience
          menu={menuData}
          tenantId={tenant.id}
          cuisineType={tenant.cuisine_type}
          rating={tenant.rating}
          address={tenant.address}
          planStatus={getPlanStatus(tenant)}
          allowDrinksOnly={
            ((tenant.settings as Record<string, unknown> | null)?.allow_drinks_only as boolean) ?? true
          }
          googleMapsUrl={
            ((tenant.settings as Record<string, unknown> | null)?.google_maps_url as string) || undefined
          }
          enableReviewNudge={
            ((tenant.settings as Record<string, unknown> | null)?.enable_review_nudge as boolean) ?? false
          }
          addressCountry={
            ((tenant.settings as Record<string, unknown> | null)?.address_country as string) || undefined
          }
        />
      ) : (
        <>
          <header className="text-center">
            <h1 className="text-2xl font-bold text-carte-text">{tenant.name}</h1>
            {tenant.cuisine_type && (
              <p className="mt-1 text-sm capitalize text-carte-text-muted">
                {tenant.cuisine_type.replace(/_/g, " ")}
              </p>
            )}
          </header>
          <section className="mt-12 text-center text-carte-text-dim">
            <p>Menu coming soon</p>
          </section>
        </>
      )}

      {/* Allergen disclaimer + contact footer moved into CustomerExperience for i18n */}
      </div>
    </main>
  );
}
