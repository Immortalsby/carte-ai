"use client";

import { useState } from "react";
import type { AdminLocale } from "@/lib/admin-i18n";

const localeLabels: Record<AdminLocale, string> = {
  en: "English",
  fr: "Français",
  zh: "中文",
};

interface AdminLocaleSelectorProps {
  current: AdminLocale;
  label: string;
  browserDefaultLabel: string;
}

export function AdminLocaleSelector({ current, label, browserDefaultLabel }: AdminLocaleSelectorProps) {
  const [locale, setLocale] = useState(current);

  function handleChange(value: string) {
    if (value === "auto") {
      document.cookie = "admin_locale=; path=/; max-age=0";
    } else {
      document.cookie = `admin_locale=${value}; path=/; max-age=${365 * 24 * 60 * 60}`;
    }
    setLocale(value === "auto" ? current : (value as AdminLocale));
    window.location.reload();
  }

  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <select
        value={locale}
        onChange={(e) => handleChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
      >
        <option value="auto">{browserDefaultLabel}</option>
        {(Object.keys(localeLabels) as AdminLocale[]).map((l) => (
          <option key={l} value={l}>{localeLabels[l]}</option>
        ))}
      </select>
    </div>
  );
}
