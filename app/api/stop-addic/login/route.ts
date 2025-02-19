// app/api/stop-addic/login/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();

  // Ensure both values are trimmed to avoid whitespace issues.
  const envPassword = process.env.STOP_ADDIC_PASSWORD?.trim();
  if (password.trim() === envPassword) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("stop-addic-auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/stop-addic", // restrict the cookie to the protected path
      maxAge: 60 * 60 * 24 * 7, // valid for 7 days
    });
    return response;
  } else {
    return NextResponse.json({ success: false }, { status: 401 });
  }
}
