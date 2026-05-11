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
  initialLlmQuotaCalls?: number;
  initialLlmConfig?: LlmConfig;
  initialVisionConfig?: VisionConfig;
  aiModels?: AiModelsInfo;
  isFounder?: boolean;
  locale?: AdminLocale;
}

export function SettingsForm({
  slug,
  initialLlmQuotaCalls,
  initialLlmConfig,
  initialVisionConfig,
  aiModels,
  isFounder = false,
  locale = "en",
}: SettingsFormProps) {
  const t = getAdminDict(locale);
  const showLlmQuota = initialLlmQuotaCalls != null;
  const [llmQuotaCalls, setLlmQuotaCalls] = useState(initialLlmQuotaCalls ?? 5000);
  const [llmProvider, setLlmProvider] = useState(initialLlmConfig?.provider ?? "auto");
  const [llmModel, setLlmModel] = useState(initialLlmConfig?.model ?? "");
  const [visionModel, setVisionModel] = useState(initialVisionConfig?.model ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [touched, setTouched] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; model?: string; response?: string; error?: string; latencyMs?: number } | null>(null);
  const [visionTesting, setVisionTesting] = useState(false);
  const [visionTestResult, setVisionTestResult] = useState<{ success: boolean; model?: string; response?: string; error?: string; latencyMs?: number } | null>(null);
  const { toast } = useToast();
  const dirty = touched && !saved && !saving;

  function markDirty() { setSaved(false); setTouched(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setSaved(false); setTouched(true);
    try {
      const res = await fetch(`/api/tenants/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...(showLlmQuota && { llm_quota_calls: llmQuotaCalls }),
            ...(isFounder && {
              llm_provider: llmProvider,
              llm_model: llmModel || undefined,
              vision_model: visionModel || undefined,
            }),
          },
        }),
      });
      if (res.ok) {
        setSaved(true); setTouched(false);
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

  // If not founder and no AI config, show nothing
  if (!isFounder || !aiModels) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {/* AI Models — unified config (founder only) */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-primary">{t.aiModelsTitle}</h3>

        {/* Text AI */}
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
          <div className="mt-2 space-y-2 border-t border-primary/10 pt-2">
            <div className="flex flex-wrap gap-2">
              <select
                value={llmProvider}
                onChange={(e) => { setLlmProvider(e.target.value); markDirty(); setTestResult(null); }}
                className="flex-1 rounded border px-2 py-1 text-xs"
              >
                <option value="auto">{t.llmProviderAuto}</option>
                <option value="openai">{t.llmProviderOpenAI}</option>
              </select>
              <input
                type="text"
                value={llmModel}
                onChange={(e) => { setLlmModel(e.target.value); markDirty(); setTestResult(null); }}
                placeholder={t.llmModelPlaceholder}
                className="flex-1 rounded border px-2 py-1 text-xs"
              />
              {llmModel && (
                <button
                  type="button"
                  onClick={() => { setLlmModel(""); markDirty(); setTestResult(null); }}
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
                  setTesting(true); setTestResult(null);
                  try {
                    const testProvider = llmProvider === "auto" ? "openai" : llmProvider;
                    const res = await fetch("/api/ai/test-llm", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ provider: testProvider, model: llmModel || undefined }),
                    });
                    const data = await res.json();
                    setTestResult(data);
                    toast(data.success ? t.llmTestSuccess : `${t.llmTestFailed}: ${data.error || ""}`, data.success ? "success" : undefined);
                  } catch { toast(t.llmTestFailed); } finally { setTesting(false); }
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
                  onChange={(e) => { setLlmQuotaCalls(parseInt(e.target.value) || 5000); markDirty(); }}
                  min={100} max={100000} step={100}
                  className="w-24 rounded border px-2 py-1 text-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Vision AI */}
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
          <div className="mt-2 space-y-2 border-t border-primary/10 pt-2">
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center rounded border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">
                {t.aiVisionProviderGemini}
              </span>
              <input
                type="text"
                value={visionModel}
                onChange={(e) => { setVisionModel(e.target.value); markDirty(); setVisionTestResult(null); }}
                placeholder={t.aiVisionModelPlaceholder}
                className="flex-1 rounded border px-2 py-1 text-xs"
              />
              {visionModel && (
                <button
                  type="button"
                  onClick={() => { setVisionModel(""); markDirty(); setVisionTestResult(null); }}
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
                  setVisionTesting(true); setVisionTestResult(null);
                  try {
                    const res = await fetch("/api/ai/test-llm", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ provider: "gemini", model: visionModel || undefined }),
                    });
                    const data = await res.json();
                    setVisionTestResult(data);
                    toast(data.success ? t.llmTestSuccess : `${t.llmTestFailed}: ${data.error || ""}`, data.success ? "success" : undefined);
                  } catch { toast(t.llmTestFailed); } finally { setVisionTesting(false); }
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
        </div>

        {/* Image Gen AI */}
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

      {/* Sticky save bar */}
      <div className="sticky bottom-0 -mx-4 mt-6 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm lg:-mx-6 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || saved}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? t.saving : saved ? `✓ ${t.saved}` : t.saveChanges}
          </button>
          {dirty && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {t.unsavedChanges}
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
