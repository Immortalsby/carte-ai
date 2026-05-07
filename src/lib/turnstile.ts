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
