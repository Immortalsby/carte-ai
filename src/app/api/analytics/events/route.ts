import { NextResponse } from "next/server";
import { z } from "zod";
import { writeEvent } from "@/lib/db/queries/analytics";
import { eventsRateLimit } from "@/lib/rate-limit";

const eventSchema = z.object({
  tenant_id: z.string().uuid(),
  event_type: z.enum([
    "scan",
    "recommend_view",
    "adoption",
    "dwell",
    "mode_switch",
    "share",
    "culture_match",
    "review_click",
  ]),
  payload: z.record(z.string(), z.unknown()).optional(),
  session_id: z.string().optional(),
  language: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success } = await eventsRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = eventSchema.parse(body);
    await writeEvent(parsed);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", detail: error.flatten() },
        { status: 400 },
      );
    }
    console.error("[API] analytics/events error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
