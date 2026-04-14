export const dynamic = "force-dynamic";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import PortfolioClient from "@/components/portfolio/PortfolioClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "المعرض" : "Portfolio",
    description: locale === "ar" ? "معرض الأعمال الفوتوغرافية" : "Photography portfolio",
    alternates: { canonical: `/${locale}/portfolio` },
    openGraph: { url: `/${locale}/portfolio` },
  };
}

type GridLayout = "grid" | "masonry" | "scattered";

async function getData() {
  try {
    const [works, categories, settings] = await Promise.all([
      db.work.findMany({
        where: { isPublished: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          code: true,
          titleAr: true,
          titleEn: true,
          locationAr: true,
          locationEn: true,
          imageUrl: true,
          width: true,
          height: true,
          categoryId: true,
          categories: { select: { id: true } },
        },
      }),
      db.category.findMany({ orderBy: { order: "asc" } }),
      db.siteSettings.findUnique({
        where: { id: "main" },
        select: { portfolioLayouts: true, portfolioDefaultLayout: true },
      }),
    ]);

    const availableLayouts = (
      (settings?.portfolioLayouts ?? "grid,masonry,scattered")
        .split(",")
        .filter(Boolean) as GridLayout[]
    );
    const defaultLayout = (settings?.portfolioDefaultLayout ?? "masonry") as GridLayout;

    return { works, categories, availableLayouts, defaultLayout };
  } catch {
    return {
      works: [],
      categories: [],
      availableLayouts: ["grid", "masonry", "scattered"] as GridLayout[],
      defaultLayout: "masonry" as GridLayout,
    };
  }
}

export default async function PortfolioPage() {
  const t = await getTranslations("portfolio");
  const { works, categories, availableLayouts, defaultLayout } = await getData();

  return (
    <>
      <div className="page-header container">
        <h1 className="page-title">{t("title")}</h1>
      </div>

      <PortfolioClient
        works={works}
        categories={categories}
        availableLayouts={availableLayouts}
        defaultLayout={defaultLayout}
      />

      <style>{`
        .page-header {
          padding-top: 3rem;
          padding-bottom: 0.5rem;
        }

        .page-title {
          font-family: var(--font-heading);
          font-size: 2rem;
          font-weight: 300;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }
      `}</style>
    </>
  );
}
