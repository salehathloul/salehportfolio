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
import { VisitorProvider } from "@/components/auth/VisitorContext";

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
  analyticsGa4Id: string | null;
  analyticsGtmId: string | null;
  analyticsMetaPixelId: string | null;
  analyticsTiktokPixelId: string | null;
  analyticsSnapPixelId: string | null;
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
        analyticsGa4Id: true,
        analyticsGtmId: true,
        analyticsMetaPixelId: true,
        analyticsTiktokPixelId: true,
        analyticsSnapPixelId: true,
      },
    });
  } catch {
    return null;
  }
}

// ── Build analytics <script> tags ────────────────────────────────────────────

function buildAnalyticsScripts(settings: Settings | null): string {
  if (!settings) return "";
  const parts: string[] = [];

  // Google Tag Manager (inject before GA4 if both present)
  if (settings.analyticsGtmId) {
    const id = settings.analyticsGtmId.trim();
    parts.push(
      `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});` +
      `var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';` +
      `j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);` +
      `})(window,document,'script','dataLayer','${id}');`
    );
  }

  // Google Analytics 4
  if (settings.analyticsGa4Id) {
    const id = settings.analyticsGa4Id.trim();
    parts.push(
      `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}` +
      `gtag('js',new Date());gtag('config','${id}');`
    );
    // GA4 needs the loader script too — handled via a separate async src below
  }

  // Meta Pixel
  if (settings.analyticsMetaPixelId) {
    const id = settings.analyticsMetaPixelId.trim();
    parts.push(
      `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};` +
      `if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;` +
      `t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}` +
      `(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');` +
      `fbq('init','${id}');fbq('track','PageView');`
    );
  }

  // TikTok Pixel
  if (settings.analyticsTiktokPixelId) {
    const id = settings.analyticsTiktokPixelId.trim();
    parts.push(
      `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];` +
      `ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];` +
      `ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};` +
      `for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);` +
      `ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};` +
      `ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";` +
      `ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};` +
      `var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;` +
      `var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};` +
      `ttq.load('${id}');ttq.page();}(window,document,'ttq');`
    );
  }

  // Snap Pixel
  if (settings.analyticsSnapPixelId) {
    const id = settings.analyticsSnapPixelId.trim();
    parts.push(
      `(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};` +
      `a.queue=[];var s='script';r=t.createElement(s);r.async=!0;r.src=n;` +
      `var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);` +
      `})(window,document,'https://sc-static.net/scevent.min.js');` +
      `snaptr('init','${id}');snaptr('track','PAGE_VIEW');`
    );
  }

  return parts.join("\n");
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

  // Analytics scripts — built server-side, injected once
  const analyticsScripts = buildAnalyticsScripts(settings);

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
      {settings?.analyticsGa4Id && (
        // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${settings.analyticsGa4Id}`} />
      )}
      {analyticsScripts && (
        // eslint-disable-next-line react/no-danger
        <script dangerouslySetInnerHTML={{ __html: analyticsScripts }} />
      )}

      <LocaleProvider locale={locale} settings={settings}>
        <VisitorProvider>
        <ToastProvider>
          <div className="site-layout" data-layout={settings?.layoutMode ?? "wide"}>
            <Header settings={settings} />
            <main className="site-main">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer settings={settings} />
          </div>
        </ToastProvider>
        </VisitorProvider>
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
