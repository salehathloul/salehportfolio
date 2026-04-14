import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ── POST /api/newsletter/subscribe ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { email?: string; nameAr?: string; nameEn?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const existing = await db.newsletterSubscriber.findUnique({ where: { email } });

  if (existing) {
    if (existing.status === "unsubscribed") {
      // Re-subscribe
      await db.newsletterSubscriber.update({
        where: { email },
        data: { status: "active", unsubscribedAt: null },
      });
    }
    return NextResponse.json({ ok: true, resubscribed: existing.status === "unsubscribed" });
  }

  await db.newsletterSubscriber.create({
    data: {
      email,
      nameAr: body.nameAr?.trim() || null,
      nameEn: body.nameEn?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
