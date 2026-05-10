export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { titleAr, titleEn, descriptionAr, descriptionEn, coverImage, slug, isPublished, images } = body;

  try {
    const project = await db.project.update({
      where: { id },
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

    // إذا أُرسلت صور — أعد بناءها
    if (Array.isArray(images)) {
      await db.projectImage.deleteMany({ where: { projectId: id } });
      if (images.length > 0) {
        await db.projectImage.createMany({
          data: images.map((img: { url: string; captionAr?: string; captionEn?: string; width?: number; height?: number }, i: number) => ({
            projectId: id,
            url: img.url,
            captionAr: img.captionAr || null,
            captionEn: img.captionEn || null,
            width: img.width || 0,
            height: img.height || 0,
            order: i,
          })),
        });
      }
    }

    return NextResponse.json(project);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await db.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
