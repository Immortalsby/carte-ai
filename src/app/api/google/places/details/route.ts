import { NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getGooglePlaceDetails } from "@/lib/google-places";

const detailsSchema = z.object({
  placeId: z.string().min(3).max(240),
  languageCode: z.string().min(2).max(12).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const input = detailsSchema.parse(await request.json());
    return NextResponse.json(await getGooglePlaceDetails(input));
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not load Google Place details.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
