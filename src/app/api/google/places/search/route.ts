import { NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { searchGooglePlaces } from "@/lib/google-places";

const searchSchema = z.object({
  query: z.string().min(2).max(200),
  languageCode: z.string().min(2).max(12).optional(),
  regionCode: z.string().min(2).max(2).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const input = searchSchema.parse(await request.json());
    return NextResponse.json(await searchGooglePlaces(input));
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not search Google Places.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
