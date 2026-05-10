import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isFounder } from "@/lib/roles";
import { testLlmConnection } from "@/lib/llm";

const testSchema = z.object({
  provider: z.enum(["openai", "gemini"]),
  model: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFounder(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { provider, model } = testSchema.parse(body);

    const start = Date.now();
    const result = await testLlmConnection(provider, model);
    const latencyMs = Date.now() - start;

    if (result.success) {
      return NextResponse.json({
        success: true,
        provider,
        model: result.model,
        latencyMs,
        response: result.response,
      });
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 502 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", detail: error.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
