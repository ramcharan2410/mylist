import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";
import { setAuthCookie } from "@/lib/cookies";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email?.trim() || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await signToken({ userId: user.id, email: user.email });
  await setAuthCookie(token);

  return NextResponse.json({
    data: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
  });
}
