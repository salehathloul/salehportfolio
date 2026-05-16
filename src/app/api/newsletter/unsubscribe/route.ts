export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ── GET /api/newsletter/unsubscribe?email=xxx ────────────────────────────────
// One-click unsubscribe link embedded in broadcast emails

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return new NextResponse("رابط غير صحيح", { status: 400 });
  }

  try {
    await db.newsletterSubscriber.update({
      where: { email },
      data: { status: "unsubscribed", unsubscribedAt: new Date() },
    });
  } catch {
    // Subscriber might not exist — silently succeed
  }

  // Redirect to a friendly page (blog list)
  const locale = req.headers.get("accept-language")?.includes("ar") ? "ar" : "en";
  const siteUrl = process.env.NEXTAUTH_URL ?? "https://salehalhuthloul.com";
  return NextResponse.redirect(`${siteUrl}/${locale}/blog?unsubscribed=1`, { status: 302 });
}
