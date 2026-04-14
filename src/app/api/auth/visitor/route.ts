export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getVisitorSession, COOKIE_NAME } from "@/lib/visitor-session";

// ── GET /api/auth/visitor — get current visitor session ──────────────────────

export async function GET() {
  const session = await getVisitorSession();
  if (!session) return NextResponse.json(null);
  return NextResponse.json(session);
}

// ── DELETE /api/auth/visitor — logout visitor ─────────────────────────────────

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
