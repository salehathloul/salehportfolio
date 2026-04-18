export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await db.testimonial.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const item = await db.testimonial.create({
    data: {
      nameAr: body.nameAr ?? "",
      nameEn: body.nameEn ?? null,
      roleAr: body.roleAr ?? null,
      roleEn: body.roleEn ?? null,
      textAr: body.textAr ?? "",
      textEn: body.textEn ?? null,
      imageUrl: body.imageUrl ?? null,
      isVisible: body.isVisible ?? true,
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
