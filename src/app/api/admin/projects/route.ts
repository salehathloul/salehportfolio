export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await db.project.findMany({
    orderBy: { order: "asc" },
    include: { images: { orderBy: { order: "asc" }, select: { id: true, url: true, order: true } } },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { titleAr, titleEn, descriptionAr, descriptionEn, coverImage, slug, isPublished } = body;

  if (!titleAr || !coverImage || !slug) {
    return NextResponse.json({ error: "titleAr, coverImage, slug مطلوبة" }, { status: 400 });
  }

  try {
    const project = await db.project.create({
      data: {
        titleAr,
        titleEn: titleEn || titleAr,
        descriptionAr: descriptionAr || null,
        descriptionEn: descriptionEn || null,
        coverImage,
        slug,
        isPublished: isPublished ?? true,
      },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
