import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie } from "@/lib/cookies";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getOwnedItem(itemId: string, userId: string) {
  return prisma.item.findFirst({
    where: { id: itemId, list: { userId } },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getAuthCookie();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await getOwnedItem(id, payload.userId);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const updated = await prisma.item.update({
    where: { id },
    data: {
      ...(body.isChecked !== undefined && { isChecked: body.isChecked }),
      ...(body.quantityValue !== undefined && { quantityValue: body.quantityValue }),
      ...(body.quantityUnit !== undefined && { quantityUnit: body.quantityUnit }),
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getAuthCookie();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await getOwnedItem(id, payload.userId);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.item.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}
