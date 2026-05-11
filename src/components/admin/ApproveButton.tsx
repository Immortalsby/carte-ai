"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export function ApproveButton({
  userId,
  approved,
}: {
  userId: string;
  approved: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleToggle() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, approved: !approved }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        toast(data?.error || "Operation failed");
      }
    } catch {
      toast("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-lg px-3 py-2.5 text-xs font-medium disabled:opacity-50 ${
        approved
          ? "border border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-400"
          : "bg-emerald-600 text-white hover:bg-emerald-700"
      }`}
    >
      {loading ? "..." : approved ? "Revoke" : "Approve"}
    </button>
  );
}
