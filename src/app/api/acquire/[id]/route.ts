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

  const item = await db.acquireItem.update({
    where: { id },
    data: {
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.specs !== undefined && { specs: body.specs }),
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
