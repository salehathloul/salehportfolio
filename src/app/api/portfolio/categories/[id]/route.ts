export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod/v4";

const updateSchema = z.object({
  nameAr: z.string().min(1).max(100).optional(),
  nameEn: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
});

type Params = { params: Promise<{ id: string }> };

// PUT /api/portfolio/categories/[id]
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 422 });
  }

  if (parsed.data.slug) {
    const conflict = await db.category.findFirst({
      where: { slug: parsed.data.slug, NOT: { id } },
    });
    if (conflict) {
      return NextResponse.json({ error: "هذا الـ slug مستخدم مسبقاً" }, { status: 409 });
    }
  }

  const category = await db.category.update({
    where: { id },
    data: parsed.data,
    include: { _count: { select: { works: true } } },
  });

  return NextResponse.json(category);
}

// DELETE /api/portfolio/categories/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const count = await db.work.count({ where: { categoryId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `لا يمكن حذف التصنيف — يحتوي على ${count} عمل` },
      { status: 409 }
    );
  }

  await db.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
