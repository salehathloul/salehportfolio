import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// PATCH /api/portfolio/works/bulk
// Body: { ids: string[]; updates: { categoryId?: string | null; isFeatured?: boolean } }
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { ids?: unknown; updates?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ids = body.ids;
  const updates = body.updates;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
  }

  if (typeof updates !== "object" || updates === null) {
    return NextResponse.json({ error: "updates must be an object" }, { status: 400 });
  }

  const upd = updates as Record<string, unknown>;

  // Build the Prisma update data — only include fields that were sent
  const data: Record<string, unknown> = {};
  if ("categoryId" in upd) data.categoryId = upd.categoryId === null ? null : String(upd.categoryId);
  if ("isFeatured" in upd) data.isFeatured = Boolean(upd.isFeatured);
  if ("isPublished" in upd) data.isPublished = Boolean(upd.isPublished);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  await db.work.updateMany({
    where: { id: { in: ids as string[] } },
    data,
  });

  // Return updated works so client can sync state
  const updated = await db.work.findMany({
    where: { id: { in: ids as string[] } },
    select: { id: true, categoryId: true, isFeatured: true, isPublished: true },
  });

  return NextResponse.json({ updated, count: updated.length });
}
