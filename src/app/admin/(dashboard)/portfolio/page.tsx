export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import PortfolioClient from "@/components/admin/portfolio/PortfolioClient";

export const metadata = { title: "المعرض — لوحة التحكم" };

export default async function AdminPortfolioPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const [works, categories, projects, settings] = await Promise.all([
    db.work.findMany({
      orderBy: { order: "asc" },
      include: {
        category: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
        categories: { select: { id: true, nameAr: true, nameEn: true, slug: true } },
        images: { orderBy: { order: "asc" } },
      },
    }),
    db.category.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { works: true } } },
    }),
    db.project.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true, slug: true, titleAr: true, titleEn: true,
        coverImage: true, isPublished: true, showInPortfolio: true,
        _count: { select: { images: true } },
      },
    }),
    db.siteSettings.findUnique({ where: { id: "main" } }),
  ]);

  const availableLayouts = (settings?.portfolioLayouts ?? "grid,masonry,scattered")
    .split(",")
    .filter(Boolean) as ("grid" | "masonry" | "scattered")[];

  const defaultLayout = (settings?.portfolioDefaultLayout ?? "masonry") as "grid" | "masonry" | "scattered";

  return (
    <PortfolioClient
      initialWorks={works.map((w) => ({
        ...w,
        dateTaken: w.dateTaken?.toISOString() ?? null,
        scheduledAt: w.scheduledAt?.toISOString() ?? null,
        images: w.images,
      }))}
      initialCategories={categories}
      initialProjects={projects}
      initialDisplaySettings={{ availableLayouts, defaultLayout }}
    />
  );
}
