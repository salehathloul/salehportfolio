export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// ── GET /api/blog/[id] ────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const post = await db.blogPost.findUnique({
    where: { id },
    include: { tags: true },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(post);
}

// ── PUT /api/blog/[id] ────────────────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const { slug, titleAr, titleEn, coverImage, contentAr, contentEn, status, signatureDisabled, tagIds, scheduledAt } = body;

  // Slug uniqueness check (skip self)
  if (slug) {
    const existing = await db.blogPost.findFirst({
      where: { slug, NOT: { id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
  }

  const current = await db.blogPost.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const wasPublished = current.status === "published";
  const nowPublishing = status === "published" && !wasPublished;
  // If scheduledAt is set, keep status as draft until cron fires
  const effectiveStatus = scheduledAt ? "draft" : status;

  const post = await db.blogPost.update({
    where: { id },
    data: {
      ...(slug && { slug }),
      ...(titleAr !== undefined && { titleAr }),
      ...(titleEn !== undefined && { titleEn }),
      ...(coverImage !== undefined && { coverImage }),
      ...(contentAr !== undefined && { contentAr }),
      ...(contentEn !== undefined && { contentEn }),
      ...(effectiveStatus !== undefined && { status: effectiveStatus }),
      ...(signatureDisabled !== undefined && { signatureDisabled }),
      ...(nowPublishing && !scheduledAt && { publishedAt: new Date() }),
      scheduledAt: scheduledAt !== undefined
        ? (scheduledAt ? new Date(scheduledAt) : null)
        : undefined,
      ...(Array.isArray(tagIds) && {
        tags: { set: tagIds.map((tid: string) => ({ id: tid })) },
      }),
    },
    include: { tags: true },
  });

  return NextResponse.json(post);
}

// ── DELETE /api/blog/[id] ─────────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await db.blogPost.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
