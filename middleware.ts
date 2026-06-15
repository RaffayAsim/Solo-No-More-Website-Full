import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes — require an active Supabase session
const protectedRoutes = ["/dashboard"];

// Auth routes — redirect logged-in users away from these
const authRoutes = ["/login", "/apply"];

/**
 * Solo-No-More Route Guard Middleware.
 * 
 * We check if the Supabase auth token cookie exists.
 * Actual JWT verification is handled in Server Components/API handlers.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Supabase session cookie name for this project
  const sessionCookie = request.cookies.get(
    "sb-dmmgzpiskyocdsxamrgf-auth-token"
  );
  const isLoggedIn = !!sessionCookie?.value;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // 1. Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("next", pathname); // preserve destination
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
     * Run middleware on all paths except:
     * - _next/static (static assets)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
