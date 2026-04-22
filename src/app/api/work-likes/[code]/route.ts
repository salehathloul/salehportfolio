export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ code: string }> };

// GET /api/work-likes/[code] — fetch count
export async function GET(_req: NextRequest, { params }: Params) {
  const { code } = await params;
  const work = await db.work.findFirst({
    where: { code, isPublished: true },
    select: { id: true, likesCount: true },
  });
  if (!work) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ likesCount: work.likesCount });
}

// POST /api/work-likes/[code] — toggle like
// Body: { visitorId: string }
export async function POST(req: NextRequest, { params }: Params) {
  const { code } = await params;

  let visitorId: string;
  try {
    ({ visitorId } = await req.json());
    if (!visitorId || typeof visitorId !== "string") throw new Error();
  } catch {
    return NextResponse.json({ error: "visitorId required" }, { status: 400 });
  }

  const work = await db.work.findFirst({
    where: { code, isPublished: true },
    select: { id: true, likesCount: true },
  });
  if (!work) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await db.workLike.findUnique({
    where: { workId_visitorId: { workId: work.id, visitorId } },
  });

  if (existing) {
    // Unlike
    await db.$transaction([
      db.workLike.delete({ where: { workId_visitorId: { workId: work.id, visitorId } } }),
      db.work.update({ where: { id: work.id }, data: { likesCount: { decrement: 1 } } }),
    ]);
    const updated = await db.work.findUnique({ where: { id: work.id }, select: { likesCount: true } });
    return NextResponse.json({ liked: false, likesCount: Math.max(0, updated?.likesCount ?? 0) });
  } else {
    // Like
    await db.$transaction([
      db.workLike.create({ data: { workId: work.id, visitorId } }),
      db.work.update({ where: { id: work.id }, data: { likesCount: { increment: 1 } } }),
    ]);
    const updated = await db.work.findUnique({ where: { id: work.id }, select: { likesCount: true } });
    return NextResponse.json({ liked: true, likesCount: updated?.likesCount ?? 1 });
  }
}
