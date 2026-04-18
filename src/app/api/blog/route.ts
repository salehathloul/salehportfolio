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
      scheduledAt: true,
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

  const { slug, titleAr, titleEn, coverImage, contentAr, contentEn, status, scheduledAt } = body;

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
      status: scheduledAt ? "draft" : (status ?? "draft"),
      publishedAt: status === "published" && !scheduledAt ? new Date() : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
