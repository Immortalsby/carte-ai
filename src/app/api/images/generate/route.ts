import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getOrGenerateDishImage } from "@/lib/dish-image-service";

const generateSchema = z.object({
  name: z.object({
    en: z.string().optional(),
    fr: z.string().optional(),
    zh: z.string().optional(),
  }),
  description: z.string().optional(),
  cuisine: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  source: z.enum(["auto", "ai"]).optional(),
});

export async function POST(request: Request) {
  try {
    // Auth required — only restaurant owners can trigger image generation
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = generateSchema.parse(body);

    const result = await getOrGenerateDishImage(parsed, parsed.source ?? "auto");

    if (!result) {
      return NextResponse.json(
        { error: "Unable to find or generate image" },
        { status: 404 },
      );
    }

    return NextResponse.json(result, { status: result.isNew ? 201 : 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", detail: error.flatten() },
        { status: 400 },
      );
    }
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[API] images/generate error:", msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 },
    );
  }
}
