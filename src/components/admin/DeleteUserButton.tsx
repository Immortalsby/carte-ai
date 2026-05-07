"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export function DeleteUserButton({
  userId,
  userName,
  tenantCount,
}: {
  userId: string;
  userName: string;
  tenantCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleDelete() {
    if (!secret.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, secret }),
      });
      if (res.ok) {
        toast(`User "${userName}" deleted`, "success");
        setOpen(false);
        setSecret("");
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        toast(data?.error || "Delete failed");
      }
    } catch {
      toast("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Trash icon button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
        title={`Delete ${userName}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Delete user</h3>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{userName}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-300 space-y-1.5">
              <p className="font-medium">This action will permanently delete:</p>
              <ul className="ml-4 list-disc space-y-0.5 text-xs">
                <li>The user account and login credentials</li>
                <li>All active sessions</li>
                {tenantCount > 0 ? (
                  <li className="font-medium">
                    {tenantCount} restaurant{tenantCount > 1 ? "s" : ""} and all associated menus, images, and analytics
                  </li>
                ) : (
                  <li>No restaurants (user has none)</li>
                )}
              </ul>
              <p className="text-xs font-medium">This cannot be undone.</p>
            </div>

            <div className="mt-4">
              <label className="text-xs font-medium text-muted-foreground">
                Enter the secret key to confirm
              </label>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleDelete(); }}
                placeholder="Secret key"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                autoFocus
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setOpen(false); setSecret(""); }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || !secret.trim()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
