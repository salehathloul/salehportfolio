export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

function escapeCsv(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(cells: (string | number | null | undefined)[]): string {
  return cells.map(escapeCsv).join(",");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await db.order.findMany({
    include: {
      acquireItem: { include: { work: { select: { titleAr: true, titleEn: true, code: true } } } },
      size: { select: { label: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = row([
    "رقم الطلب",
    "العمل (عربي)",
    "العمل (إنجليزي)",
    "كود العمل",
    "المقاس",
    "اسم العميل",
    "البريد الإلكتروني",
    "الجوال",
    "رسالة العميل",
    "الحالة",
    "السعر المرسل",
    "ملاحظات داخلية",
    "تاريخ الطلب",
  ]);

  const lines = orders.map((o) =>
    row([
      o.id,
      o.acquireItem.work.titleAr,
      o.acquireItem.work.titleEn,
      o.acquireItem.work.code,
      o.size.label,
      o.customerName,
      o.customerEmail,
      o.customerPhone,
      o.message ?? "",
      o.status,
      o.priceSent ?? "",
      o.notes ?? "",
      o.createdAt.toISOString(),
    ])
  );

  const csv = [header, ...lines].join("\r\n");
  const BOM = "\uFEFF"; // UTF-8 BOM for Excel Arabic support

  return new NextResponse(BOM + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
