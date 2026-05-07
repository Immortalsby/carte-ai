"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import type { AdminLocale } from "@/lib/admin-i18n";
import { getAdminDict } from "@/lib/admin-i18n";

interface LlmConfig {
  provider: string;
  model: string;
}

interface AiModelsInfo {
  text: { provider: string; model: string } | null;
  vision: { provider: string; model: string } | null;
  imageGen: { provider: string; model: string };
}

interface VisionConfig {
  provider: string;
  model: string;
}

interface SettingsFormProps {
  slug: string;
  initialName: string;
  initialCuisineType: string;
  initialAddress: string;
  initialAllowDrinksOnly?: boolean;
  initialLlmQuotaCalls?: number;
  initialLlmConfig?: LlmConfig;
  initialVisionConfig?: VisionConfig;
  aiModels?: AiModelsInfo;
  isFounder?: boolean;
  locale?: AdminLocale;
}

const cuisineOptions = [
  "chinese", "japanese", "japanese_fusion", "italian", "french",
  "indian", "thai", "mexican", "korean", "vietnamese",
  "mediterranean", "american", "other",
] as const;

const cuisineLabelKeys: Record<string, string> = {
  chinese: "cuisineChinese",
  japanese: "cuisineJapanese",
  japanese_fusion: "cuisineJapaneseFusion",
  italian: "cuisineItalian",
  french: "cuisineFrench",
  indian: "cuisineIndian",
  thai: "cuisineThai",
  mexican: "cuisineMexican",
  korean: "cuisineKorean",
  vietnamese: "cuisineVietnamese",
  mediterranean: "cuisineMediterranean",
  american: "cuisineAmerican",
  other: "cuisineOther",
};

