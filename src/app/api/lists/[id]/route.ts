import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie } from "@/lib/cookies";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getOwned(id: string) {
  const token = await getAuthCookie();
  if (!token) return { payload: null, list: null };
  const payload = await verifyToken(token);
  if (!payload) return { payload: null, list: null };
  const list = await prisma.list.findFirst({ where: { id, userId: payload.userId } });
  return { payload, list };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { list } = await getOwned(id);
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const full = await prisma.list.findUnique({
    where: { id },
    include: { items: { orderBy: { position: "asc" } } },
  });
  return NextResponse.json({ data: full });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { list } = await getOwned(id);
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "List name is required" }, { status: 400 });
  }

  const updated = await prisma.list.update({
    where: { id },
    data: { name: name.trim() },
  });
  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { list } = await getOwned(id);
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.list.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
