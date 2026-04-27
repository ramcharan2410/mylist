import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie } from "@/lib/cookies";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getPayload() {
  const token = await getAuthCookie();
  if (!token) return null;
  return verifyToken(token);
}

export async function GET() {
  const payload = await getPayload();
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const essentials = await prisma.essential.findMany({
    where: { userId: payload.userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, userId: true, createdAt: true },
  });

  return NextResponse.json({ data: essentials });
}

export async function POST(request: NextRequest) {
  const payload = await getPayload();
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const name = (body?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  try {
    const essential = await prisma.essential.create({
      data: { name, userId: payload.userId },
      select: { id: true, name: true, userId: true, createdAt: true },
    });
    return NextResponse.json({ data: essential }, { status: 201 });
  } catch (err: unknown) {
    // Unique constraint violation — item already in essentials
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "Already in Essentials" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to add to Essentials" }, { status: 500 });
  }
}
