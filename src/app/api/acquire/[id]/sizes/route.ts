import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// ── POST /api/acquire/[id]/sizes — add a size ─────────────────────────────────

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { label, totalEditions } = await req.json();

  if (!label || !totalEditions) {
    return NextResponse.json({ error: "label and totalEditions required" }, { status: 400 });
  }

  const size = await db.acquireSize.create({
    data: {
      acquireItemId: id,
      label,
      totalEditions: Number(totalEditions),
      soldEditions: 0,
    },
  });
  return NextResponse.json(size, { status: 201 });
}
