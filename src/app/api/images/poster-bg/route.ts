import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";

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

const schema = z.object({
  cuisineType: z.string().optional(),
  elements: z.array(z.string()).optional(),
});

/**
 * Server-side proxy for Pollinations AI poster background generation.
 * Needed because Pollinations enforces Cloudflare Turnstile on direct browser requests.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { cuisineType, elements } = schema.parse(body);

    const cuisineLabel = cuisineType?.replace(/_restaurant$/, "").replace(/_/g, " ") || "restaurant";

    // Build visual elements from user selection, or fall back to cuisine defaults
    let vibes: string;
    if (elements && elements.length > 0) {
      vibes = elements
        .map((e) => elementLabels[e] || e)
        .join(", ");
    } else {
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
      vibes = cuisineVibes[cuisineType || ""] || "elegant fine dining, ambient candlelight, premium ingredients";
    }

    const prompt = [
      `Cinematic background photo for a ${cuisineLabel} restaurant poster.`,
      `Visual elements: ${vibes}.`,
      "Soft ambient lighting, shallow depth of field.",
      "No text, no faces, no logos, no watermarks.",
      "Dark and moody atmosphere, suitable as a background with text overlay on top.",
    ].join(" ");

    const encodedPrompt = encodeURIComponent(prompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1448&seed=${Date.now()}&nologo=true&model=flux`;

    const imageRes = await fetch(pollinationsUrl);
    if (!imageRes.ok) {
      throw new Error(`Pollinations returned ${imageRes.status}`);
    }

    const imageBuffer = await imageRes.arrayBuffer();
    const contentType = imageRes.headers.get("content-type") || "image/jpeg";

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[API] poster-bg error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
