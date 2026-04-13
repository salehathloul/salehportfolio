import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ── GET /api/admin/settings ───────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await db.siteSettings.findUnique({ where: { id: "main" } });

  // Return empty object if not yet initialised — form treats null fields as ""
  return NextResponse.json(settings ?? { id: "main" });
}

// ── PUT /api/admin/settings ───────────────────────────────

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, string | null | undefined>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Strip unknown keys — only allow schema fields
  const stringAllowed = [
    "logoLight", "logoDark",
    "logoLightAr", "logoDarkAr", "logoLightEn", "logoDarkEn",
    "titleAr", "titleEn",
    "descriptionAr", "descriptionEn",
    "socialInstagram", "socialX", "socialBehance", "socialLinkedin", "socialEmail",
    "heroImageUrl", "heroQuoteAr", "heroQuoteEn", "heroQuoteSize", "heroQuoteLineHeight", "heroQuoteWeight",
    "fontHeadingUrl", "fontBodyUrl", "fontHeadingName", "fontBodyName",
    "fontHeadingArUrl", "fontHeadingArName",
    "fontBodyArUrl", "fontBodyArName",
    "fontHeadingEnUrl", "fontHeadingEnName",
    "fontBodyEnUrl", "fontBodyEnName",
    "instagramUsername",
    "layoutMode",
    "navPortfolioAr", "navPortfolioEn",
    "navBlogAr", "navBlogEn",
    "navAcquireAr", "navAcquireEn",
    "navAboutAr", "navAboutEn",
    "navContactAr", "navContactEn",
  ] as const;

  const boolAllowed = [
    "showInstagram",
    "navPortfolioVisible", "navBlogVisible", "navAcquireVisible",
    "navAboutVisible", "navContactVisible",
  ] as const;

  const data: Record<string, string | null | boolean> = {};
  for (const key of stringAllowed) {
    if (key in body) {
      data[key] = body[key] ? String(body[key]) : null;
    }
  }
  for (const key of boolAllowed) {
    if (key in body) {
      data[key] = Boolean(body[key]);
    }
  }

  let settings;
  try {
    settings = await db.siteSettings.upsert({
      where: { id: "main" },
      create: { id: "main", ...data },
      update: data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json(settings);
}
