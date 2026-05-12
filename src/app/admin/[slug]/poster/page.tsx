import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/db/queries/tenants";
import { isFounder } from "@/lib/roles";
import { PosterEditor } from "@/components/admin/PosterEditor";
import { detectAdminLocale } from "@/lib/admin-i18n";

export default async function PosterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const tenant = await getTenantBySlug(slug);
  const founder = session ? isFounder(session.user.email) : false;
  if (!tenant || (tenant.owner_id !== session.user.id && !founder)) redirect("/login");

  const cookieStore = await cookies();
  const locale = detectAdminLocale(
    cookieStore.get("admin_locale")?.value,
    (await headers()).get("accept-language"),
  );

  const url = `https://carte-ai.link/r/${slug}`;
  const qrCode = await QRCode.toDataURL(url, {
    margin: 1,
    width: 640,
    color: { dark: "#050507", light: "#ffffff" },
  });

  const tenantSettings = (tenant.settings as Record<string, unknown> | null) ?? {};

  return (
    <PosterEditor
      restaurantName={tenant.name}
      restaurantNameSecondary={(tenantSettings.name_secondary as string) || ""}
      phone={(tenantSettings.phone as string) || ""}
      businessHours={(tenantSettings.business_hours as string) || ""}
      cuisineType={tenant.cuisine_type || ""}
      address={tenant.address || ""}
      slug={slug}
      qrCodeDataUrl={qrCode}
      qrUrl={url}
      locale={locale}
    />
  );
}
