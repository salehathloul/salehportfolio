import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendPriceQuote } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

// ── GET /api/orders/[id] ──────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      acquireItem: {
        include: {
          work: { select: { id: true, code: true, titleAr: true, titleEn: true, imageUrl: true } },
        },
      },
      size: true,
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(order);
}

// ── PATCH /api/orders/[id] — update status / notes / price ───────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status, notes, priceSent, sendPrice } = body;

  const order = await db.order.update({
    where: { id },
    data: {
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
      ...(priceSent !== undefined && { priceSent: Number(priceSent) }),
    },
    include: {
      acquireItem: {
        include: {
          work: { select: { titleAr: true, code: true } },
        },
      },
      size: true,
    },
  });

  // Send price email if requested
  if (sendPrice && priceSent) {
    sendPriceQuote({
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      workTitle: order.acquireItem.work.titleAr,
      size: order.size.label,
      price: Number(priceSent),
      notes: notes ?? undefined,
    }).catch(console.error);
  }

  return NextResponse.json(order);
}
