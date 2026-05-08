"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  type PieLabelRenderProps,
} from "recharts";
import type { AdminLocale } from "@/lib/admin-i18n";
import { getAdminDict } from "@/lib/admin-i18n";

const COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  "anthropic-foundry": "Anthropic Foundry",
  anthropic: "Anthropic",
  fallback: "Fallback",
  local: "Local",
  guardrail_fallback: "Guardrail",
  quota_exceeded: "Quota Exceeded",
};

interface ChartData {
  name: string;
  value: number;
}

interface DailyData {
  date: string;
  scans: number;
}

interface AdoptionData {
  date: string;
  rate: number;
}

interface DashboardChartsProps {
  languageDistribution: ChartData[];
  modeDistribution: ChartData[];
  dailyScans?: DailyData[];
  dailyAdoptions?: AdoptionData[];
  dwellDistribution?: ChartData[];
  providerDistribution?: ChartData[];
  wishlistHearts?: ChartData[];
  locale?: AdminLocale;
}

export function DashboardCharts({
  languageDistribution,
  modeDistribution,
  dailyScans,
  dailyAdoptions,
  dwellDistribution,
  providerDistribution,
  wishlistHearts,
  locale = "en",
}: DashboardChartsProps) {
  const t = getAdminDict(locale);
  return (
    <div className="mt-8 space-y-6">
      {/* Scan trend with granularity toggle (FR42) */}
      {dailyScans && dailyScans.length > 0 && (
        <ScanTrendChart dailyScans={dailyScans} locale={locale} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Language pie chart */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">{t.languages}</h3>
          {languageDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={languageDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={(props: PieLabelRenderProps) =>
                    `${props.name ?? ""} ${(((props.percent as number | undefined) ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {languageDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="mt-8 text-center text-sm text-muted-foreground">{t.noDataYet}</p>
          )}
        </div>

        {/* Mode bar chart */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">
            {t.recommendationModes}
          </h3>
          {modeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={modeDistribution}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="mt-8 text-center text-sm text-muted-foreground">{t.noDataYet}</p>
          )}
        </div>
      </div>

      {/* Daily adoption rate trend (FR44) */}
      {dailyAdoptions && dailyAdoptions.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">
            {t.adoptionRateTrend}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyAdoptions}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis
                allowDecimals={false}
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                unit="%"
              />
              <Tooltip formatter={(v) => `${v}%`} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dwell time distribution (FR45) */}
        {dwellDistribution && dwellDistribution.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">
              {t.dwellTimeDistribution}
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dwellDistribution}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Wishlist hearts per dish */}
        {wishlistHearts && wishlistHearts.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">{t.wishlistHearts}</h3>
            <ResponsiveContainer width="100%" height={Math.max(220, wishlistHearts.slice(0, 10).length * 32)}>
              <BarChart data={wishlistHearts.slice(0, 10)} layout="vertical">
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* LLM provider distribution (FR47) */}
        {providerDistribution && providerDistribution.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">
              {t.llmProviderDistribution}
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={providerDistribution.map((p) => ({ ...p, name: PROVIDER_LABELS[p.name] || p.name }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={(props: PieLabelRenderProps) =>
                    `${props.name ?? ""} ${(((props.percent as number | undefined) ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {providerDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

/** Scan trend chart with day/week toggle (FR42) */
function ScanTrendChart({ dailyScans, locale = "en" }: { dailyScans: DailyData[]; locale?: AdminLocale }) {
  const t = getAdminDict(locale);
  const [granularity, setGranularity] = useState<"day" | "week">("day");

  const chartData =
    granularity === "day"
      ? dailyScans
      : aggregateWeekly(dailyScans);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{t.scanTrend}</h3>
        <div className="flex rounded-lg border border-border text-xs">
          <button
            type="button"
            onClick={() => setGranularity("day")}
            className={`px-3 py-1 ${granularity === "day" ? "bg-muted font-medium text-foreground" : "text-muted-foreground"}`}
          >
            {t.day}
          </button>
          <button
            type="button"
            onClick={() => setGranularity("week")}
            className={`px-3 py-1 ${granularity === "week" ? "bg-muted font-medium text-foreground" : "text-muted-foreground"}`}
          >
            {t.week}
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="scans"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function aggregateWeekly(daily: DailyData[]): DailyData[] {
  const weeks: DailyData[] = [];
  for (let i = 0; i < daily.length; i += 7) {
    const chunk = daily.slice(i, i + 7);
    const scans = chunk.reduce((sum, d) => sum + d.scans, 0);
    weeks.push({
      date: `${chunk[0].date}~${chunk[chunk.length - 1].date}`,
      scans,
    });
  }
  return weeks;
}
