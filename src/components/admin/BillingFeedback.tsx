"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

interface BillingFeedbackProps {
  labels: {
    billingSuccess: string;
    billingCancelled: string;
  };
}

export function BillingFeedback({ labels }: BillingFeedbackProps) {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const billing = searchParams.get("billing");
    if (billing === "success") toast(labels.billingSuccess, "success");
    if (billing === "cancelled") toast(labels.billingCancelled, "info");
    // Clean URL without reload
    if (billing) window.history.replaceState({}, "", window.location.pathname);
  }, [searchParams, labels, toast]);

  return null;
}
