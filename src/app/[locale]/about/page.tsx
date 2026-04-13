import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import AboutClient from "@/components/about/AboutClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "عني" : "About",
    alternates: { canonical: `/${locale}/about` },
    openGraph: { url: `/${locale}/about` },
  };
}

interface ExperienceItem {
  titleAr: string;
  titleEn: string;
  orgAr: string;
  orgEn: string;
  period: string;
  descAr: string;
  descEn: string;
}

interface AchievementItem {
  titleAr: string;
  titleEn: string;
  year: string;
  descAr: string;
  descEn: string;
}

async function getAboutData() {
  try {
    const [about, settings] = await Promise.all([
      db.about.findUnique({ where: { id: "main" } }),
      db.siteSettings.findUnique({
        where: { id: "main" },
        select: { titleAr: true, titleEn: true },
      }),
    ]);
    return { about, settings };
  } catch {
    return { about: null, settings: null };
  }
}

export default async function AboutPage() {
  const [locale, { about, settings }] = await Promise.all([getLocale(), getAboutData()]);

  const name =
    locale === "ar"
      ? (about?.nameAr ?? settings?.titleAr ?? "صالح الهذلول")
      : (about?.nameEn ?? settings?.titleEn ?? "Saleh Alhuthloul");

  return (
    <AboutClient
      name={name}
      bioAr={about?.bioAr ?? null}
      bioEn={about?.bioEn ?? null}
      imageUrl={about?.imageUrl ?? null}
      layout={(about?.layout as "classic" | "stacked" | "portrait" | "minimal") ?? "classic"}
      experience={(about?.experience as ExperienceItem[] | null) ?? []}
      achievements={(about?.achievements as AchievementItem[] | null) ?? []}
      locale={locale}
    />
  );
}
