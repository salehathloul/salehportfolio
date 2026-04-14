export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendContactNotification } from "@/lib/email";

// ── GET /api/contact — list messages (admin) ──────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  const messages = await db.contactMessage.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(messages);
}

// ── POST /api/contact — submit message (public) ───────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone, category, message } = body;

  if (!name || !email || !category || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const VALID_CATEGORIES = ["collaboration", "inquiry", "acquisition", "media", "other"];
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const record = await db.contactMessage.create({
    data: { name, email, phone: phone ?? null, category, message, status: "new" },
  });

  sendContactNotification({ name, email, phone, category, message }).catch(console.error);

  return NextResponse.json({ id: record.id }, { status: 201 });
}
