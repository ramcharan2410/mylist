import { NextRequest, NextResponse } from "next/server";
import { getAuthCookie } from "@/lib/cookies";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getAuthCookie();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const original = await prisma.list.findFirst({
    where: { id, userId: payload.userId },
    include: { items: { orderBy: { position: "asc" } } },
  });
  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const copy = await prisma.list.create({
    data: {
      name: `${original.name} (copy)`,
      userId: payload.userId,
      items: {
        create: original.items.map((item: typeof original.items[number]) => ({
          name: item.name,
          quantityValue: item.quantityValue,
          quantityUnit: item.quantityUnit,
          isChecked: false,
          position: item.position,
        })),
      },
    },
    include: {
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json(
    {
      data: {
        id: copy.id,
        name: copy.name,
        userId: copy.userId,
        createdAt: copy.createdAt,
        updatedAt: copy.updatedAt,
        itemCount: copy._count.items,
        checkedCount: 0,
      },
    },
    { status: 201 }
  );
}
