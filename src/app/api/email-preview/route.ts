import { NextResponse } from "next/server";

/**
 * DEV ONLY — Preview email templates in browser.
 * Visit: /api/email-preview?template=welcome&name=Jean+Dupont
 *        /api/email-preview?template=admin&name=Jean+Dupont&email=jean@example.com
 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  // Dynamic import to avoid bundling email logic in production preview
  const { _previewWelcomeEmail, _previewAdminEmail, _previewPasswordResetEmail } = await import("@/lib/email-preview");

  const url = new URL(req.url);
  const template = url.searchParams.get("template") ?? "welcome";
  const name = url.searchParams.get("name") ?? "Jean Dupont";
  const email = url.searchParams.get("email") ?? "jean@restaurant-etoile.fr";

  let html: string;
  switch (template) {
    case "admin":
      html = _previewAdminEmail({ name, email });
      break;
    case "reset":
      html = _previewPasswordResetEmail({ name, email, url: "https://carte-ai.link/api/auth/reset-password/demo-token?callbackURL=%2Freset-password" });
      break;
    default:
      html = _previewWelcomeEmail({ name, email });
  }

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
