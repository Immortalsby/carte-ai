"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import type { AdminLocale } from "@/lib/admin-i18n";
import { getAdminDict } from "@/lib/admin-i18n";

interface DeleteRestaurantProps {
  slug: string;
  restaurantName: string;
  locale: AdminLocale;
}

export function DeleteRestaurant({ slug, restaurantName, locale }: DeleteRestaurantProps) {
  const t = getAdminDict(locale);
  const router = useRouter();
  const { toast } = useToast();
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleDelete() {
    if (!secret.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${slug}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      if (res.ok) {
        toast(t.deleteSuccess, "success");
        router.push("/admin");
      } else {
        const data = (await res.json()) as { error?: string };
        toast(data.error === "Invalid secret" ? t.deleteInvalidSecret : t.deleteFailed);
      }
    } catch {
      toast(t.deleteFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
      <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
        {t.dangerZone}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {t.deleteRestaurantDesc}
      </p>

      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 rounded-md border border-red-500/30 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400"
        >
          {t.deleteRestaurant}
        </button>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {restaurantName}
          </p>
          <div>
            <label htmlFor="delete-secret" className="block text-sm font-medium text-foreground">
              {t.deleteSecretLabel}
            </label>
            <input
              id="delete-secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder={t.deleteSecretPlaceholder}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || !secret.trim()}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? t.deleting : t.deleteConfirmButton}
            </button>
            <button
              type="button"
              onClick={() => {
                setExpanded(false);
                setSecret("");
              }}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              {t.reset}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
