"use client";

import { useEffect, useState } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showStack, setShowStack] = useState(false);

  useEffect(() => {
    console.error("[Admin Error]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-12">
      <div className="rounded-xl border border-red-300 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950/30">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-xl">&#x26A0;</span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-red-700 dark:text-red-400">
              Something went wrong
            </h2>
            <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-300">
              {error.message || "Unknown error"}
            </p>
            {error.digest && (
              <p className="mt-1 text-xs text-red-400 dark:text-red-500">
                Ref: {error.digest}
              </p>
            )}
          </div>
        </div>

        {error.stack && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowStack(!showStack)}
              className="text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              {showStack ? "Hide details" : "Show details"}
            </button>
            {showStack && (
              <pre className="mt-2 max-h-60 overflow-auto rounded-lg bg-red-100 p-3 text-[11px] leading-relaxed text-red-800 dark:bg-red-900/40 dark:text-red-200">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
