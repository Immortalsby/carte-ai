import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
const TIMEOUT = 15_000;

/** POST /api/ingest/fetch-url — Download an image from a URL (server-side proxy to bypass CORS) */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await request.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  // Basic URL validation
  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "CarteAI-MenuImporter/1.0" },
    });
    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 422 });
    }

    const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() || "";
    if (!ALLOWED_TYPES.some((t) => contentType.startsWith(t))) {
      return NextResponse.json({ error: `Unsupported type: ${contentType}` }, { status: 422 });
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 422 });
    }

    // Derive filename from URL path
    const pathParts = parsed.pathname.split("/");
    const filename = pathParts[pathParts.length - 1] || "image.jpg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Content-Type": contentType,
        "X-Filename": filename,
      },
    });
  } catch (err) {
    const msg = err instanceof Error && err.name === "AbortError" ? "Timeout" : "Download failed";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
