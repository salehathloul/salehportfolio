export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const item = await db.testimonial.update({
    where: { id },
    data: {
      nameAr: body.nameAr,
      nameEn: body.nameEn ?? null,
      roleAr: body.roleAr ?? null,
      roleEn: body.roleEn ?? null,
      textAr: body.textAr,
      textEn: body.textEn ?? null,
      imageUrl: body.imageUrl ?? null,
      isVisible: body.isVisible,
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.testimonial.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
