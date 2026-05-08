type EventType = "scan" | "recommend_view" | "adoption" | "dwell" | "mode_switch" | "share" | "culture_match" | "review_click" | "wishlist_heart";

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
