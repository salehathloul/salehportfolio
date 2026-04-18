/**
 * GET /api/cron/publish
 * Called by Vercel Cron every minute.
 * Publishes any Work, BlogPost, or AcquireItem whose scheduledAt <= now.
 */
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent abuse
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // ── Works ─────────────────────────────────────────────────────────────────
  const works = await db.work.updateMany({
    where: {
      scheduledAt: { lte: now },
      isPublished: false,
    },
    data: {
      isPublished: true,
      scheduledAt: null,
    },
  });

  // ── Blog posts ─────────────────────────────────────────────────────────────
  const posts = await db.blogPost.updateMany({
    where: {
      scheduledAt: { lte: now },
      status: { not: "published" },
    },
    data: {
      status: "published",
      publishedAt: now,
      scheduledAt: null,
    },
  });

  // ── Acquire items ──────────────────────────────────────────────────────────
  const items = await db.acquireItem.updateMany({
    where: {
      scheduledAt: { lte: now },
      isActive: false,
    },
    data: {
      isActive: true,
      scheduledAt: null,
    },
  });

  return NextResponse.json({
    ok: true,
    published: { works: works.count, posts: posts.count, acquireItems: items.count },
    at: now.toISOString(),
  });
}
