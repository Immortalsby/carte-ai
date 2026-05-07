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
  const customerUrl = `https://carte-ai.link/r/${slug}`;

  // Build AI models info for display
  const tenantSettings = (tenant.settings as Record<string, unknown> | null) ?? {};
  const textProvider = (tenantSettings.llm_provider as string) || "auto";
  const textModel = (tenantSettings.llm_model as string) || "";
  const visionModel = (tenantSettings.vision_model as string) || "";
  const aiModels = {
    text: hasCloudLlm()
      ? {
          provider: textProvider === "auto" ? "Anthropic → OpenAI" : textProvider === "anthropic" ? "Anthropic" : "OpenAI",
          model: textModel || (textProvider === "openai" ? (process.env.OPENAI_MODEL || "gpt-4.1-mini") : (process.env.ANTHROPIC_MODEL === "OPUS" ? (process.env.ANTHROPIC_DEFAULT_OPUS_MODEL || "claude-opus-4-6") : (process.env.ANTHROPIC_MODEL || "claude-opus-4-6"))),
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

        {/* Display language */}
        <div className="mt-6">
          <AdminLocaleSelector
            current={locale}
            label={t.displayLanguage}
            browserDefaultLabel={t.browserDefault}
          />
        </div>

        <SettingsForm
          slug={slug}
          initialName={tenant.name}
          initialCuisineType={tenant.cuisine_type ?? ""}
          initialAddress={tenant.address ?? ""}
          initialAllowDrinksOnly={
            ((tenant.settings as Record<string, unknown> | null)?.allow_drinks_only as boolean) ?? true
          }
          initialLlmQuotaCalls={
            founder
              ? ((tenant.settings as Record<string, unknown> | null)?.llm_quota_calls as number) || 5000
              : undefined
          }
          aiModels={aiModels}
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

        <DeleteRestaurant
          slug={slug}
          restaurantName={tenant.name}
          locale={locale}
        />
      </div>
    </div>
  );
}
