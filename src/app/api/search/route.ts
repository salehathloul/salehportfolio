export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ works: [], posts: [] });
  }

  const [works, posts] = await Promise.all([
    db.work.findMany({
      where: {
        isPublished: true,
        OR: [
          { titleAr: { contains: q, mode: "insensitive" } },
          { titleEn: { contains: q, mode: "insensitive" } },
          { locationAr: { contains: q, mode: "insensitive" } },
          { locationEn: { contains: q, mode: "insensitive" } },
          { code: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        code: true,
        titleAr: true,
        titleEn: true,
        imageUrl: true,
        locationAr: true,
        locationEn: true,
      },
      orderBy: { order: "asc" },
      take: 5,
    }),
    db.blogPost.findMany({
      where: {
        status: "published",
        OR: [
          { titleAr: { contains: q, mode: "insensitive" } },
          { titleEn: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        slug: true,
        titleAr: true,
        titleEn: true,
        coverImage: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({ works, posts });
}
