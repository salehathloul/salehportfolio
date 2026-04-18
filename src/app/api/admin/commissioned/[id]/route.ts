export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ── PUT /api/admin/commissioned/[id] — update status and/or notes ─────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status, notes } = body;

  const VALID_STATUSES = ["new", "reviewing", "accepted", "rejected"];
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await db.commissionRequest.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(typeof notes === "string" ? { notes } : {}),
    },
  });

  return NextResponse.json(updated);
}
