export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// ── PUT /api/admin/blog-tags/[id] ─────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { nameAr, nameEn, slug } = await req.json();

  if (slug) {
    const existing = await db.blogTag.findFirst({ where: { slug, NOT: { id } } });
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
  }

  const tag = await db.blogTag.update({
    where: { id },
    data: {
      ...(nameAr !== undefined && { nameAr }),
      ...(nameEn !== undefined && { nameEn }),
      ...(slug !== undefined && { slug }),
    },
  });
  return NextResponse.json(tag);
}

// ── DELETE /api/admin/blog-tags/[id] ──────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.blogTag.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
