import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes — require an active Supabase session
const protectedRoutes = ["/dashboard", "/admin"];

// Auth routes — redirect logged-in users away from these
const authRoutes = ["/login", "/apply"];

/**
 * Solo-No-More Route Guard Proxy.
 * 
 * We check if the Supabase auth token cookie exists.
 * Actual JWT verification is handled in Server Components/API handlers.
 */
function hasUnexpiredSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  try {
    let raw = cookieValue;
    try {
      raw = decodeURIComponent(raw);
    } catch {}
    if (raw.startsWith("base64-")) raw = atob(raw.slice(7));
    const parsed = JSON.parse(raw);
    const token: string | undefined = Array.isArray(parsed) ? parsed[0] : parsed?.access_token;
    if (!token) return false;
    const part = token.split(".")[1];
    if (!part) return false;
    let b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const payload = JSON.parse(atob(b64));
    return typeof payload?.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Supabase session cookie name for this project
  const sessionCookie = request.cookies.get(
    "sb-dmmgzpiskyocdsxamrgf-auth-token"
  );
  // Routing hint only: an expired cookie is treated as signed-out so the user is
  // sent through /login (which silently restores the session) instead of looping.
  // The signature is verified server-side in lib/supabase/session.ts.
  const isLoggedIn = hasUnexpiredSession(sessionCookie?.value);

  // Whole path segments only: "/admin-login" is NOT under "/admin".
  const under = (route: string) => pathname === route || pathname.startsWith(route + "/");
  const isProtectedRoute = protectedRoutes.some(under);
  const isAuthRoute = authRoutes.some(under);

  // 1. Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isLoggedIn) {
    // Team → team sign-in; partner/artist hubs → their portal; everyone else → member login.
    if (under("/admin")) return NextResponse.redirect(new URL("/admin-login", request.nextUrl));
    if (under("/dashboard/partner")) return NextResponse.redirect(new URL("/portal?type=partner&mode=signin", request.nextUrl));
    if (under("/dashboard/artist")) return NextResponse.redirect(new URL("/portal?type=artist&mode=signin", request.nextUrl));
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search); // preserve destination
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirect authenticated users away from login/apply pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run proxy on all paths except:
     * - _next/static (static assets)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
