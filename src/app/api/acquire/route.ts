import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ── GET /api/acquire — list all acquire items with sizes + work info ──────────

export async function GET() {
  const items = await db.acquireItem.findMany({
    include: {
      work: {
        select: {
          id: true,
          code: true,
          titleAr: true,
          titleEn: true,
          imageUrl: true,
          categoryId: true,
          locationAr: true,
          descriptionAr: true,
          descriptionEn: true,
          images: { orderBy: { order: "asc" } },
        },
      },
      sizes: {
        orderBy: { label: "asc" },
      },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

// ── POST /api/acquire — create acquire item ───────────────────────────────────
//
// Two modes:
//   { workId }                              → link an existing portfolio work
//   { imageUrl, width, height, titleAr, titleEn?, locationAr?, locationEn? }
//                                           → create a standalone acquire-only work

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  let workId: string;

  if (body.workId) {
    // ── Mode A: link existing portfolio work ──────────────────────────────────
    const work = await db.work.findUnique({ where: { id: body.workId } });
    if (!work) return NextResponse.json({ error: "Work not found" }, { status: 404 });
    const existing = await db.acquireItem.findUnique({ where: { workId: body.workId } });
    if (existing) return NextResponse.json({ error: "Already exists" }, { status: 409 });
    workId = body.workId;

  } else if (body.imageUrl) {
    // ── Mode B: standalone upload — create hidden Work record ─────────────────
    const {
      imageUrl, width = 1200, height = 800,
      titleAr, titleEn, locationAr, locationEn,
      descriptionAr, descriptionEn, customCode,
      initialSizes,
    } = body;
    if (!titleAr) return NextResponse.json({ error: "titleAr required" }, { status: 400 });

    // Determine code: use custom if provided and unique, else auto-generate
    let code = customCode?.trim();
    if (code) {
      const taken = await db.work.findUnique({ where: { code } });
      if (taken) return NextResponse.json({ error: `الكود "${code}" مستخدم مسبقاً` }, { status: 409 });
    } else {
      const count = await db.work.count();
      code = `AQ-${String(count + 1).padStart(3, "0")}`;
    }

    const count = await db.work.count();
    const work = await db.work.create({
      data: {
        code,
        titleAr,
        titleEn: titleEn ?? titleAr,
        locationAr: locationAr ?? null,
        locationEn: locationEn ?? null,
        descriptionAr: descriptionAr ?? null,
        descriptionEn: descriptionEn ?? null,
        imageUrl,
        width,
        height,
        isPublished: false,
        isFeatured: false,
        order: count + 1,
      },
    });
    workId = work.id;

    // Create initial sizes if provided
    if (Array.isArray(initialSizes) && initialSizes.length > 0) {
      const item = await db.acquireItem.create({ data: { workId, isActive: true } });
      for (const sz of initialSizes as { label: string; totalEditions: number }[]) {
        if (sz.label && sz.totalEditions > 0) {
          await db.acquireSize.create({
            data: { acquireItemId: item.id, label: sz.label, totalEditions: sz.totalEditions, soldEditions: 0 },
          });
        }
      }
      const full = await db.acquireItem.findUnique({
        where: { id: item.id },
        include: { work: { select: { id: true, code: true, titleAr: true, titleEn: true, imageUrl: true } }, sizes: true },
      });
      return NextResponse.json(full, { status: 201 });
    }

  } else {
    return NextResponse.json({ error: "workId or imageUrl required" }, { status: 400 });
  }

  const item = await db.acquireItem.create({
    data: { workId, isActive: true },
    include: {
      work: { select: { id: true, code: true, titleAr: true, titleEn: true, imageUrl: true } },
      sizes: true,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
