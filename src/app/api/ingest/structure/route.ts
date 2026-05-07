import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { structureMenuWithLlm } from "@/lib/llm";
import { parseMenu, sanitizeRawMenu } from "@/lib/menu";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const ocrText = body.ocrText;

  if (!ocrText || typeof ocrText !== "string") {
    return NextResponse.json({ error: "Missing ocrText" }, { status: 400 });
  }

  try {
    const raw = await structureMenuWithLlm(ocrText);

    if (!raw || !Array.isArray(raw.dishes) || raw.dishes.length === 0) {
      return NextResponse.json({ error: "Could not structure menu from OCR text" }, { status: 422 });
    }

    const menu = parseMenu(sanitizeRawMenu(raw as unknown as Record<string, unknown>));

    return NextResponse.json({
      status: "draft_ready",
      dishCount: menu.dishes.length,
      draftMenu: menu,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Structuring failed" },
      { status: 500 },
    );
  }
}
