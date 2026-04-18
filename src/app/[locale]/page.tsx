export const dynamic = "force-dynamic";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import HeroSection from "@/components/home/HeroSection";
import FeaturedWorks from "@/components/home/FeaturedWorks";
import InstagramSection from "@/components/home/InstagramSection";
import StatsSection from "@/components/home/StatsSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: { absolute: locale === "ar" ? "صالح الهذلول — فوتوغرافيا فنية" : "Saleh Alhuthloul — Fine Art Photography" },
    openGraph: { url: `/${locale}` },
    alternates: { canonical: `/${locale}` },
  };
}

async function getData() {
  const [settings, featuredWorks, workCount, exhibitionCount] = await Promise.all([
    db.siteSettings.findUnique({
      where: { id: "main" },
      select: {
        heroImageUrl: true,
        heroQuoteAr: true,
        heroQuoteEn: true,
        heroQuoteSize: true,
        heroQuoteLineHeight: true,
        heroQuoteWeight: true,
        showInstagram: true,
        instagramUsername: true,
        socialInstagram: true,
        impactStats: true,
      },
    }),
    db.work.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: { order: "asc" },
      take: 6,
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
      },
    }),
    db.work.count({ where: { isPublished: true } }),
    db.exhibition.count(),
  ]);
  return { settings, featuredWorks, workCount, exhibitionCount };
}

export default async function HomePage() {
  const locale = await getLocale();
  const { settings, featuredWorks, workCount, exhibitionCount } = await getData();

  const quote =
    locale === "ar"
      ? (settings?.heroQuoteAr ?? null)
      : (settings?.heroQuoteEn ?? null);

  // Build stats array
  const statsData: { value: number; labelAr: string; labelEn: string }[] = [];
  try {
    if (settings?.impactStats) {
      const parsed = JSON.parse(settings.impactStats);
      if (parsed.works) statsData.push({ value: parsed.works, labelAr: "عمل", labelEn: "Works" });
      if (parsed.exhibitions) statsData.push({ value: parsed.exhibitions, labelAr: "معرض", labelEn: "Exhibitions" });
      if (parsed.years) statsData.push({ value: parsed.years, labelAr: "سنة خبرة", labelEn: "Years" });
      if (parsed.countries) statsData.push({ value: parsed.countries, labelAr: "دولة", labelEn: "Countries" });
    } else {
      if (workCount > 0) statsData.push({ value: workCount, labelAr: "عمل فوتوغرافي", labelEn: "Works" });
      if (exhibitionCount > 0) statsData.push({ value: exhibitionCount, labelAr: "معرض ومنجز", labelEn: "Exhibitions" });
    }
  } catch {}

  return (
    <>
      <HeroSection
        imageUrl={settings?.heroImageUrl ?? null}
        quote={quote}
        heroQuoteSize={settings?.heroQuoteSize ?? "md"}
        heroQuoteLineHeight={settings?.heroQuoteLineHeight ?? "1.5"}
        heroQuoteWeight={settings?.heroQuoteWeight ?? "normal"}
      />
      <FeaturedWorks works={featuredWorks} />
      <StatsSection stats={statsData} />
      {settings?.showInstagram && (
        <InstagramSection
          username={settings.instagramUsername ?? null}
          profileUrl={settings.socialInstagram ?? null}
        />
      )}
    </>
  );
}
