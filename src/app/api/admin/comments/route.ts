export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ── GET /api/admin/comments — list all comments (admin) ──────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const postId = req.nextUrl.searchParams.get("postId");
  const statusFilter = req.nextUrl.searchParams.get("status"); // pending | approved | rejected | all

  const where: Record<string, unknown> = {};
  if (postId) where.postId = postId;
  if (statusFilter && statusFilter !== "all") where.status = statusFilter;

  const comments = await db.blogComment.findMany({
    where,
    include: {
      post: { select: { id: true, titleAr: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(comments);
}
