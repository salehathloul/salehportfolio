export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// ── PATCH /api/acquire/[id] — toggle isActive ─────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // If scheduledAt is set, keep isActive = false until cron fires
  const isActive = body.scheduledAt
    ? false
    : body.isActive !== undefined ? body.isActive : undefined;

  const item = await db.acquireItem.update({
    where: { id },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(body.specs !== undefined && { specs: body.specs }),
      ...(body.scheduledAt !== undefined && {
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      }),
    },
    include: { sizes: true },
  });
  return NextResponse.json(item);
}

// ── DELETE /api/acquire/[id] — remove acquire item ────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Delete sizes first (cascade not guaranteed for all DBs)
  await db.acquireSize.deleteMany({ where: { acquireItemId: id } });
  await db.acquireItem.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
