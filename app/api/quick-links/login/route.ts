import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();
  const envPin = process.env.AUTH_PASSWORD?.trim();
  if (typeof password === "string" && password.trim() === envPin) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("quicklinks-auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  }
  return NextResponse.json({ success: false, message: "Invalid PIN" }, { status: 401 });
}
