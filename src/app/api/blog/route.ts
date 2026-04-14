export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ── GET /api/blog — list posts ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status"); // optional filter

  const posts = await db.blogPost.findMany({
    where: status ? { status } : undefined,
    select: {
      id: true,
      slug: true,
      titleAr: true,
      titleEn: true,
      coverImage: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}

// ── POST /api/blog — create post ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const { slug, titleAr, titleEn, coverImage, contentAr, contentEn, status } = body;

  if (!titleAr || !slug) {
    return NextResponse.json({ error: "titleAr and slug are required" }, { status: 400 });
  }

  // Check slug uniqueness
  const existing = await db.blogPost.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const post = await db.blogPost.create({
    data: {
      slug,
      titleAr,
      titleEn: titleEn ?? "",
      coverImage: coverImage ?? null,
      contentAr: contentAr ?? {},
      contentEn: contentEn ?? null,
      status: status ?? "draft",
      publishedAt: status === "published" ? new Date() : null,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
