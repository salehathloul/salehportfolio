export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod/v4";

const createSchema = z.object({
  code: z.string().min(1).max(20),
  titleAr: z.string().min(1).max(200),
  titleEn: z.string().min(1).max(200),
  locationAr: z.string().max(200).optional().nullable(),
  locationEn: z.string().max(200).optional().nullable(),
  descriptionAr: z.string().max(2000).optional().nullable(),
  descriptionEn: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  dateTaken: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  mapsUrl: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  additionalImages: z.array(z.string()).optional(),
});

// GET /api/portfolio/works — list all works with category
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");

  const works = await db.work.findMany({
    where: categoryId
      ? {
          OR: [
            { categoryId },
            { categories: { some: { id: categoryId } } },
          ],
        }
      : undefined,
    include: {
      category: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
      categories: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(works);
}

// POST /api/portfolio/works — create a new work
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

  // Check code uniqueness
  const existing = await db.work.findUnique({ where: { code: parsed.data.code } });
  if (existing) {
    return NextResponse.json({ error: "رقم العمل مستخدم مسبقاً" }, { status: 409 });
  }

  // Assign order = max + 1
  const maxOrder = await db.work.aggregate({ _max: { order: true } });
  const order = (maxOrder._max.order ?? 0) + 1;

  const { additionalImages, categoryIds, ...workData } = parsed.data;

  const work = await db.work.create({
    data: {
      ...workData,
      order,
      dateTaken: workData.dateTaken ? new Date(workData.dateTaken) : null,
      categories: categoryIds?.length
        ? { connect: categoryIds.map((id) => ({ id })) }
        : undefined,
      images: additionalImages?.length
        ? { create: additionalImages.map((url, i) => ({ url, order: i })) }
        : undefined,
    },
    include: {
      category: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
      categories: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
      images: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json(work, { status: 201 });
}
