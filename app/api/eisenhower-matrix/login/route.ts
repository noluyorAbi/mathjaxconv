// app/api/eisenhower-matrix/login/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();
  const envPassword = process.env.MATRIX_PASSWORD?.trim(); // Use a different env var if needed
  if (password.trim() === envPassword) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("matrix-auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/eisenhower-matrix",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  }
  return NextResponse.json({ success: false }, { status: 401 });
}
