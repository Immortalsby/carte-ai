import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Global middleware to protect admin routes.
 *
 * - /admin/* pages require authentication (session cookie check)
 * - /api/auth/* is always allowed (auth endpoints)
 * - /r/* and /api/recommend are public (customer-facing)
 *
 * This is a fast cookie-presence check. Full session validation
 * happens server-side in each page/route via auth.api.getSession().
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (excluding static assets)
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Check for better-auth session cookie
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("better-auth-session_token");

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackURL", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
