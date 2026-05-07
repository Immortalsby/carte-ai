"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface EligibleUser {
  id: string;
  name: string;
  email: string;
}

export function AssignOwnerButton({
  tenantId,
  tenantName,
  eligibleUsers,
}: {
  tenantId: string;
  tenantName: string;
  eligibleUsers: EligibleUser[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  async function handleAssign() {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tenants/assign-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, userId: selectedUserId }),
      });
      if (res.ok) {
        toast(`Owner assigned to ${tenantName}`);
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        toast(data?.error || "Failed to assign owner");
      }
    } catch {
      toast("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (eligibleUsers.length === 0) {
    return (
      <span className="text-[10px] text-muted-foreground">
        No eligible users
      </span>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-amber-700"
      >
        Assign Owner
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedUserId}
        onChange={(e) => setSelectedUserId(e.target.value)}
        className="rounded-md border border-border bg-card px-2 py-1 text-xs"
      >
        <option value="">Select user...</option>
        {eligibleUsers.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.email})
          </option>
        ))}
      </select>
      <button
        onClick={handleAssign}
        disabled={loading || !selectedUserId}
        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "..." : "Confirm"}
      </button>
      <button
        onClick={() => { setOpen(false); setSelectedUserId(""); }}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        Cancel
      </button>
    </div>
  );
}
