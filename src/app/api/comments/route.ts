export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ── GET /api/comments?postId=xxx — list visible comments for a post ───────────

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

  const comments = await db.blogComment.findMany({
    where: { postId, isHidden: false },
    select: { id: true, name: true, content: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

// ── POST /api/comments — submit a new comment ─────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { postId, name, email, phone, content } = body;

  if (!postId || !name?.trim() || !email?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "postId, name, email, and content are required" }, { status: 400 });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Verify post exists and is published
  const post = await db.blogPost.findUnique({ where: { id: postId }, select: { status: true } });
  if (!post || post.status !== "published") {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const comment = await db.blogComment.create({
    data: {
      postId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      content: content.trim(),
    },
    select: { id: true, name: true, content: true, createdAt: true },
  });

  return NextResponse.json(comment, { status: 201 });
}
