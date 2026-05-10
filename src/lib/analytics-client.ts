/**
 * Analytics consent key — stored in localStorage.
 * Values: "accepted" | "rejected" | absent (not yet chosen).
 *
 * GDPR / CNIL: behavioural analytics events (scan, dwell, recommend_view …)
 * are ONLY sent when the user has explicitly opted in.
 */
export const ANALYTICS_CONSENT_KEY = "carte-analytics-consent";

export function hasAnalyticsConsent(): boolean {
  try {
    return localStorage.getItem(ANALYTICS_CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function setAnalyticsConsent(accepted: boolean) {
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, accepted ? "accepted" : "rejected");
  } catch {
    // Private browsing or storage full — fail silently
  }
}

export function resetAnalyticsConsent() {
  try {
    localStorage.removeItem(ANALYTICS_CONSENT_KEY);
  } catch {}
}

export function analyticsConsentState(): "accepted" | "rejected" | "pending" {
  try {
    const v = localStorage.getItem(ANALYTICS_CONSENT_KEY);
    if (v === "accepted") return "accepted";
    if (v === "rejected") return "rejected";
    return "pending";
  } catch {
    return "pending";
  }
}

// ─── Event tracking (gated by consent) ───

type EventType =
  | "scan"
  | "recommend_view"
  | "adoption"
  | "dwell"
  | "share"
  | "review_click"
  | "wishlist_heart";

let sessionId: string | null = null;

function getSessionId() {
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }
  return sessionId;
}

export function trackEvent(
  tenantId: string,
  eventType: EventType,
  payload?: Record<string, unknown>,
  language?: string,
) {
  // GDPR gate: do NOT send analytics unless user has opted in
  if (!hasAnalyticsConsent()) return;

  // Fire and forget — don't block UI
  fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenant_id: tenantId,
      event_type: eventType,
      payload,
      session_id: getSessionId(),
      language,
    }),
  }).catch(() => {
    // Silent fail — analytics should never break UX
  });
}
