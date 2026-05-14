"use client";

import { useState, useEffect } from "react";
import { Copy, Users, Star, Gift } from "@phosphor-icons/react";
import { useToast } from "@/components/ui/Toast";

interface ReferralLabels {
  referralTitle: string;
  referralDesc: string;
  referralYourCode: string;
  referralCopyLink: string;
  referralLinkCopied: string;
  referralStats: string;
  referralTotalInvited: string;
  referralQualified: string;
  referralProgress: (count: number) => string;
  referralPermanentFree: string;
  referralRewardDesc: string;
}

interface ReferralData {
  code: string;
  permanentFree: boolean;
  totalReferred: number;
  qualifiedReferred: number;
}

export function ReferralSection({ labels }: { labels: ReferralLabels }) {
  const { toast } = useToast();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  function copyLink() {
    if (!data?.code) return;
    const url = `${window.location.origin}/admin/new?ref=${data.code}`;
    navigator.clipboard.writeText(url).then(
      () => toast(labels.referralLinkCopied, "success"),
      () => {},
    );
  }

  if (loading) {
    return (
      <div className="mt-8 animate-pulse rounded-xl border p-6">
        <div className="h-5 w-40 rounded bg-gray-200" />
        <div className="mt-3 h-4 w-64 rounded bg-gray-100" />
      </div>
    );
  }

  if (!data) return null;

  const progress = Math.min(data.qualifiedReferred / 10, 1);

  return (
    <div className="mt-8 rounded-xl border p-6">
      <div className="flex items-center gap-2">
        <Gift size={20} weight="duotone" className="text-purple-600" />
        <h2 className="text-lg font-semibold">{labels.referralTitle}</h2>
      </div>
      <p className="mt-1 text-sm text-gray-500">{labels.referralDesc}</p>

      {/* Referral code + copy */}
      <div className="mt-4 flex items-center gap-3">
        <div className="rounded-lg border bg-gray-50 px-4 py-2 font-mono text-lg tracking-wider">
          {data.code}
        </div>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          <Copy size={16} />
          {labels.referralCopyLink}
        </button>
      </div>

      {/* Permanent free badge */}
      {data.permanentFree && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          <Star size={18} weight="fill" />
          {labels.referralPermanentFree}
        </div>
      )}

      {/* Stats */}
      <div className="mt-5">
        <h3 className="text-sm font-medium text-gray-700">{labels.referralStats}</h3>
        <div className="mt-2 flex gap-6">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-gray-400" />
            <span className="text-sm text-gray-600">
              {labels.referralTotalInvited}: <strong>{data.totalReferred}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Star size={18} className="text-yellow-500" />
            <span className="text-sm text-gray-600">
              {labels.referralQualified}: <strong>{data.qualifiedReferred}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {!data.permanentFree && (
        <div className="mt-4">
          <p className="text-xs text-gray-500">{labels.referralProgress(data.qualifiedReferred)}</p>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-purple-600 transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-400">{labels.referralRewardDesc}</p>
        </div>
      )}
    </div>
  );
}
