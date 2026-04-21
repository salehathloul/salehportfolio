export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ slug: string }> };

// ── POST /api/blog-likes/[slug] — toggle like ──────────────────────────────────
// Body: { visitorId: string }
// Returns: { liked: boolean; likesCount: number }

export async function POST(req: NextRequest, { params }: Params) {
  const { slug } = await params;

  let visitorId: string;
  try {
    ({ visitorId } = await req.json());
    if (!visitorId || typeof visitorId !== "string") throw new Error();
  } catch {
    return NextResponse.json({ error: "visitorId required" }, { status: 400 });
  }

  const post = await db.blogPost.findUnique({
    where: { slug },
    select: { id: true, status: true, likesCount: true },
  });

  if (!post || post.status !== "published") {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const existing = await db.blogLike.findUnique({
    where: { postId_visitorId: { postId: post.id, visitorId } },
  });

  if (existing) {
    // Unlike
    await db.$transaction([
      db.blogLike.delete({ where: { postId_visitorId: { postId: post.id, visitorId } } }),
      db.blogPost.update({ where: { id: post.id }, data: { likesCount: { decrement: 1 } } }),
    ]);
    const updated = await db.blogPost.findUnique({ where: { id: post.id }, select: { likesCount: true } });
    return NextResponse.json({ liked: false, likesCount: Math.max(0, updated?.likesCount ?? 0) });
  } else {
    // Like
    await db.$transaction([
      db.blogLike.create({ data: { postId: post.id, visitorId } }),
      db.blogPost.update({ where: { id: post.id }, data: { likesCount: { increment: 1 } } }),
    ]);
    const updated = await db.blogPost.findUnique({ where: { id: post.id }, select: { likesCount: true } });
    return NextResponse.json({ liked: true, likesCount: updated?.likesCount ?? 1 });
  }
}
