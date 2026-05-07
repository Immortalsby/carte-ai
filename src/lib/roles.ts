/**
 * Role helpers — distinguishes founder (platform admin) from restaurant owner.
 *
 * Founder emails are set via FOUNDER_EMAILS env var (comma-separated).
 * Any authenticated user NOT in this list is treated as a regular restaurant owner.
 */

const founderEmails = new Set(
  (process.env.FOUNDER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

export function isFounder(email: string | null | undefined): boolean {
  if (!email) return false;
  return founderEmails.has(email.toLowerCase());
}
