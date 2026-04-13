import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string; sizeId: string }> };

// ── PATCH /api/acquire/[id]/sizes/[sizeId] — update size ─────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sizeId } = await params;
  const body = await req.json();

  const size = await db.acquireSize.update({
    where: { id: sizeId },
    data: {
      ...(body.label !== undefined && { label: body.label }),
      ...(body.totalEditions !== undefined && { totalEditions: Number(body.totalEditions) }),
      ...(body.soldEditions !== undefined && { soldEditions: Number(body.soldEditions) }),
    },
  });
  return NextResponse.json(size);
}

// ── DELETE /api/acquire/[id]/sizes/[sizeId] — remove size ────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sizeId } = await params;
  await db.acquireSize.delete({ where: { id: sizeId } });
  return NextResponse.json({ ok: true });
}
