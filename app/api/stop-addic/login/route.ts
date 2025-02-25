import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();
  const envPassword = process.env.STOP_ADDIC_PASSWORD?.trim();
  if (password.trim() === envPassword) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("stop-addic-auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/stop-addic",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  }

  return NextResponse.json({ success: false }, { status: 401 });
}
