import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendNewOrderNotification, sendOrderConfirmation } from "@/lib/email";

// ── GET /api/orders — list all orders (admin) ─────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");

  const orders = await db.order.findMany({
    where: status ? { status } : undefined,
    include: {
      acquireItem: {
        include: {
          work: {
            select: { id: true, code: true, titleAr: true, titleEn: true, imageUrl: true },
          },
        },
      },
      size: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

// ── POST /api/orders — submit new order (public) ─────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { acquireItemId, sizeId, customerName, customerEmail, customerPhone, message } = body;

  if (!acquireItemId || !sizeId || !customerName || !customerEmail || !customerPhone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Validate acquire item and size
  const acquireItem = await db.acquireItem.findUnique({
    where: { id: acquireItemId },
    include: {
      work: { select: { code: true, titleAr: true, titleEn: true } },
      sizes: true,
    },
  });
  if (!acquireItem || !acquireItem.isActive) {
    return NextResponse.json({ error: "Item not available" }, { status: 400 });
  }

  const size = acquireItem.sizes.find((s) => s.id === sizeId);
  if (!size) return NextResponse.json({ error: "Size not found" }, { status: 400 });

  const remaining = size.totalEditions - size.soldEditions;
  if (remaining <= 0) {
    return NextResponse.json({ error: "No editions remaining" }, { status: 400 });
  }

  const order = await db.order.create({
    data: {
      acquireItemId,
      sizeId,
      customerName,
      customerEmail,
      customerPhone,
      message: message ?? null,
      status: "new",
    },
  });

  // Send emails (fire and forget — don't block response)
  const workTitle = acquireItem.work.titleAr;
  const workCode = acquireItem.work.code;

  Promise.all([
    sendNewOrderNotification({
      orderId: order.id,
      customerName,
      customerEmail,
      customerPhone,
      workTitle,
      workCode,
      size: size.label,
      message,
    }),
    sendOrderConfirmation({
      customerName,
      customerEmail,
      workTitle,
      size: size.label,
    }),
  ]).catch(console.error);

  return NextResponse.json({ id: order.id }, { status: 201 });
}
