import { NextResponse } from "next/server";
import { verifyTurnstile } from "@/lib/turnstile";
import crypto from "crypto";

/**
 * One-time Turnstile verification → sets an httpOnly cookie.
 * Subsequent API calls check for this cookie instead of re-verifying the token.
 */
export async function POST(request: Request) {
  try {
    const { token } = (await request.json()) as { token: string };
    if (!token) {
      return NextResponse.json({ verified: false }, { status: 400 });
    }

    const valid = await verifyTurnstile(token);
    if (!valid) {
      return NextResponse.json({ verified: false }, { status: 403 });
    }

    // Generate a signed session value: timestamp + HMAC
    const secret = process.env.TURNSTILE_SECRET_KEY || "dev-secret";
    const ts = Date.now().toString(36);
    const sig = crypto.createHmac("sha256", secret).update(ts).digest("hex").slice(0, 16);
    const cookieValue = `${ts}.${sig}`;

    const res = NextResponse.json({ verified: true });
    res.cookies.set("carte_verified", cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 30, // 30 minutes
    });
    return res;
  } catch {
    return NextResponse.json({ verified: false }, { status: 400 });
  }
}
