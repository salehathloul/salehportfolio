export const dynamic = "force-dynamic";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import AboutClient from "@/components/about/AboutClient";
import TestimonialsSection from "@/components/about/TestimonialsSection";
import CollectedBySection from "@/components/about/CollectedBySection";
import Breadcrumb from "@/components/ui/Breadcrumb";

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
        select: { titleAr: true, titleEn: true, studioVideoUrl: true, artistSignatureUrl: true },
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
    <>
      <div className="container" style={{ paddingTop: "2rem" }}>
        <Breadcrumb
          items={[
            { label: locale === "ar" ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: locale === "ar" ? "عني" : "About" },
          ]}
        />
      </div>
      <div className="container" style={{ textAlign: "end", marginTop: "-1rem", marginBottom: "1rem" }}>
        <Link
          href={`/${locale}/cv`}
          style={{
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            textDecoration: "none",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {locale === "ar" ? "عرض السيرة الذاتية ↗" : "View CV ↗"}
        </Link>
      </div>
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
      {settings?.studioVideoUrl && (
        <div className="about-video container" dir={locale === "ar" ? "rtl" : "ltr"}>
          <h2 className="about-video-title">{locale === "ar" ? "من وراء الكاميرا" : "Behind the Camera"}</h2>
          <div className="about-video-wrap">
            <iframe
              src={settings.studioVideoUrl}
              title={locale === "ar" ? "فيديو الاستوديو" : "Studio Video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="about-video-iframe"
            />
          </div>
          <style>{`
            .about-video {
              padding-block: 4rem;
              border-top: 1px solid var(--border-subtle);
            }
            .about-video-title {
              font-family: var(--font-heading);
              font-size: 0.7rem;
              font-weight: 500;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              color: var(--text-subtle);
              margin-bottom: 1.5rem;
            }
            .about-video-wrap {
              position: relative;
              aspect-ratio: 16/9;
              border-radius: var(--radius-lg);
              overflow: hidden;
              background: var(--bg-secondary);
            }
            .about-video-iframe {
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              border: none;
            }
          `}</style>
        </div>
      )}
      <CollectedBySection locale={locale as "ar" | "en"} />
      <TestimonialsSection locale={locale as "ar" | "en"} />
    </>
  );
}
