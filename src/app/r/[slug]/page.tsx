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
      className="mx-auto max-w-lg px-4 py-6 bg-carte-bg min-h-screen"
      data-cuisine={tenant.cuisine_type ?? undefined}
    >
      {menuData && menuData.dishes.length > 0 ? (
        <CustomerExperience
          menu={menuData}
          tenantId={tenant.id}
          cuisineType={tenant.cuisine_type}
          rating={tenant.rating}
          address={tenant.address}
          googlePlaceId={tenant.google_place_id}
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

      {/* Allergen disclaimer — always visible per FR29, WCAG role="alert" */}
      <footer
        role="alert"
        className="mt-8 rounded-lg border border-carte-border bg-carte-surface p-3 text-center text-xs text-carte-warning"
      >
        Allergen information is provided for reference only. Please confirm with
        your server before ordering.
      </footer>

      {/* Contact email (FR57) */}
      <p className="mt-4 text-center text-[10px] text-carte-text-dim">
        Powered by CarteAI &middot;{" "}
        <a
          href="mailto:contact@carte-ai.link"
          className="underline underline-offset-2 hover:text-carte-text-muted"
        >
          contact@carte-ai.link
        </a>
      </p>
    </main>
  );
}
