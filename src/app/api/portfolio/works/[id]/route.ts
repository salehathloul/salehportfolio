export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod/v4";

const updateSchema = z.object({
  code: z.string().min(1).max(20).optional(),
  titleAr: z.string().min(1).max(200).optional(),
  titleEn: z.string().min(1).max(200).optional(),
  locationAr: z.string().max(200).nullable().optional(),
  locationEn: z.string().max(200).nullable().optional(),
  descriptionAr: z.string().max(2000).nullable().optional(),
  descriptionEn: z.string().max(2000).nullable().optional(),
  imageUrl: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  dateTaken: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional().transform(v => v === "" ? null : v),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  mapsUrl: z.string().optional().nullable(),
  keywords: z.string().max(500).optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  additionalImages: z.array(z.string()).optional(),
});

type Params = { params: Promise<{ id: string }> };

// GET /api/portfolio/works/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const work = await db.work.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
      categories: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
      images: { orderBy: { order: "asc" } },
    },
  });
  if (!work) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(work);
}

// PUT /api/portfolio/works/[id]
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

  // Check code uniqueness if being changed
  if (parsed.data.code) {
    const conflict = await db.work.findFirst({
      where: { code: parsed.data.code, NOT: { id } },
    });
    if (conflict) {
      return NextResponse.json({ error: "رقم العمل مستخدم مسبقاً" }, { status: 409 });
    }
  }

  const { additionalImages, categoryIds, scheduledAt, ...rest } = parsed.data;

  // If scheduledAt is being set, force isPublished = false
  const isPublished =
    scheduledAt !== undefined && scheduledAt !== null
      ? false
      : rest.isPublished;

  const data = {
    ...rest,
    isPublished,
    dateTaken:
      rest.dateTaken !== undefined
        ? rest.dateTaken ? new Date(rest.dateTaken) : null
        : undefined,
    scheduledAt:
      scheduledAt !== undefined
        ? scheduledAt ? new Date(scheduledAt) : null
        : undefined,
  };

  // Update work + replace all additional images + update categories atomically
  try {
    const work = await db.$transaction(async (tx) => {
      const updated = await tx.work.update({
        where: { id },
        data: {
          ...data,
          ...(categoryIds !== undefined && {
            categories: {
              set: categoryIds.map((cid) => ({ id: cid })),
            },
          }),
        },
        include: {
          category: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
          categories: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
          images: { orderBy: { order: "asc" } },
        },
      });
      if (additionalImages !== undefined) {
        await tx.workImage.deleteMany({ where: { workId: id } });
        if (additionalImages.length > 0) {
          await tx.workImage.createMany({
            data: additionalImages.map((url, i) => ({ workId: id, url, order: i })),
          });
        }
      }
      return updated;
    });
    return NextResponse.json(work);
  } catch (err) {
    console.error("[PUT /api/portfolio/works/:id]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/portfolio/works/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Prevent deleting if it has an acquire item
  const work = await db.work.findUnique({
    where: { id },
    include: { acquireItem: { select: { id: true } } },
  });
  if (!work) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (work.acquireItem) {
    return NextResponse.json(
      { error: "لا يمكن حذف عمل مرتبط باقتناء — احذف الاقتناء أولاً" },
      { status: 409 }
    );
  }

  await db.work.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
