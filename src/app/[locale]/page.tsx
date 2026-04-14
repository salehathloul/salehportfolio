export const dynamic = "force-dynamic";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import HeroSection from "@/components/home/HeroSection";
import FeaturedWorks from "@/components/home/FeaturedWorks";
import InstagramSection from "@/components/home/InstagramSection";

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
  const [settings, featuredWorks] = await Promise.all([
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
      },
    }),
    db.work.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: { order: "asc" },
      take: 9,
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
  ]);
  return { settings, featuredWorks };
}

export default async function HomePage() {
  const locale = await getLocale();
  const { settings, featuredWorks } = await getData();

  const quote =
    locale === "ar"
      ? (settings?.heroQuoteAr ?? null)
      : (settings?.heroQuoteEn ?? null);

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
      {settings?.showInstagram && (
        <InstagramSection
          username={settings.instagramUsername ?? null}
          profileUrl={settings.socialInstagram ?? null}
        />
      )}
    </>
  );
}
