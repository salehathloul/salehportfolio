export const dynamic = "force-dynamic";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import CVDocument from "@/components/cv/CVDocument";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "السيرة الذاتية" : "CV / Resume",
    alternates: { canonical: `/${locale}/cv` },
    openGraph: { url: `/${locale}/cv` },
    robots: { index: false },
  };
}

interface ExperienceItem {
  titleAr: string;
  titleEn: string;
  orgAr: string;
  orgEn: string;
  period: string;
  descAr?: string;
  descEn?: string;
}

interface AchievementItem {
  titleAr: string;
  titleEn: string;
  year: string;
  descAr?: string;
  descEn?: string;
}

function safeJsonArray<T>(value: unknown): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as T[];
  return [];
}

export default async function CVPage() {
  const locale = await getLocale();

  const [about, exhibitions, settings] = await Promise.all([
    db.about.findUnique({ where: { id: "main" } }),
    db.exhibition.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 20,
    }),
    db.siteSettings.findUnique({
      where: { id: "main" },
      select: {
        titleAr: true,
        titleEn: true,
        socialInstagram: true,
        socialX: true,
        socialLinkedin: true,
        socialEmail: true,
        artistSignatureUrl: true,
      },
    }),
  ]);

  const name =
    locale === "ar"
      ? (about?.nameAr ?? settings?.titleAr ?? "صالح الهذلول")
      : (about?.nameEn ?? settings?.titleEn ?? "Saleh Alhuthloul");

  const experience = safeJsonArray<ExperienceItem>(about?.experience);
  const achievements = safeJsonArray<AchievementItem>(about?.achievements);

  return (
    <CVDocument
      locale={locale as "ar" | "en"}
      name={name}
      bioAr={about?.bioAr ?? null}
      bioEn={about?.bioEn ?? null}
      experience={experience}
      achievements={achievements}
      exhibitions={exhibitions.map((e) => ({
        titleAr: e.titleAr,
        titleEn: e.titleEn,
        locationAr: e.locationAr,
        locationEn: e.locationEn,
        year: e.year,
        type: e.type,
      }))}
      socialEmail={settings?.socialEmail ?? null}
      socialLinkedin={settings?.socialLinkedin ?? null}
      socialInstagram={settings?.socialInstagram ?? null}
      artistSignatureUrl={settings?.artistSignatureUrl ?? null}
    />
  );
}
