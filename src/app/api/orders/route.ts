export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  sendGroupOrderNotification,
  sendOrderConfirmation,
} from "@/lib/email";

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

// ── POST /api/orders — cart checkout (public) ─────────────────────────────────
//
// Body shape:
// {
//   items: [{ acquireItemId, sizeId, framingOption, quantity }],
//   customerName, customerEmail, customerPhone,
//   country?, city?, message?
// }

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    items,
    customerName,
    customerEmail,
    customerPhone,
    country,
    city,
    message,
  } = body;

  // ── Validate top-level fields ──────────────────────────────────────────────
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items in cart" }, { status: 400 });
  }
  if (!customerName || !customerEmail || !customerPhone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // ── Validate every cart item ───────────────────────────────────────────────
  type ValidatedItem = {
    acquireItemId: string;
    sizeId: string;
    framingOption: string;
    qty: number;
    workTitle: string;
    workCode: string;
    sizeLabel: string;
  };
  const validated: ValidatedItem[] = [];

  for (const orderItem of items) {
    const { acquireItemId, sizeId, framingOption, quantity } = orderItem;
    if (!acquireItemId || !sizeId) {
      return NextResponse.json({ error: "Missing item fields" }, { status: 400 });
    }

    const qty = Math.max(1, Math.min(10, parseInt(String(quantity)) || 1));

    const acquireItem = await db.acquireItem.findUnique({
      where: { id: acquireItemId },
      include: {
        work: { select: { code: true, titleAr: true, titleEn: true } },
        sizes: true,
      },
    });

    if (!acquireItem || !acquireItem.isActive) {
      return NextResponse.json(
        { error: `العمل غير متاح: ${acquireItemId}` },
        { status: 400 }
      );
    }

    const size = acquireItem.sizes.find((s) => s.id === sizeId);
    if (!size) {
      return NextResponse.json(
        { error: `المقاس غير موجود: ${sizeId}` },
        { status: 400 }
      );
    }

    const remaining = size.totalEditions - size.soldEditions;
    if (remaining <= 0) {
      return NextResponse.json(
        { error: `نفذت النسخ من: ${acquireItem.work.titleAr}` },
        { status: 400 }
      );
    }
    if (qty > remaining) {
      return NextResponse.json(
        {
          error: `الكمية المطلوبة تتجاوز المتاح من: ${acquireItem.work.titleAr}`,
        },
        { status: 400 }
      );
    }

    validated.push({
      acquireItemId,
      sizeId,
      framingOption: framingOption ?? "without_frame",
      qty,
      workTitle: acquireItem.work.titleAr,
      workCode: acquireItem.work.code,
      sizeLabel: size.label,
    });
  }

  // ── Create all orders with a shared groupId ────────────────────────────────
  const groupId = crypto.randomUUID();
  const createdOrders: { id: string; workTitle: string; workCode: string; sizeLabel: string; framingOption: string; qty: number }[] = [];

  for (const v of validated) {
    const order = await db.order.create({
      data: {
        acquireItemId: v.acquireItemId,
        sizeId: v.sizeId,
        customerName,
        customerEmail,
        customerPhone,
        country: country?.trim() || null,
        city: city?.trim() || null,
        quantity: v.qty,
        message: message ?? null,
        framingOption: v.framingOption,
        groupId,
        status: "new",
      },
    });
    createdOrders.push({
      id: order.id,
      workTitle: v.workTitle,
      workCode: v.workCode,
      sizeLabel: v.sizeLabel,
      framingOption: v.framingOption,
      qty: v.qty,
    });
  }

  // ── Send emails (fire and forget) ──────────────────────────────────────────
  Promise.all([
    sendGroupOrderNotification({
      groupId,
      customerName,
      customerEmail,
      customerPhone,
      country: country?.trim() || undefined,
      city: city?.trim() || undefined,
      message,
      items: createdOrders.map((o) => ({
        orderId: o.id,
        workTitle: o.workTitle,
        workCode: o.workCode,
        size: o.sizeLabel,
        framingOption: o.framingOption,
        quantity: o.qty,
      })),
    }),
    sendOrderConfirmation({
      customerName,
      customerEmail,
      workTitle:
        createdOrders.length === 1
          ? createdOrders[0].workTitle
          : `${createdOrders.length} أعمال`,
      size:
        createdOrders.length === 1
          ? createdOrders[0].sizeLabel
          : createdOrders.map((o) => o.sizeLabel).join("، "),
      quantity: createdOrders.reduce((sum, o) => sum + o.qty, 0),
    }),
  ]).catch(console.error);

  return NextResponse.json(
    { groupId, orderIds: createdOrders.map((o) => o.id) },
    { status: 201 }
  );
}
