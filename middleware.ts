// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Protect /stop-addic routes
  if (
    request.nextUrl.pathname.startsWith("/stop-addic") &&
    !request.nextUrl.pathname.startsWith("/stop-addic/login")
  ) {
    const authCookie = request.cookies.get("stop-addic-auth")?.value;
    if (authCookie !== "true") {
      return NextResponse.redirect(new URL("/stop-addic/login", request.url));
    }
  }

  // Protect /eisenhower-matrix routes
  if (
    request.nextUrl.pathname.startsWith("/eisenhower-matrix") &&
    !request.nextUrl.pathname.startsWith("/eisenhower-matrix/login")
  ) {
    const matrixCookie = request.cookies.get("matrix-auth")?.value;
    if (matrixCookie !== "true") {
      return NextResponse.redirect(
        new URL("/eisenhower-matrix/login", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/stop-addic/:path*", "/eisenhower-matrix/:path*"],
};