export function SettingsForm({
  slug,
  initialName,
  initialCuisineType,
  initialAddress,
  initialAllowDrinksOnly = true,
  initialLlmQuotaCalls,
  initialLlmConfig,
  initialVisionConfig,
  aiModels,
  isFounder = false,
  locale = "en",
}: SettingsFormProps) {
  const t = getAdminDict(locale);
  const showLlmQuota = initialLlmQuotaCalls != null;
  const [name, setName] = useState(initialName);
  const [cuisineType, setCuisineType] = useState(initialCuisineType);
  const [address, setAddress] = useState(initialAddress);
  const [allowDrinksOnly, setAllowDrinksOnly] = useState(initialAllowDrinksOnly);
  const [llmQuotaCalls, setLlmQuotaCalls] = useState(initialLlmQuotaCalls ?? 5000);
  const [llmProvider, setLlmProvider] = useState(initialLlmConfig?.provider ?? "auto");
  const [llmModel, setLlmModel] = useState(initialLlmConfig?.model ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [visionModel, setVisionModel] = useState(initialVisionConfig?.model ?? "");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; model?: string; response?: string; error?: string; latencyMs?: number } | null>(null);
  const [visionTesting, setVisionTesting] = useState(false);
  const [visionTestResult, setVisionTestResult] = useState<{ success: boolean; model?: string; response?: string; error?: string; latencyMs?: number } | null>(null);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch(`/api/tenants/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          cuisine_type: cuisineType,
          address,
          settings: {
            allow_drinks_only: allowDrinksOnly,
            ...(showLlmQuota && {
              llm_quota_calls: llmQuotaCalls,
            }),
            ...(isFounder && {
              llm_provider: llmProvider,
              llm_model: llmModel || undefined,
              vision_model: visionModel || undefined,
            }),
          },
        }),
      });
      if (res.ok) {
        setSaved(true);
        toast(t.settingsSaved, "success");
      } else {
        const data = await res.json();
        toast(data.error || t.saveFailed);
      }
    } catch {
      toast(t.networkError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">
          {t.restaurantName}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false); }}
          required
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">
          {t.cuisineType}
        </label>
        <select
          value={cuisineType}
          onChange={(e) => { setCuisineType(e.target.value); setSaved(false); }}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="">{t.select}</option>
          {cuisineOptions.map((c) => (
            <option key={c} value={c}>
              {(t as unknown as Record<string, string>)[cuisineLabelKeys[c]] ?? c.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">{t.address}</label>
        <input
          type="text"
          value={address}
          onChange={(e) => { setAddress(e.target.value); setSaved(false); }}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
        <label className="relative mt-0.5 inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={allowDrinksOnly}
            onChange={(e) => { setAllowDrinksOnly(e.target.checked); setSaved(false); }}
            className="peer sr-only"
          />
          <div className="h-5 w-9 rounded-full bg-muted-foreground/30 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-background after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-full" />
        </label>
        <div>
          <span className="text-sm font-medium text-foreground">{t.allowDrinksOnly}</span>
          <p className="mt-0.5 text-xs text-gray-400">{t.allowDrinksOnlyHint}</p>
        </div>
      </div>

      {/* AI Models — unified config */}
      {aiModels && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-primary">{t.aiModelsTitle}</h3>

          {/* ── Text AI ── */}
          <div className="rounded-md bg-card/60 px-3 py-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-foreground">{t.aiTextModel}</span>
                <p className="text-[10px] text-muted-foreground">{t.aiTextModelHint}</p>
              </div>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                {aiModels.text ? `${aiModels.text.provider} / ${aiModels.text.model}` : t.aiModelNotConfigured}
              </span>
            </div>
            {/* Inline text AI config — founder only */}
            {isFounder && (
              <div className="mt-2 space-y-2 border-t border-primary/10 pt-2">
                <div className="flex gap-2">
                  <select
                    value={llmProvider}
                    onChange={(e) => { setLlmProvider(e.target.value); setSaved(false); setTestResult(null); }}
                    className="flex-1 rounded border px-2 py-1 text-xs"
                  >
                    <option value="auto">{t.llmProviderAuto}</option>
                    <option value="anthropic">{t.llmProviderAnthropic}</option>
                    <option value="openai">{t.llmProviderOpenAI}</option>
                  </select>
                  <input
                    type="text"
                    value={llmModel}
                    onChange={(e) => { setLlmModel(e.target.value); setSaved(false); setTestResult(null); }}
                    placeholder={t.llmModelPlaceholder}
                    className="flex-1 rounded border px-2 py-1 text-xs"
                  />
                  {llmModel && (
                    <button
                      type="button"
                      onClick={() => { setLlmModel(""); setSaved(false); setTestResult(null); }}
                      className="shrink-0 rounded border px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted"
                    >
                      {t.llmUseDefault}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={testing}
                    onClick={async () => {
                      setTesting(true);
                      setTestResult(null);
                      try {
                        const testProvider = llmProvider === "auto" ? "anthropic" : llmProvider;
                        const res = await fetch("/api/ai/test-llm", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            provider: testProvider,
                            model: llmModel || undefined,
                          }),
                        });
                        const data = await res.json();
                        setTestResult(data);
                        if (data.success) {
                          toast(t.llmTestSuccess, "success");
                        } else {
                          toast(`${t.llmTestFailed}: ${data.error || ""}`);
                        }
                      } catch {
                        toast(t.llmTestFailed);
                      } finally {
                        setTesting(false);
                      }
                    }}
                    className="rounded bg-blue-600 px-3 py-1 text-[10px] font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {testing ? t.llmTesting : t.llmTestButton}
                  </button>
                  {testResult && (
                    <span className={`text-[10px] ${testResult.success ? "text-emerald-600" : "text-red-600"}`}>
                      {testResult.success
                        ? `${t.llmTestSuccess} (${testResult.model}, ${testResult.latencyMs}ms)`
                        : `${t.llmTestFailed}: ${testResult.error}`}
                    </span>
                  )}
                </div>
                {showLlmQuota && (
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-muted-foreground whitespace-nowrap">{t.llmMonthlyQuota}</label>
                    <input
                      type="number"
                      value={llmQuotaCalls}
                      onChange={(e) => { setLlmQuotaCalls(parseInt(e.target.value) || 5000); setSaved(false); }}
                      min={100}
                      max={100000}
                      step={500}
                      className="w-24 rounded border px-2 py-1 text-xs"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Vision AI ── */}
          <div className="rounded-md bg-card/60 px-3 py-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-foreground">{t.aiVisionModel}</span>
                <p className="text-[10px] text-muted-foreground">{t.aiVisionModelHint}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${aiModels.vision ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                {aiModels.vision ? `${aiModels.vision.provider} / ${aiModels.vision.model}` : t.aiModelNotConfigured}
              </span>
            </div>
            {/* Inline vision config — founder only */}
            {isFounder && (
              <div className="mt-2 space-y-2 border-t border-primary/10 pt-2">
                <div className="flex gap-2">
                  <span className="flex items-center rounded border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {t.aiVisionProviderGemini}
                  </span>
                  <input
                    type="text"
                    value={visionModel}
                    onChange={(e) => { setVisionModel(e.target.value); setSaved(false); setVisionTestResult(null); }}
                    placeholder={t.aiVisionModelPlaceholder}
                    className="flex-1 rounded border px-2 py-1 text-xs"
                  />
                  {visionModel && (
                    <button
                      type="button"
                      onClick={() => { setVisionModel(""); setSaved(false); setVisionTestResult(null); }}
                      className="shrink-0 rounded border px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted"
                    >
                      {t.aiVisionUseDefault}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={visionTesting}
                    onClick={async () => {
                      setVisionTesting(true);
                      setVisionTestResult(null);
                      try {
                        const res = await fetch("/api/ai/test-llm", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            provider: "gemini",
                            model: visionModel || undefined,
                          }),
                        });
                        const data = await res.json();
                        setVisionTestResult(data);
                        if (data.success) {
                          toast(t.llmTestSuccess, "success");
                        } else {
                          toast(`${t.llmTestFailed}: ${data.error || ""}`);
                        }
                      } catch {
                        toast(t.llmTestFailed);
                      } finally {
                        setVisionTesting(false);
                      }
                    }}
                    className="rounded bg-blue-600 px-3 py-1 text-[10px] font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {visionTesting ? t.llmTesting : t.llmTestButton}
                  </button>
                  {visionTestResult && (
                    <span className={`text-[10px] ${visionTestResult.success ? "text-emerald-600" : "text-red-600"}`}>
                      {visionTestResult.success
                        ? `${t.llmTestSuccess} (${visionTestResult.model}, ${visionTestResult.latencyMs}ms)`
                        : `${t.llmTestFailed}: ${visionTestResult.error}`}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Image Gen AI ── */}
          <div className="flex items-center justify-between rounded-md bg-card/60 px-3 py-2">
            <div>
              <span className="text-xs font-medium text-foreground">{t.aiImageGenModel}</span>
              <p className="text-[10px] text-muted-foreground">{t.aiImageGenModelHint}</p>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {aiModels.imageGen.provider} / {aiModels.imageGen.model}
              <span className="ml-1 text-emerald-600">({t.aiModelFree})</span>
            </span>
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-foreground">{t.slug}</label>
        <p className="mt-1 font-mono text-sm text-muted-foreground">/r/{slug}</p>
      </div>

      <button
        type="submit"
        disabled={saving || saved}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? t.saving : saved ? t.saved : t.saveChanges}
      </button>
    </form>
  );
}
