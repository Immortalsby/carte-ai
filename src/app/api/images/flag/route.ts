import { NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { flagDishImage, deleteDishImage } from "@/lib/db/queries/images";

const flagSchema = z.object({
  canonicalTag: z.string().min(1),
  action: z.enum(["flag", "regenerate"]),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { canonicalTag, action } = flagSchema.parse(body);

    if (action === "flag") {
      await flagDishImage(canonicalTag);
    } else {
      // "regenerate" — delete cached image so next access triggers re-generation
      await deleteDishImage(canonicalTag);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
