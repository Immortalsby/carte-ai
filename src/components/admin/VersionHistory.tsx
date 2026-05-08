"use client";

import { useState, useEffect } from "react";
import { ClockCounterClockwise, ArrowCounterClockwise, Info } from "@phosphor-icons/react";
import { useToast } from "@/components/ui/Toast";

interface VersionEntry {
  id: string;
  version: number;
  published_at: string | null;
  created_at: string;
}

interface VersionHistoryProps {
  slug: string;
  currentVersion: number;
  labels: {
    versionHistory: string;
    versionLabel: (v: number) => string;
    currentVersion: string;
    rollbackTo: string;
    rollbackConfirm: (v: number) => string;
    rollbackSuccess: string;
    rollbackMaxNotice: string;
    noVersions: string;
  };
  onRollback?: () => void;
}

export function VersionHistory({ slug, currentVersion, labels, onRollback }: VersionHistoryProps) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [rolling, setRolling] = useState<number | null>(null);
  const [confirmVersion, setConfirmVersion] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/menus/${slug}/versions`)
      .then((r) => r.json())
      .then((data) => setVersions(data.versions ?? []))
      .catch(() => setVersions([]))
      .finally(() => setLoading(false));
  }, [open, slug, currentVersion]);

  async function handleRollback(version: number) {
    setRolling(version);
    setConfirmVersion(null);
    try {
      const res = await fetch(`/api/menus/${slug}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });
      if (res.ok) {
        toast(labels.rollbackSuccess, "success");
        setOpen(false);
        onRollback?.();
      } else {
        const data = await res.json();
        toast(data.error || "Rollback failed", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setRolling(null);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
      >
        <ClockCounterClockwise weight="duotone" className="h-4 w-4" />
        {labels.versionHistory}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-xl border border-border bg-card shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">{labels.versionHistory}</p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Info weight="bold" className="h-3 w-3 shrink-0" />
              {labels.rollbackMaxNotice}
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto p-2">
            {loading ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">...</div>
            ) : versions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                {labels.noVersions}
              </div>
            ) : (
              versions.map((v) => {
                const isCurrent = v.version === currentVersion;
                const date = v.published_at || v.created_at;
                return (
                  <div
                    key={v.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                      isCurrent ? "bg-emerald-500/10" : "hover:bg-muted"
                    }`}
                  >
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        {labels.versionLabel(v.version)}
                      </span>
                      {isCurrent && (
                        <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {labels.currentVersion}
                        </span>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(date).toLocaleString()}
                      </p>
                    </div>
                    {!isCurrent && (
                      confirmVersion === v.version ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={rolling !== null}
                            onClick={() => handleRollback(v.version)}
                            className="rounded-md bg-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {rolling === v.version ? "..." : labels.rollbackTo}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmVersion(null)}
                            className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={rolling !== null}
                          onClick={() => setConfirmVersion(v.version)}
                          className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
                        >
                          <ArrowCounterClockwise weight="bold" className="h-3 w-3" />
                          {labels.rollbackTo}
                        </button>
                      )
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
