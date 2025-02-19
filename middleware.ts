// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Protect any route under /stop-addic except the login page.
  if (
    request.nextUrl.pathname.startsWith("/stop-addic") &&
    !request.nextUrl.pathname.startsWith("/stop-addic/login")
  ) {
    const authCookie = request.cookies.get("stop-addic-auth")?.value;
    // Check that the cookie exists and has the value "true"
    if (authCookie !== "true") {
      // Redirect to the login page
      const loginUrl = new URL("/stop-addic/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/stop-addic/:path*"],
};
