/**
 * Client-side Pollinations image generation.
 * Calls the Pollinations API directly from the browser, bypassing the server.
 * Each user's browser uses its own IP, distributing the rate limit.
 */

// ── Dish image prompt ──

interface DishPromptInput {
  name: { en?: string; fr?: string; zh?: string };
  description?: string;
  cuisine?: string;
}

export function buildDishImageUrl(input: DishPromptInput): string {
  const cuisineLabel =
    input.cuisine?.replace(/_restaurant$/, "").replace(/_/g, " ") ?? "international";

  const prompt = [
    `Professional food photography of "${input.name.en || input.name.fr}",`,
    `a ${cuisineLabel} cuisine dish.`,
    input.description ? `${input.description}.` : "",
    "Warm lighting, shallow depth of field, appetizing presentation on a restaurant plate.",
    "Top-down or 45-degree angle. Clean background. No text, no watermarks.",
  ]
    .filter(Boolean)
    .join(" ");

  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=768&height=768&seed=${Date.now()}&nologo=true&model=flux`;
}

// ── Poster background prompt ──

const elementLabels: Record<string, string> = {
  candlelight: "warm candlelight",
  bokeh: "bokeh lights",
  smoke: "smoke and steam rising",
  neon: "neon signs glow",
  sunset: "golden sunset glow",
  rain: "rainy window with droplets",
  spices: "colorful spices and powders",
  herbs: "fresh green herbs",
  wine: "elegant wine glasses",
  bread: "artisan bread loaves",
  pasta: "fresh handmade pasta",
  sushi: "sushi platter",
  dumpling: "steaming dumplings",
  steak: "seared steak",
  seafood: "fresh seafood and shellfish",
  fruits: "ripe fruits and grapes",
  cheese: "aged cheese selection",
  coffee: "coffee cups with steam",
  lanterns: "red lanterns",
  bamboo: "bamboo stalks",
  cherry_blossom: "cherry blossom petals",
  olive: "olive branches",
  chili: "red chili peppers",
  lemon: "citrus slices and lemon",
  wooden_table: "rustic wooden table surface",
  marble: "elegant marble surface",
  ceramic: "ceramic pottery and bowls",
  silk: "silk fabric draping",
  flowers: "fresh flower arrangement",
  leaves: "tropical green leaves",
};

const cuisineVibes: Record<string, string> = {
  chinese: "red lanterns, steam rising from wok, chopsticks, dim sum, silk textures",
  japanese: "cherry blossoms, zen garden, sushi platter, bamboo, minimalist elegance",
  japanese_fusion: "cherry blossoms mixed with modern plating, fusion of east and west",
  italian: "rustic wooden table, olive oil, fresh pasta, tomatoes, vineyard sunset",
  french: "croissants, wine glasses, Parisian cafe ambiance, butter and herbs",
  indian: "colorful spices, turmeric, curry leaves, ornate brass bowls, warm gold tones",
  thai: "tropical leaves, lemongrass, coconut, golden temple silhouette, vibrant colors",
  mexican: "vibrant tiles, chili peppers, lime, warm earth tones, festive mood",
  korean: "kimchi jars, bibimbap bowl, autumn leaves, ceramic pottery, warm hues",
  vietnamese: "pho steam, fresh herbs, lanterns, conical hat silhouette, green and gold",
  mediterranean: "olive branches, sun-drenched coast, fresh seafood, blue and white tones",
  american: "smoky barbecue, neon diner lights, burgers, rustic wood, classic comfort",
};

export function buildPosterBgUrl(cuisineType?: string, elements?: string[]): string {
  const cuisineLabel =
    cuisineType?.replace(/_restaurant$/, "").replace(/_/g, " ") || "restaurant";

  let vibes: string;
  if (elements && elements.length > 0) {
    vibes = elements.map((e) => elementLabels[e] || e).join(", ");
  } else {
    vibes =
      cuisineVibes[cuisineType || ""] ||
      "elegant fine dining, ambient candlelight, premium ingredients";
  }

  const prompt = [
    `Cinematic background photo for a ${cuisineLabel} restaurant poster.`,
    `Visual elements: ${vibes}.`,
    "Soft ambient lighting, shallow depth of field.",
    "No text, no faces, no logos, no watermarks.",
    "Dark and moody atmosphere, suitable as a background with text overlay on top.",
  ].join(" ");

  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1448&seed=${Date.now()}&nologo=true&model=flux`;
}

// ── Fetch helper ──

/**
 * Fetch an image from Pollinations and return as Blob.
 * Throws on failure.
 */
export async function fetchPollinationsImage(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Pollinations returned ${res.status}`);
  }
  return res.blob();
}
