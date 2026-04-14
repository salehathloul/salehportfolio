export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// ── GET /api/portfolio/works/[id]/images ──────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const images = await db.workImage.findMany({
    where: { workId: id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(images);
}

// ── POST /api/portfolio/works/[id]/images — add image to work ─────────────────

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { url, order } = body as { url: string; order?: number };

  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  // Auto-assign order if not provided
  const maxOrder = await db.workImage.aggregate({ where: { workId: id }, _max: { order: true } });
  const nextOrder = order ?? (maxOrder._max.order ?? -1) + 1;

  const image = await db.workImage.create({
    data: { workId: id, url, order: nextOrder },
  });
  return NextResponse.json(image);
}
