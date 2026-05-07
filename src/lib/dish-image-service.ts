import { put } from "@vercel/blob";
import { getDishImage, cacheDishImage } from "@/lib/db/queries/images";
import { generateCanonicalTag } from "@/lib/canonical-tag";

interface DishImageInput {
  name: { en?: string; fr?: string; zh?: string };
  description?: string;
  cuisine?: string;
  ingredients?: string[];
}

interface DishImageResult {
  imageUrl: string;
  source: "ai_generated" | "manual";
  canonicalTag: string;
  isNew: boolean;
}

/**
 * Get or generate an image for a dish (FR22-FR27).
 * Checks cache first, then generates with Pollinations AI.
 */
export async function getOrGenerateDishImage(
  input: DishImageInput,
  source: "auto" | "ai" = "auto",
): Promise<DishImageResult | null> {
  const tag = generateCanonicalTag(input.name, input.cuisine);

  // For explicit AI generation, skip cache (user wants a fresh AI image)
  if (source !== "ai") {
    const cached = await getDishImage(tag);
    if (cached) {
      return {
        imageUrl: cached.image_url,
        source: cached.source as DishImageResult["source"],
        canonicalTag: tag,
        isNew: false,
      };
    }
  }

  const aiResult = await generateWithPollinations(input, tag);
  if (aiResult) return aiResult;

  return null;
}

/**
 * Generate a dish image using Pollinations AI (free, no API key needed).
 * Downloads the result and stores in Vercel Blob for persistence.
 */
async function generateWithPollinations(
  input: DishImageInput,
  canonicalTag: string,
): Promise<DishImageResult | null> {
  try {
    const cuisineLabel = input.cuisine
      ?.replace(/_restaurant$/, "")
      .replace(/_/g, " ") ?? "international";

    const prompt = [
      `Professional food photography of "${input.name.en || input.name.fr}",`,
      `a ${cuisineLabel} cuisine dish.`,
      input.description ? `${input.description}.` : "",
      "Warm lighting, shallow depth of field, appetizing presentation on a restaurant plate.",
      "Top-down or 45-degree angle. Clean background. No text, no watermarks.",
    ]
      .filter(Boolean)
      .join(" ");

    // Pollinations: simple GET request returns image bytes
    const encodedPrompt = encodeURIComponent(prompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=768&seed=${Date.now()}&nologo=true&model=flux`;

    const imageResponse = await fetch(pollinationsUrl);
    if (!imageResponse.ok) {
      throw new Error(`Pollinations returned ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

    // Persist in Vercel Blob
    let finalUrl = pollinationsUrl;
    try {
      const ext = contentType.includes("png") ? "png" : "jpg";
      const blob = await put(`dish-images/${canonicalTag}.${ext}`, imageBuffer, {
        access: "public",
        contentType,
      });
      finalUrl = blob.url;
    } catch (blobError) {
      console.warn("[DishImageService] Vercel Blob unavailable, using Pollinations URL directly:", blobError);
    }

    // Cache in DB
    await cacheDishImage({
      canonical_tag: canonicalTag,
      image_url: finalUrl,
      source: "ai_generated",
    });

    return {
      imageUrl: finalUrl,
      source: "ai_generated",
      canonicalTag,
      isNew: true,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[DishImageService] Pollinations generation failed:", msg);
    return null;
  }
}
