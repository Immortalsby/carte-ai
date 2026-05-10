"use client";

import { useState, useRef, useCallback } from "react";
import type { RestaurantMenu } from "@/types/menu";
import { useToast } from "@/components/ui/Toast";
import type { AdminLocale } from "@/lib/admin-i18n";
import { getAdminDict } from "@/lib/admin-i18n";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB per file
const MAX_FILES = 10;
const FETCH_TIMEOUT = 55_000; // 55s — just under Vercel Hobby 60s limit
const OCR_CHUNK_MAX_CHARS = 1500; // Split OCR text into chunks to keep each structure call under 45s

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

type ImportState = "idle" | "step1" | "step2" | "success" | "error";

function isVisionFile(file: File) {
  return file.type.startsWith("image/") || file.type === "application/pdf";
}

export function MenuImporter({ slug, locale = "en", onImported }: MenuImporterProps) {
  const t = getAdminDict(locale);
  const tAny = t as unknown as Record<string, string>;
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>("idle");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [result, setResult] = useState<{
    draftMenu: RestaurantMenu;
    confidence: number;
    dishCount: number;
    message: string;
    fileCount: number;
  } | null>(null);

  const fetchWithTimeout = useCallback(async (url: string, init: RequestInit) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }, []);

  const processFiles = useCallback(async (files: File[]) => {
    const oversized = files.find((f) => f.size > MAX_FILE_SIZE);
    if (oversized) { toast(t.fileTooLarge); return; }
    if (files.length > MAX_FILES) { toast(tAny.maxFilesExceeded); return; }

    setState("step1");
    setResult(null);
    setProgress(files.length > 1 ? { current: 0, total: files.length } : null);

    try {
      // Separate vision files (images/PDFs) from text files
      const visionFiles = files.filter(isVisionFile);
      const textFiles = files.filter((f) => !isVisionFile(f));

      const allOcrTexts: string[] = [];

      // Claim an upload slot (atomic check + record)
      try {
        const limitRes = await fetchWithTimeout(`/api/ingest/limit?slug=${encodeURIComponent(slug)}`, {
          method: "POST",
        });
        if (!limitRes.ok) {
          const data = await limitRes.json();
          setState("error");
          toast(data.error || t.importFailed);
          return;
        }
      } catch {
        setState("error");
        toast(t.importFailed);
        return;
      }

      // Step 1: OCR for vision files (Gemini)
      let lastError = "";
      for (let i = 0; i < visionFiles.length; i++) {
        if (files.length > 1) setProgress({ current: i + 1, total: files.length });

        const formData = new FormData();
        formData.append("file", visionFiles[i]);

        try {
          const res = await fetchWithTimeout("/api/ingest/ocr", {
            method: "POST",
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.ocrText) allOcrTexts.push(data.ocrText);
          } else {
            const data = await res.json().catch(() => ({}));
            lastError = data.error || `OCR ${res.status}`;
            console.error(`[MenuImporter] OCR failed for ${visionFiles[i].name}:`, data);
          }
        } catch (err) {
          lastError = err instanceof Error ? err.message : "OCR network error";
          console.error(`[MenuImporter] OCR exception for ${visionFiles[i].name}:`, err);
        }
      }

      // For text/CSV/JSON files, use the old /api/ingest endpoint directly
      // (they don't need vision OCR, and processing is fast)
      const textDrafts: RestaurantMenu[] = [];
      for (const file of textFiles) {
        const formData = new FormData();
        formData.append("file", file);
        try {
          const res = await fetchWithTimeout("/api/ingest", {
            method: "POST",
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.draftMenu && data.status !== "error") {
              textDrafts.push(data.draftMenu);
            }
          } else {
            const data = await res.json().catch(() => ({}));
            lastError = data.error || `Ingest ${res.status}`;
            console.error(`[MenuImporter] Ingest failed for ${file.name}:`, data);
          }
        } catch (err) {
          lastError = err instanceof Error ? err.message : "Ingest network error";
          console.error(`[MenuImporter] Ingest exception for ${file.name}:`, err);
        }
      }

      // If no OCR text extracted and no text drafts, fail
      if (allOcrTexts.length === 0 && textDrafts.length === 0) {
        setState("error");
        toast(lastError ? `${t.importFailed}: ${lastError}` : t.importFailed);
        return;
      }

      // Step 2: Structure with LLM — split large OCR into chunks, run in parallel
      const ocrDrafts: RestaurantMenu[] = [];
      if (allOcrTexts.length > 0) {
        setState("step2");

        const combinedOcr = allOcrTexts.join("\n\n---\n\n");

        // Split by blank lines (double newline), then re-combine up to max chars per chunk
        const rawSections = combinedOcr.split(/\n{2,}/);
        const chunks: string[] = [];
        let current = "";
        for (const section of rawSections) {
          if (current.length + section.length > OCR_CHUNK_MAX_CHARS && current.length > 0) {
            chunks.push(current.trim());
            current = section;
          } else {
            current += (current ? "\n\n" : "") + section;
          }
        }
        if (current.trim()) chunks.push(current.trim());

        // If still just one chunk that's small enough, keep it as-is
        if (chunks.length === 0) chunks.push(combinedOcr);

        console.log(`[MenuImporter] Structuring ${chunks.length} chunks in parallel (${combinedOcr.length} chars total)`);
        setProgress({ current: 0, total: chunks.length });

        // Run all chunks in parallel for speed
        const results = await Promise.allSettled(
          chunks.map(async (chunk, i) => {
            try {
              const res = await fetchWithTimeout("/api/ingest/structure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ocrText: chunk }),
              });
              setProgress((prev) => prev ? { ...prev, current: prev.current + 1 } : null);
              if (res.ok) {
                const data = await res.json();
                return data.draftMenu as RestaurantMenu | null;
              } else {
                const data = await res.json().catch(() => ({}));
                lastError = data.error || `Structure ${res.status}`;
                console.error(`[MenuImporter] Structure chunk ${i + 1}/${chunks.length} failed:`, data);
                return null;
              }
            } catch (err) {
              lastError = err instanceof Error ? err.message : "Structure network error";
              console.error(`[MenuImporter] Structure chunk ${i + 1}/${chunks.length} exception:`, err);
              return null;
            }
          }),
        );

        for (const r of results) {
          if (r.status === "fulfilled" && r.value) ocrDrafts.push(r.value);
        }
        setProgress(null);
      }

      const allDrafts = [...ocrDrafts, ...textDrafts];
      if (allDrafts.length === 0) {
        setState("error");
        toast(lastError ? `${t.importFailed}: ${lastError}` : t.importFailed);
        return;
      }

      // Merge all drafts
      const merged = allDrafts[0];
      if (allDrafts.length > 1) {
        const seenNames = new Set<string>();
        const allDishes: RestaurantMenu["dishes"] = [];
        for (const d of allDrafts) {
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
        confidence: 0.75,
        dishCount: draft.dishes?.length ?? 0,
        message: "",
        fileCount: files.length,
      });
      setState("success");
      toast(t.importSuccess, "success");
    } catch {
      setProgress(null);
      setState("error");
      toast(t.importFailed);
    }
  }, [slug, t, tAny, toast, fetchWithTimeout]);

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
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function reset() {
    setState("idle");
    setResult(null);
    setSelectedFiles([]);
    setProgress(null);
  }

  // ─── Step 1: Processing image (OCR) ───
  if (state === "step1") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-purple-300 bg-purple-500/10 p-12">
        {/* Scanning animation */}
        <div className="relative mb-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/20">
            <svg className="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
          </div>
          {/* Scan line animation */}
          <div className="absolute inset-x-0 top-0 h-0.5 animate-[scan_1.5s_ease-in-out_infinite] rounded-full bg-purple-500" />
        </div>

        {/* Step indicator */}
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">1</span>
          <div className="h-px w-8 bg-border" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold text-muted-foreground">2</span>
        </div>

        <p className="text-lg font-medium text-purple-700 dark:text-purple-400">
          {tAny.importStep1 || "Reading menu..."}
        </p>
        <p className="mt-1 text-sm text-purple-500 dark:text-purple-400/70">
          {tAny.importStep1Desc || "AI is scanning the image to extract text"}
        </p>
        {progress && (
          <p className="mt-2 text-xs text-purple-500 dark:text-purple-400/70">
            {progress.current} / {progress.total}
          </p>
        )}
      </div>
    );
  }

  // ─── Step 2: Generating structured menu ───
  if (state === "step2") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-500/10 p-12">
        {/* Document animation */}
        <div className="relative mb-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20">
            <svg className="h-8 w-8 animate-pulse text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          {/* Typing dots */}
          <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500" style={{ animationDelay: "0ms" }} />
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500" style={{ animationDelay: "150ms" }} />
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500" style={{ animationDelay: "300ms" }} />
          </div>
        </div>

        {/* Step indicator */}
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">&#10003;</span>
          <div className="h-px w-8 bg-emerald-400" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">2</span>
        </div>

        <p className="text-lg font-medium text-emerald-700 dark:text-emerald-400">
          {tAny.importStep2 || "Building menu..."}
        </p>
        <p className="mt-1 text-sm text-emerald-500 dark:text-emerald-400/70">
          {tAny.importStep2Desc || "Translating, categorizing and structuring dishes"}
        </p>
      </div>
    );
  }

  // ─── Success state ───
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

        <div className="mt-4 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <span className="mr-1 font-medium">&#9888;</span>
          {t.aiWarning}
        </div>

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

  // ─── Idle / Error — drop zone + file list ───
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
        <p className="mt-1 text-xs text-muted-foreground">{tAny.maxFilesHint}</p>

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

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => processFiles(selectedFiles)}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {tAny.startImport}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={selectedFiles.length >= MAX_FILES}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              {tAny.addMoreFiles}
            </button>
          </div>

          <p className="text-xs text-muted-foreground">{tAny.mergeHint}</p>
        </div>
      )}
    </div>
  );
}
