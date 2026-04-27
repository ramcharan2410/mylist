import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie } from "@/lib/cookies";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getAuthCookie();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await prisma.list.findFirst({ where: { id, userId: payload.userId } });
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, quantityValue, quantityUnit } = await request.json();

  if (!name?.trim() || !quantityValue || !quantityUnit) {
    return NextResponse.json(
      { error: "name, quantityValue and quantityUnit are required" },
      { status: 400 }
    );
  }

  const existing = await prisma.item.findFirst({
    where: { listId: id, name: { equals: name.trim(), mode: "insensitive" } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Item already exists", existingId: existing.id },
      { status: 409 }
    );
  }

  const lastItem = await prisma.item.findFirst({
    where: { listId: id },
    orderBy: { position: "desc" },
  });
  const position = (lastItem?.position ?? -1) + 1;

  const item = await prisma.item.create({
    data: { name: name.trim(), quantityValue, quantityUnit, listId: id, position },
  });

  return NextResponse.json({ data: item }, { status: 201 });
}
