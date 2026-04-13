import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod/v4";

export type GridLayout = "grid" | "masonry" | "scattered";

const schema = z.object({
  availableLayouts: z.array(z.enum(["grid", "masonry", "scattered"])).min(1),
  defaultLayout: z.enum(["grid", "masonry", "scattered"]),
});

// GET /api/portfolio/settings
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await db.siteSettings.findUnique({ where: { id: "main" } });

  const availableLayouts = (settings?.portfolioLayouts ?? "grid,masonry,scattered")
    .split(",")
    .filter(Boolean) as GridLayout[];

  const defaultLayout = (settings?.portfolioDefaultLayout ?? "masonry") as GridLayout;

  return NextResponse.json({ availableLayouts, defaultLayout });
}

// PUT /api/portfolio/settings
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 422 });
  }

  if (!parsed.data.availableLayouts.includes(parsed.data.defaultLayout)) {
    return NextResponse.json(
      { error: "النمط الافتراضي يجب أن يكون ضمن الأنماط المتاحة" },
      { status: 422 }
    );
  }

  await db.siteSettings.upsert({
    where: { id: "main" },
    create: {
      id: "main",
      portfolioLayouts: parsed.data.availableLayouts.join(","),
      portfolioDefaultLayout: parsed.data.defaultLayout,
    },
    update: {
      portfolioLayouts: parsed.data.availableLayouts.join(","),
      portfolioDefaultLayout: parsed.data.defaultLayout,
    },
  });

  return NextResponse.json(parsed.data);
}
