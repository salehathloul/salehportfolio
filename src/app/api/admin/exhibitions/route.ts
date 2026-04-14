import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db.exhibition.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }, { order: "asc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const item = await db.exhibition.create({
    data: {
      titleAr: body.titleAr ?? "",
      titleEn: body.titleEn ?? "",
      locationAr: body.locationAr || null,
      locationEn: body.locationEn || null,
      year: Number(body.year) || new Date().getFullYear(),
      month: body.month ? Number(body.month) : null,
      type: body.type ?? "solo",
      descriptionAr: body.descriptionAr || null,
      descriptionEn: body.descriptionEn || null,
      order: Number(body.order) || 0,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
