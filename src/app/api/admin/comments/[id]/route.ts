export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// ── PATCH /api/admin/comments/[id] — update status ───────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const validStatuses = ["pending", "approved", "rejected", "deleted"];
  if (!body.status || !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const comment = await db.blogComment.update({
    where: { id },
    data: { status: body.status },
  });

  return NextResponse.json(comment);
}

// ── DELETE /api/admin/comments/[id] — delete comment ─────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.blogComment.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
