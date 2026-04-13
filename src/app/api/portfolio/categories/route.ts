import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod/v4";

const createSchema = z.object({
  nameAr: z.string().min(1).max(100),
  nameEn: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "slug: lowercase letters, numbers, hyphens only"),
});

// GET /api/portfolio/categories
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await db.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { works: true } } },
  });

  return NextResponse.json(categories);
}

// POST /api/portfolio/categories
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 422 });
  }

  const existing = await db.category.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "هذا الـ slug مستخدم مسبقاً" }, { status: 409 });
  }

  const maxOrder = await db.category.aggregate({ _max: { order: true } });
  const order = (maxOrder._max.order ?? 0) + 1;

  const category = await db.category.create({
    data: { ...parsed.data, order },
    include: { _count: { select: { works: true } } },
  });

  return NextResponse.json(category, { status: 201 });
}
