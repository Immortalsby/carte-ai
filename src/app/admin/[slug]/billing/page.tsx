import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isFounder } from "@/lib/roles";
import { getTenantBySlug } from "@/lib/db/queries/tenants";
import { isTrialExpired } from "@/lib/trial";
import { BillingSection } from "@/components/admin/BillingSection";
import { BillingFeedback } from "@/components/admin/BillingFeedback";
import { ReferralSection } from "@/components/admin/ReferralSection";
import { detectAdminLocale, getAdminDict } from "@/lib/admin-i18n";

export default async function BillingPage({
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
  const localeCookie = cookieStore.get("admin_locale")?.value;
  const headerStore = await headers();
  const acceptLang = headerStore.get("accept-language");
  const locale = detectAdminLocale(localeCookie, acceptLang);
  const t = getAdminDict(locale);

  return (
    <div>
      <BillingFeedback labels={{ billingSuccess: t.billingSuccess, billingCancelled: t.billingCancelled }} />
      <h1 className="text-2xl font-bold">{t.billingTitle}</h1>

      <div className="mt-6 max-w-2xl">
        <BillingSection
          slug={slug}
          currentPlan={tenant.plan}
          hasStripeSubscription={!!tenant.stripe_subscription_id}
          isFounder={founder}
          isExpired={isTrialExpired(tenant)}
          labels={{
            billingTitle: t.billingTitle,
            currentPlan: t.currentPlan,
            subscribeTo: t.subscribeTo,
            manageBilling: t.manageBilling,
            billingFree: t.billingFree,
          }}
          locale={locale}
        />
      </div>

      <ReferralSection locale={locale} />
    </div>
  );
}
