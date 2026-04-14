export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod/v4";

const schema = z.object({
  // Array of { id, order } pairs
  items: z.array(z.object({ id: z.string(), order: z.number().int().min(0) })),
});

// PUT /api/portfolio/works/reorder
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 422 });
  }

  // Batch update orders in a transaction
  await db.$transaction(
    parsed.data.items.map(({ id, order }) =>
      db.work.update({ where: { id }, data: { order } })
    )
  );

  return NextResponse.json({ success: true });
}
