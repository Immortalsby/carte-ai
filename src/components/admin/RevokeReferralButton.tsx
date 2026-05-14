"use client";

import { useState } from "react";
import { LinkBreak } from "@phosphor-icons/react";
import { useToast } from "@/components/ui/Toast";

export function RevokeReferralButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [revoked, setRevoked] = useState(false);

  async function handleRevoke() {
    setLoading(true);
    try {
      const res = await fetch("/api/referral/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.revoked) {
        setRevoked(true);
        toast(`Referral revoked for ${userName}`, "success");
      } else {
        toast("No referral to revoke", "error");
      }
    } catch {
      toast("Failed to revoke", "error");
    } finally {
      setLoading(false);
    }
  }

  if (revoked) {
    return (
      <span className="text-[10px] text-muted-foreground">Revoked</span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleRevoke}
      disabled={loading}
      title={`Revoke referral for ${userName}`}
      className="rounded-md border border-red-200 px-2 py-0.5 text-[10px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      <LinkBreak size={12} className="mr-0.5 inline" />
      {loading ? "..." : "Revoke"}
    </button>
  );
}
