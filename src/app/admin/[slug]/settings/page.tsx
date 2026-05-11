import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isFounder } from "@/lib/roles";
import { getTenantBySlug } from "@/lib/db/queries/tenants";
import { hasCloudLlm, hasGeminiVision } from "@/lib/llm";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { DeleteRestaurant } from "@/components/admin/DeleteRestaurant";
import { AdminLocaleSelector } from "@/components/admin/AdminLocaleSelector";
import { detectAdminLocale, getAdminDict } from "@/lib/admin-i18n";

export default async function SettingsPage({
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

  // Build AI models info for display
  const tenantSettings = (tenant.settings as Record<string, unknown> | null) ?? {};
  const textModel = (tenantSettings.llm_model as string) || "";
  const visionModel = (tenantSettings.vision_model as string) || "";
  const aiModels = {
    text: hasCloudLlm()
      ? {
          provider: "OpenAI",
          model: textModel || process.env.OPENAI_MODEL || "gpt-4.1-mini",
        }
      : null,
    vision: hasGeminiVision()
      ? { provider: "Google Gemini", model: visionModel || process.env.GEMINI_VISION_MODEL || "gemini-2.5-flash" }
      : null,
    imageGen: { provider: "Pollinations", model: "flux" },
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">{t.settingsTitle}</h1>

      <div className="mt-6 max-w-2xl">
        {/* Display language */}
        <div>
          <AdminLocaleSelector
            current={locale}
            label={t.displayLanguage}
            browserDefaultLabel={t.browserDefault}
          />
        </div>

        <SettingsForm
          slug={slug}
          initialLlmQuotaCalls={
            founder
              ? ((tenant.settings as Record<string, unknown> | null)?.llm_quota_calls as number) || 5000
              : undefined
          }
          aiModels={founder ? aiModels : undefined}
          isFounder={founder}
          initialLlmConfig={
            founder
              ? {
                  provider: ((tenant.settings as Record<string, unknown> | null)?.llm_provider as string) || "auto",
                  model: ((tenant.settings as Record<string, unknown> | null)?.llm_model as string) || "",
                }
              : undefined
          }
          initialVisionConfig={
            founder
              ? {
                  provider: "gemini",
                  model: visionModel,
                }
              : undefined
          }
          locale={locale}
        />

        {/* Delete restaurant — founder only */}
        {founder && (
          <DeleteRestaurant
            slug={slug}
            restaurantName={tenant.name}
            locale={locale}
          />
        )}
      </div>
    </div>
  );
}
