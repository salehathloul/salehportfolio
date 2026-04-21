export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendNewCommentNotification } from "@/lib/email";

// ── GET /api/comments?postId=xxx — list approved comments for a post ──────────

export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

  const comments = await db.blogComment.findMany({
    where: { postId, status: "approved" },
    select: { id: true, name: true, content: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

// ── POST /api/comments — submit a new comment (saved as pending) ──────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { postId, name, email, phone, content } = body;

  if (!postId || !name?.trim() || !email?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "postId, name, email, and content are required" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const post = await db.blogPost.findUnique({
    where: { id: postId },
    select: { status: true, titleAr: true, titleEn: true, slug: true },
  });
  if (!post || post.status !== "published") {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  await db.blogComment.create({
    data: {
      postId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      content: content.trim(),
      status: "approved",
    },
  });

  // إشعار إيميل للمالك — fire-and-forget
  sendNewCommentNotification({
    postTitleAr: post.titleAr,
    postSlug: post.slug,
    commenterName: name.trim(),
    commenterEmail: email.trim(),
    content: content.trim(),
  }).catch(() => {});

  return NextResponse.json({ ok: true }, { status: 201 });
}
