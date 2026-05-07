"use client";

import { useState, useRef, useCallback } from "react";
import type { RestaurantMenu } from "@/types/menu";
import { useToast } from "@/components/ui/Toast";
import type { AdminLocale } from "@/lib/admin-i18n";
import { getAdminDict } from "@/lib/admin-i18n";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file
const MAX_FILES = 10;
const FETCH_TIMEOUT = 55_000; // 55s — just under Vercel 60s limit

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/csv",
  "text/plain",
  "application/json",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

interface MenuImporterProps {
  slug: string;
  locale?: AdminLocale;
  onImported: (menu: RestaurantMenu) => void;
}

type ImportState = "idle" | "uploading" | "success" | "error";

export function MenuImporter({ slug, locale = "en", onImported }: MenuImporterProps) {
  const t = getAdminDict(locale);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>("idle");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [result, setResult] = useState<{
    draftMenu: RestaurantMenu;
    confidence: number;
    dishCount: number;
    message: string;
    fileCount: number;
  } | null>(null);

  const processFiles = useCallback(async (files: File[]) => {
    // Validate
    const oversized = files.find((f) => f.size > MAX_FILE_SIZE);
    if (oversized) {
      toast(t.fileTooLarge);
      return;
    }
    if (files.length > MAX_FILES) {
      const tAny = t as unknown as Record<string, string>;
      toast(tAny.maxFilesExceeded || `Maximum ${MAX_FILES} files allowed.`);
      return;
    }

    setState("uploading");
    setResult(null);
    setUploadProgress(files.length > 1 ? { current: 0, total: files.length } : null);

    try {
      // Send files one at a time to avoid Vercel 60s function timeout,
      // then merge results client-side.
      const drafts: RestaurantMenu[] = [];

      for (let i = 0; i < files.length; i++) {
        if (files.length > 1) setUploadProgress({ current: i + 1, total: files.length });

        const formData = new FormData();
        formData.append("file", files[i]);

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        try {
          const res = await fetch("/api/ingest", {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });
          clearTimeout(timer);

          if (!res.ok) continue;
          const data = await res.json();
          if (data.draftMenu && data.status !== "error") {
            drafts.push(data.draftMenu);
          }
        } catch {
          clearTimeout(timer);
          // Timeout or network error for this file — skip it
          continue;
        }
      }

      setUploadProgress(null);

      if (drafts.length === 0) {
        setState("error");
        toast(t.importFailed);
        return;
      }

      // Merge: use first restaurant info, combine all dishes (dedup by name)
      const merged = drafts[0];
      if (drafts.length > 1) {
        const seenNames = new Set<string>();
        const allDishes: RestaurantMenu["dishes"] = [];
        for (const d of drafts) {
          for (const dish of d.dishes) {
            const key = `${dish.name.fr || ""}|${dish.name.en || ""}|${dish.name.zh || ""}`.toLowerCase();
            if (key === "||" || seenNames.has(key)) continue;
            seenNames.add(key);
            allDishes.push(dish);
          }
        }
        merged.dishes = allDishes;
      }

      const draft: RestaurantMenu = {
        ...merged,
        restaurant: { ...merged.restaurant, slug },
      };

      setResult({
        draftMenu: draft,
        confidence: 0.7,
        dishCount: draft.dishes?.length ?? 0,
        message: "",
        fileCount: files.length,
      });
      setState("success");
      toast(t.importSuccess, "success");
    } catch {
      setUploadProgress(null);
      setState("error");
      toast(t.importFailed);
    }
  }, [slug, t, toast]);

  function addFiles(newFiles: FileList | File[]) {
    const arr = Array.from(newFiles);
    const combined = [...selectedFiles, ...arr].slice(0, MAX_FILES);
    setSelectedFiles(combined);
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function reset() {
    setState("idle");
    setResult(null);
    setSelectedFiles([]);
  }

  // Uploading state
  if (state === "uploading") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-purple-300 bg-purple-500/10 p-12">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600 dark:border-purple-800 dark:border-t-purple-400" />
        <p className="text-lg font-medium text-purple-700 dark:text-purple-400">{t.analyzing}</p>
        <p className="mt-1 text-sm text-purple-500 dark:text-purple-400/70">{t.analysisMayTake}</p>
        {uploadProgress && (
          <p className="mt-2 text-xs text-purple-500 dark:text-purple-400/70">
            {uploadProgress.current} / {uploadProgress.total}
          </p>
        )}
      </div>
    );
  }

  // Success state — show results
  if (state === "success" && result) {
    const confidencePct = Math.round(result.confidence * 100);
    const dishesExtractedFn = t.dishesExtracted as unknown as (count: number) => string;
    const filesProcessedFn = t.filesProcessed as unknown as (count: number) => string;

    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
            <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-foreground">{t.importSuccess}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {result.fileCount > 1 && <>{filesProcessedFn(result.fileCount)} &middot; </>}
              {dishesExtractedFn(result.dishCount)} &middot; {t.confidenceLabel}: {confidencePct}%
            </p>
            {result.message && (
              <p className="mt-1 text-xs text-muted-foreground">{result.message}</p>
            )}
          </div>
        </div>

        {/* AI warning banner */}
        <div className="mt-4 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <span className="mr-1 font-medium">&#9888;</span>
          {t.aiWarning}
        </div>

        {/* Confidence bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t.confidenceLabel}</span>
            <span>{confidencePct}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${confidencePct}%`,
                backgroundColor:
                  confidencePct >= 80 ? "#10b981" : confidencePct >= 50 ? "#f59e0b" : "#ef4444",
              }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => onImported(result.draftMenu)}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t.reviewAndEdit}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            {t.importAnother}
          </button>
        </div>
      </div>
    );
  }

  // Idle / error state — show drop zone + file list
  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
          dragActive
            ? "border-purple-500 bg-purple-500/10"
            : "border-border bg-muted/50 hover:border-foreground/30 hover:bg-muted"
        }`}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground">{t.dragDropHint}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t.supportedFormats}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {(t as unknown as Record<string, string>).maxFilesHint}
        </p>

        {state === "error" && (
          <p className="mt-3 text-sm text-red-600">{t.importFailed}</p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Selected file list */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {selectedFiles.length} / {MAX_FILES}
          </p>
          {selectedFiles.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(0)} KB &middot; {file.type || "unknown"}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="ml-2 shrink-0 text-sm text-muted-foreground hover:text-red-500"
              >
                &times;
              </button>
            </div>
          ))}

          {/* Upload button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => processFiles(selectedFiles)}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {(t as unknown as Record<string, string>).startImport}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={selectedFiles.length >= MAX_FILES}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              {(t as unknown as Record<string, string>).addMoreFiles}
            </button>
          </div>

          {/* Merge hint */}
          <p className="text-xs text-muted-foreground">
            {(t as unknown as Record<string, string>).mergeHint}
          </p>
        </div>
      )}
    </div>
  );
}
