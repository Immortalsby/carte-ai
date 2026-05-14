"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const MODES = ["light", "dark", "system"] as const;

const icons: Record<string, React.ReactNode> = {
  light: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  dark: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  system: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8m-4-4v4" />
    </svg>
  ),
};

export function ThemeToggle({ labels }: { labels: { light: string; dark: string; system: string } }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-8" />;

  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5">
      {MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setTheme(mode)}
          className={`flex items-center gap-1.5 rounded-md px-2 py-2 text-[11px] font-medium whitespace-nowrap transition-colors ${
            theme === mode
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title={labels[mode]}
        >
          {icons[mode]}
          <span className="hidden xl:inline">{labels[mode]}</span>
        </button>
      ))}
    </div>
  );
}
