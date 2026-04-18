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

const CATEGORY_LABELS: Record<string, string> = {
  collaboration: "تعاون",
  inquiry: "استفسار",
  acquisition: "اقتناء",
  media: "إعلام",
  other: "أخرى",
};

const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  replied: "تم الرد",
  closed: "مغلق",
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await db.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  const header = row([
    "رقم الرسالة",
    "الاسم",
    "البريد الإلكتروني",
    "الجوال",
    "التصنيف",
    "الرسالة",
    "مرفق",
    "الحالة",
    "التاريخ",
  ]);

  const lines = messages.map((m) =>
    row([
      m.id,
      m.name,
      m.email,
      m.phone ?? "",
      CATEGORY_LABELS[m.category] ?? m.category,
      m.message,
      m.attachmentUrl ?? "",
      STATUS_LABELS[m.status] ?? m.status,
      m.createdAt.toISOString(),
    ])
  );

  const csv = [header, ...lines].join("\r\n");
  const BOM = "\uFEFF"; // UTF-8 BOM for Excel Arabic support

  return new NextResponse(BOM + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="messages-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
