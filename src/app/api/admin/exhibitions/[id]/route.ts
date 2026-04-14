import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const item = await db.exhibition.update({
    where: { id },
    data: {
      ...(body.titleAr !== undefined && { titleAr: body.titleAr }),
      ...(body.titleEn !== undefined && { titleEn: body.titleEn }),
      ...(body.locationAr !== undefined && { locationAr: body.locationAr || null }),
      ...(body.locationEn !== undefined && { locationEn: body.locationEn || null }),
      ...(body.year !== undefined && { year: Number(body.year) }),
      ...(body.month !== undefined && { month: body.month ? Number(body.month) : null }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.descriptionAr !== undefined && { descriptionAr: body.descriptionAr || null }),
      ...(body.descriptionEn !== undefined && { descriptionEn: body.descriptionEn || null }),
      ...(body.order !== undefined && { order: Number(body.order) }),
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.exhibition.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
