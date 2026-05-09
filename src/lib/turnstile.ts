import crypto from "crypto";

/**
 * Check if the carte_verified cookie is valid (set by /api/verify-session).
 * Format: "<base36_timestamp>.<hmac_prefix>"
 * Valid for 30 minutes.
 */
export function isSessionVerified(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const secret = process.env.TURNSTILE_SECRET_KEY || "dev-secret";
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return false;
  const [ts, sig] = parts;
  // Check signature
  const expected = crypto.createHmac("sha256", secret).update(ts).digest("hex").slice(0, 16);
  if (sig !== expected) return false;
  // Check expiry (30 min)
  const created = parseInt(ts, 36);
  if (isNaN(created) || Date.now() - created > 30 * 60 * 1000) return false;
  return true;
}

/**
 * Server-side Cloudflare Turnstile token verification.
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("TURNSTILE_SECRET_KEY not set in production — rejecting request");
      return false;
    }
    console.warn("TURNSTILE_SECRET_KEY not set, skipping verification in dev");
    return true;
  }

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });

    const data = await res.json() as { success: boolean };
    return data.success;
  } catch (err) {
    console.error("Turnstile verification fetch failed:", err);
    return false;
  }
}
