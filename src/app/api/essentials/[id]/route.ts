import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie } from "@/lib/cookies";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getAuthCookie();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const essential = await prisma.essential.findFirst({
    where: { id, userId: payload.userId },
  });
  if (!essential) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.essential.delete({ where: { id } });
  return NextResponse.json({ message: "Unmarked" });
}
