import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isFebruary9Berlin } from "@/lib/klausur-date";

function isFebruary9(): boolean {
  return isFebruary9Berlin();
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isKlausurRoute =
    path.startsWith("/klausur-chat") ||
    path === "/klausur-vorbereitung-aufgabe-loesung-pro-quelle.pdf";

  if (isKlausurRoute && !isFebruary9()) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (isKlausurRoute) {
    return NextResponse.next();
  }

  if (
    (request.nextUrl.pathname.startsWith("/stop-addic") &&
      !request.nextUrl.pathname.startsWith("/stop-addic/login")) ||
    (request.nextUrl.pathname.startsWith("/eisenhower-matrix") &&
      !request.nextUrl.pathname.startsWith("/eisenhower-matrix/login"))
  ) {
    let isAuthenticated = false;

    if (request.nextUrl.pathname.startsWith("/stop-addic")) {
      const stopAddicAuthCookie = request.cookies.get("stop-addic-auth")?.value;
      isAuthenticated = stopAddicAuthCookie === "true";
    } else if (request.nextUrl.pathname.startsWith("/eisenhower-matrix")) {
      const authCookie = request.cookies.get("auth-cookie")?.value;
      isAuthenticated = authCookie === "true";
    }

    if (!isAuthenticated) {
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
  matcher: [
    "/stop-addic/:path*",
    "/eisenhower-matrix/:path*",
    "/klausur-chat/:path*",
    "/klausur-vorbereitung-aufgabe-loesung-pro-quelle.pdf",
  ],
};
