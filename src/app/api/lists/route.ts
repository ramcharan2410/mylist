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

  const lists = await prisma.list.findMany({
    where: { userId: payload.userId },
    include: {
      _count: { select: { items: true } },
      items: { select: { isChecked: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = lists.map((l: typeof lists[number]) => ({
    id: l.id,
    name: l.name,
    userId: l.userId,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
    itemCount: l._count.items,
    checkedCount: l.items.filter((i: { isChecked: boolean }) => i.isChecked).length,
  }));

  return NextResponse.json({ data: result });
}

export async function POST(request: NextRequest) {
  const payload = await getPayload();
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "List name is required" }, { status: 400 });
  }

  const list = await prisma.list.create({
    data: { name: name.trim(), userId: payload.userId },
  });

  return NextResponse.json(
    { data: { ...list, itemCount: 0, checkedCount: 0 } },
    { status: 201 }
  );
}
