export const dynamic = "force-dynamic";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import AcquireClient from "@/components/acquire/AcquireClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "اقتناء" : "Acquire",
    description: locale === "ar" ? "نسخ محدودة — فوتوغرافيا فنية" : "Limited editions — Fine art photography",
    alternates: { canonical: `/${locale}/acquire` },
    openGraph: { url: `/${locale}/acquire` },
  };
}

async function getItems() {
  try {
    return await db.acquireItem.findMany({
      where: { isActive: true },
      include: {
        work: {
          select: {
            id: true,
            code: true,
            titleAr: true,
            titleEn: true,
            locationAr: true,
            locationEn: true,
            descriptionAr: true,
            descriptionEn: true,
            imageUrl: true,
            width: true,
            height: true,
            images: {
              select: { id: true, url: true, order: true },
              orderBy: { order: "asc" as const },
            },
          },
        },
        sizes: {
          select: {
            id: true,
            label: true,
            totalEditions: true,
            soldEditions: true,
          },
          orderBy: { label: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  } catch {
    return [];
  }
}

export default async function AcquirePage() {
  const t = await getTranslations("acquire");
  const items = await getItems();

  return (
    <>
      <div className="page-header container">
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-subtitle">{t("subtitle")}</p>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <AcquireClient items={items as any} />

      <style>{`
        .page-header {
          padding-top: 3rem;
          padding-bottom: 2.5rem;
        }

        .page-title {
          font-family: var(--font-heading);
          font-size: 2rem;
          font-weight: 300;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          margin-bottom: 0.5rem;
        }

        .page-subtitle {
          font-size: 0.9rem;
          color: var(--text-muted);
        }
      `}</style>
    </>
  );
}
