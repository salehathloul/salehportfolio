import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/admin/fonts — list all library fonts
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fonts = await db.fontAsset.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(fonts);
}

// POST /api/admin/fonts — add font to library
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { name: string; url: string; format?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name || !body.url) {
    return NextResponse.json({ error: "name and url are required" }, { status: 422 });
  }

  const font = await db.fontAsset.create({
    data: { name: body.name, url: body.url, format: body.format ?? "woff2" },
  });

  return NextResponse.json(font, { status: 201 });
}
