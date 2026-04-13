import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { locales } from "@/lib/i18n";
import { db } from "@/lib/db";
import LocaleProvider from "@/components/layout/LocaleProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/layout/PageTransition";
import { ToastProvider } from "@/components/ui/Toast";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://saleh-portfolio.vercel.app";

// ── Settings shape we need ────────────────────────────────────────────────────

interface Settings {
  layoutMode: string | null;
  logoLight: string | null;
  logoDark: string | null;
  titleAr: string | null;
  titleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  heroImageUrl: string | null;
  socialInstagram: string | null;
  socialX: string | null;
  socialBehance: string | null;
  socialLinkedin: string | null;
  socialEmail: string | null;
  // Legacy (kept for fallback)
  fontHeadingUrl: string | null;
  fontBodyUrl: string | null;
  fontHeadingName: string | null;
  fontBodyName: string | null;
  // Nav labels
  navPortfolioAr: string | null;
  navPortfolioEn: string | null;
  navBlogAr: string | null;
  navBlogEn: string | null;
  navAcquireAr: string | null;
  navAcquireEn: string | null;
  navAboutAr: string | null;
  navAboutEn: string | null;
  navContactAr: string | null;
  navContactEn: string | null;
  // Nav visibility
  navPortfolioVisible: boolean | null;
  navBlogVisible: boolean | null;
  navAcquireVisible: boolean | null;
  navAboutVisible: boolean | null;
  navContactVisible: boolean | null;
  // 4-slot fonts (per direction + role)
  fontHeadingArUrl: string | null;
  fontHeadingArName: string | null;
  fontBodyArUrl: string | null;
  fontBodyArName: string | null;
  fontHeadingEnUrl: string | null;
  fontHeadingEnName: string | null;
  fontBodyEnUrl: string | null;
  fontBodyEnName: string | null;
}

async function getSettings(): Promise<Settings | null> {
  try {
    return await db.siteSettings.findUnique({
      where: { id: "main" },
      select: {
        layoutMode: true,
        logoLight: true,
        logoDark: true,
        titleAr: true,
        titleEn: true,
        descriptionAr: true,
        descriptionEn: true,
        heroImageUrl: true,
        socialInstagram: true,
        socialX: true,
        socialBehance: true,
        socialLinkedin: true,
        socialEmail: true,
        fontHeadingUrl: true,
        fontBodyUrl: true,
        fontHeadingName: true,
        fontBodyName: true,
        fontHeadingArUrl: true,
        fontHeadingArName: true,
        fontBodyArUrl: true,
        fontBodyArName: true,
        fontHeadingEnUrl: true,
        fontHeadingEnName: true,
        fontBodyEnUrl: true,
        fontBodyEnName: true,
        navPortfolioAr: true,
        navPortfolioEn: true,
        navBlogAr: true,
        navBlogEn: true,
        navAcquireAr: true,
        navAcquireEn: true,
        navAboutAr: true,
        navAboutEn: true,
        navContactAr: true,
        navContactEn: true,
        navPortfolioVisible: true,
        navBlogVisible: true,
        navAcquireVisible: true,
        navAboutVisible: true,
        navContactVisible: true,
      },
    });
  } catch {
    return null;
  }
}

// ── Generate static params ────────────────────────────────────────────────────

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const settings = await getSettings();

  const siteName =
    locale === "ar"
      ? (settings?.titleAr ?? "صالح الهذلول")
      : (settings?.titleEn ?? "Saleh Alhuthloul");

  const description =
    locale === "ar"
      ? (settings?.descriptionAr ?? "فنان فوتوغرافي سعودي")
      : (settings?.descriptionEn ?? "Saudi fine-art photographer");

  const ogImage = settings?.heroImageUrl ?? undefined;

  return {
    title: {
      default: siteName,
      template: `%s — ${siteName}`,
    },
    description,
    openGraph: {
      type: "website",
      siteName,
      locale: locale === "ar" ? "ar_SA" : "en_US",
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      images: ogImage ? [ogImage] : [],
    },
    alternates: {
      languages: {
        ar: `${BASE_URL}/ar`,
        en: `${BASE_URL}/en`,
      },
    },
  };
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  const [messages, settings] = await Promise.all([
    getMessages(),
    getSettings(),
  ]);

  // Inline font @font-face injected server-side — avoids flash of fallback font
  // Helper: emit @font-face + CSS variable override
  function fontFace(url: string | null | undefined, name: string | null | undefined, cssVar: string): string {
    if (!url || !name) return "";
    return `@font-face{font-family:'${name}';src:url('${url}') format('woff2');font-display:swap;}:root{${cssVar}:'${name}';}`;
  }

  const fontStyles = [
    // 4-slot fonts (new, per direction+role)
    fontFace(settings?.fontHeadingArUrl, settings?.fontHeadingArName, "--font-heading-ar-custom"),
    fontFace(settings?.fontBodyArUrl, settings?.fontBodyArName, "--font-body-ar-custom"),
    fontFace(settings?.fontHeadingEnUrl, settings?.fontHeadingEnName, "--font-heading-en-custom"),
    fontFace(settings?.fontBodyEnUrl, settings?.fontBodyEnName, "--font-body-en-custom"),
    // Legacy fallback (used if new slots are empty)
    fontFace(settings?.fontHeadingUrl, settings?.fontHeadingName, "--font-heading-legacy-custom"),
    fontFace(settings?.fontBodyUrl, settings?.fontBodyName, "--font-body-legacy-custom"),
  ]
    .filter(Boolean)
    .join("");

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {fontStyles && (
        // eslint-disable-next-line react/no-danger
        <style dangerouslySetInnerHTML={{ __html: fontStyles }} />
      )}

      <LocaleProvider locale={locale} settings={settings}>
        <ToastProvider>
          <div className="site-layout" data-layout={settings?.layoutMode ?? "wide"}>
            <Header settings={settings} />
            <main className="site-main">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer settings={settings} />
          </div>
        </ToastProvider>
      </LocaleProvider>

      <style>{`
        .site-layout {
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
        }

        .site-main {
          flex: 1;
        }
      `}</style>
    </NextIntlClientProvider>
  );
}
