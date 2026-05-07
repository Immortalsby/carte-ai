/**
 * Generates a canonical tag for a dish (FR25).
 * Same dish across different restaurants should produce the same tag,
 * enabling cross-restaurant image reuse (FR26).
 *
 * Uses the English name as primary key, falling back to French.
 * Strips accents, lowercases, replaces spaces with hyphens.
 */
export function generateCanonicalTag(
  name: { en?: string; fr?: string; zh?: string },
  cuisine?: string,
): string {
  const raw = name.en || name.fr || name.zh || "unknown-dish";

  const normalized = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric
    .trim()
    .replace(/\s+/g, "-") // spaces to hyphens
    .replace(/-+/g, "-"); // collapse multiple hyphens

  // Prefix with cuisine for disambiguation (e.g., "chinese-mapo-tofu" vs "japanese-mapo-tofu")
  if (cuisine) {
    const cuisinePrefix = cuisine
      .replace(/_restaurant$/, "")
      .replace(/_/g, "-");
    return `${cuisinePrefix}-${normalized}`;
  }

  return normalized;
}
