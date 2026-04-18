export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ── GET /api/admin/blog-tags ──────────────────────────────────────────────────

export async function GET() {
  const tags = await db.blogTag.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { nameAr: "asc" },
  });
  return NextResponse.json(tags);
}

// ── POST /api/admin/blog-tags ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { nameAr, nameEn, slug } = await req.json();
  if (!nameAr || !slug) {
    return NextResponse.json({ error: "nameAr and slug are required" }, { status: 400 });
  }

  const existing = await db.blogTag.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const tag = await db.blogTag.create({ data: { nameAr, nameEn: nameEn ?? "", slug } });
  return NextResponse.json(tag, { status: 201 });
}
