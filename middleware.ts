import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check for protected routes in both sections
  if (
    (request.nextUrl.pathname.startsWith("/stop-addic") &&
      !request.nextUrl.pathname.startsWith("/stop-addic/login")) ||
    (request.nextUrl.pathname.startsWith("/eisenhower-matrix") &&
      !request.nextUrl.pathname.startsWith("/eisenhower-matrix/login"))
  ) {
    // Check for the appropriate cookie based on the route
    let isAuthenticated = false;

    if (request.nextUrl.pathname.startsWith("/stop-addic")) {
      const stopAddicAuthCookie = request.cookies.get("stop-addic-auth")?.value;
      isAuthenticated = stopAddicAuthCookie === "true";
    } else if (request.nextUrl.pathname.startsWith("/eisenhower-matrix")) {
      const authCookie = request.cookies.get("auth-cookie")?.value;
      isAuthenticated = authCookie === "true";
    }

    if (!isAuthenticated) {
      // Redirect to the appropriate login page based on the path
      if (request.nextUrl.pathname.startsWith("/stop-addic")) {
        return NextResponse.redirect(new URL("/stop-addic/login", request.url));
      } else if (request.nextUrl.pathname.startsWith("/eisenhower-matrix")) {
        return NextResponse.redirect(
          new URL("/eisenhower-matrix/login", request.url)
        );
      }
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/stop-addic/:path*", "/eisenhower-matrix/:path*"],
};
