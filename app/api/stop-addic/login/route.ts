import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();
  // Use the same password for both sites
  const envPassword = process.env.AUTH_PASSWORD?.trim();
  if (password.trim() === envPassword) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("stop-addic-auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/", // Makes cookie available across the entire app
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return response;
  }
  return NextResponse.json({ success: false }, { status: 401 });
}
