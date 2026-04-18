export const dynamic = "force-dynamic";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import WorkGallery from "@/components/portfolio/WorkGallery";
import ShareButtons from "@/components/blog/ShareButtons";
import RelatedWorks from "@/components/portfolio/RelatedWorks";
import Breadcrumb from "@/components/ui/Breadcrumb";

interface Props {
  params: Promise<{ locale: string; code: string }>;
}


async function getWork(code: string) {
  try {
    return await db.work.findFirst({
      where: { code, isPublished: true },
      include: {
        category: { select: { nameAr: true, nameEn: true } },
        images: { orderBy: { order: "asc" } },
      },
    });
  } catch {
    return null;
  }
}

async function getAdjacentWorks(order: number) {
  try {
    const [prev, next] = await Promise.all([
      db.work.findFirst({
        where: { isPublished: true, order: { lt: order } },
        orderBy: { order: "desc" },
        select: { code: true, titleAr: true, titleEn: true, imageUrl: true },
      }),
      db.work.findFirst({
        where: { isPublished: true, order: { gt: order } },
        orderBy: { order: "asc" },
        select: { code: true, titleAr: true, titleEn: true, imageUrl: true },
      }),
    ]);
    return { prev, next };
  } catch {
    return { prev: null, next: null };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, code } = await params;
  const work = await getWork(code);
  if (!work) return {};
  const title = locale === "ar" ? work.titleAr : work.titleEn;
  const desc = locale === "ar" ? work.descriptionAr : work.descriptionEn;
  const kw = (work as { keywords?: string | null }).keywords;
  return {
    title,
    description: desc ?? undefined,
    keywords: kw ?? undefined,
    openGraph: {
      title: title ?? undefined,
      images: work.imageUrl ? [{ url: work.imageUrl }] : [],
    },
  };
}

export default async function WorkDetailPage({ params }: Props) {
  const { code } = await params;
  const locale = await getLocale();
  const t = await getTranslations("portfolio");

  const work = await getWork(code);
  if (!work) notFound();

  const { prev: prevWork, next: nextWork } = await getAdjacentWorks(work.order);

  const title = locale === "ar" ? work.titleAr : work.titleEn;
  const location = locale === "ar" ? work.locationAr : work.locationEn;
  const description = locale === "ar" ? work.descriptionAr : work.descriptionEn;
  const category = locale === "ar" ? work.category?.nameAr : work.category?.nameEn;
  const dir = locale === "ar" ? "rtl" : "ltr";

  const formattedDate = work.dateTaken
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar-u-ca-gregory-nu-latn" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(work.dateTaken))
    : null;

  const mapsUrl = (work as { mapsUrl?: string | null }).mapsUrl ?? null;
  const hasValidCoords = work.lat != null && work.lng != null && (work.lat !== 0 || work.lng !== 0);
  const googleMapsUrl = mapsUrl
    ?? (hasValidCoords ? `https://www.google.com/maps?q=${work.lat!},${work.lng!}` : null);

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://salehalhathoul.com";
  const pageUrl = `${BASE_URL}/${locale}/portfolio/${work.code}`;

  // EXIF fields
  const exif = [
    { key: "camera",      labelAr: "الكاميرا",    labelEn: "Camera",       value: work.exifCamera },
    { key: "lens",        labelAr: "العدسة",       labelEn: "Lens",         value: work.exifLens },
    { key: "aperture",    labelAr: "الفتحة",       labelEn: "Aperture",     value: work.exifAperture },
    { key: "shutter",     labelAr: "الغالق",       labelEn: "Shutter",      value: work.exifShutter },
    { key: "iso",         labelAr: "الحساسية",     labelEn: "ISO",          value: work.exifIso },
    { key: "focal",       labelAr: "البُعد البؤري", labelEn: "Focal Length", value: work.exifFocalLength },
  ].filter((e) => e.value);

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: title,
    description: description ?? undefined,
    image: work.imageUrl,
    url: pageUrl,
    creator: {
      "@type": "Person",
      name: "صالح الهذلول",
      sameAs: `${BASE_URL}/${locale}/about`,
    },
    ...(work.dateTaken ? { dateCreated: new Date(work.dateTaken).toISOString().split("T")[0] } : {}),
    ...(location ? { locationCreated: { "@type": "Place", name: location } } : {}),
    ...(work.exifCamera ? { material: work.exifCamera } : {}),
  };

  return (
    <>
      {/* JSON-LD structured data */}
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": locale === "ar" ? "الرئيسية" : "Home", "item": `${BASE_URL}/${locale}` },
              { "@type": "ListItem", "position": 2, "name": locale === "ar" ? "المعرض" : "Portfolio", "item": `${BASE_URL}/${locale}/portfolio` },
              { "@type": "ListItem", "position": 3, "name": title ?? work.code, "item": `${BASE_URL}/${locale}/portfolio/${work.code}` },
            ]
          })
        }}
      />

      <article className="wd-article">
        <div className="wd-inner container">
          {/* Back */}
          <Link href={`/${locale}/portfolio`} className="wd-back" dir={dir}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {locale === "ar" ? <path d="M5 2l4 5-4 5" /> : <path d="M9 2L5 7l4 5" />}
            </svg>
            {t("title")}
          </Link>
          <Breadcrumb
            items={[
              { label: locale === "ar" ? "الرئيسية" : "Home", href: `/${locale}` },
              { label: locale === "ar" ? "المعرض" : "Portfolio", href: `/${locale}/portfolio` },
              { label: title ?? work.code },
            ]}
          />

          {/* Hero image — full width */}
          <div className="wd-hero" style={{ aspectRatio: `${work.width} / ${work.height}` }}>
            <Image
              src={work.imageUrl}
              alt={title ?? ""}
              fill
              className="wd-hero-img"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
            />
          </div>

          {/* Mobile-only inline nav — directly below image */}
          {(prevWork || nextWork) && (
            <div className="wd-mobile-nav" dir="ltr">
              {prevWork ? (
                <Link href={`/${locale}/portfolio/${prevWork.code}`} className="wd-mnav-btn" aria-label={locale === "ar" ? prevWork.titleAr : prevWork.titleEn}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M10 3L5 8l5 5" />
                  </svg>
                </Link>
              ) : <span className="wd-mnav-btn wd-mnav-btn--empty" />}
              {nextWork ? (
                <Link href={`/${locale}/portfolio/${nextWork.code}`} className="wd-mnav-btn" aria-label={locale === "ar" ? nextWork.titleAr : nextWork.titleEn}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M6 3l5 5-5 5" />
                  </svg>
                </Link>
              ) : <span className="wd-mnav-btn wd-mnav-btn--empty" />}
            </div>
          )}

          {/* Below image */}
          <div className="wd-content" dir={dir}>
            <div className="wd-split">

              {/* col1 — title + location */}
              <div className="wd-col-title">
                <h1 className="wd-title">{title}</h1>
                {location && (
                  <div className="wd-location">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                      <circle cx="12" cy="9" r="2.5"/>
                    </svg>
                    {googleMapsUrl ? (
                      <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="wd-location-link">
                        {location}
                      </a>
                    ) : (
                      <span>{location}</span>
                    )}
                  </div>
                )}
              </div>

              {/* col2 — metadata + description */}
              {description ? (
                <div className="wd-col-desc">
                  <div className="wd-meta-row">
                    <span className="wd-code">{work.code}</span>
                    {category && <span className="wd-category">{category}</span>}
                    {formattedDate && <span className="wd-date">{formattedDate}</span>}
                  </div>
                  <p>{description}</p>
                </div>
              ) : (
                <div className="wd-col-desc wd-col-desc--no-text">
                  <div className="wd-meta-row">
                    <span className="wd-code">{work.code}</span>
                    {category && <span className="wd-category">{category}</span>}
                    {formattedDate && <span className="wd-date">{formattedDate}</span>}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* EXIF data + Share row */}
          <div className="wd-footer-row" dir={dir}>
            {/* EXIF */}
            {exif.length > 0 && (
              <div className="wd-exif">
                <span className="wd-section-title">{locale === "ar" ? "بيانات التصوير" : "Camera Data"}</span>
                <div className="wd-exif-grid">
                  {exif.map((e) => (
                    <div key={e.key} className="wd-exif-item">
                      <span className="wd-exif-label">{locale === "ar" ? e.labelAr : e.labelEn}</span>
                      <span className="wd-exif-value" dir="ltr">{e.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share */}
            <div className="wd-share">
              <span className="wd-section-title">{locale === "ar" ? "مشاركة" : "Share"}</span>
              <ShareButtons url={pageUrl} title={title ?? ""} locale={locale as "ar" | "en"} />
            </div>
          </div>

          {/* Extra images gallery — interactive with lightbox */}
          <WorkGallery
            images={work.images}
            title={title ?? ""}
            headingLabel={locale === "ar" ? "صور إضافية" : "Additional Photos"}
            dir={dir as "rtl" | "ltr"}
          />

          {/* Related works */}
          <RelatedWorks
            currentCode={work.code}
            categoryId={work.categoryId}
            locale={locale}
          />

        </div>
      </article>

      {/* ── Prev / Next fixed arrows ── */}
      {prevWork && (
        <Link
          href={`/${locale}/portfolio/${prevWork.code}`}
          className="wd-nav wd-nav--prev"
          aria-label={locale === "ar" ? prevWork.titleAr : prevWork.titleEn}
          dir="ltr"
        >
          <span className="wd-nav-arrow">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M11 4L6 9l5 5" />
            </svg>
          </span>
          <span className="wd-nav-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={prevWork.imageUrl} alt="" aria-hidden="true" />
          </span>
        </Link>
      )}
      {nextWork && (
        <Link
          href={`/${locale}/portfolio/${nextWork.code}`}
          className="wd-nav wd-nav--next"
          aria-label={locale === "ar" ? nextWork.titleAr : nextWork.titleEn}
          dir="ltr"
        >
          <span className="wd-nav-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={nextWork.imageUrl} alt="" aria-hidden="true" />
          </span>
          <span className="wd-nav-arrow">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 4l5 5-5 5" />
            </svg>
          </span>
        </Link>
      )}

      <style>{`
        .wd-article { padding-bottom: 8rem; }

        .wd-inner {
          max-width: 1000px;
          margin-inline: auto;
          padding-top: 2rem;
        }

        .wd-back {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 2rem;
          transition: color var(--transition-fast);
          text-decoration: none;
        }
        .wd-back:hover { color: var(--text-primary); }

        /* Hero image */
        .wd-hero {
          position: relative;
          width: 100%;
          max-height: 80svh;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--bg-primary);
        }
        .wd-hero-img { object-fit: contain; }

        /* Below-image content area */
        .wd-content { margin-top: 1.75rem; }

        /* Title + Description split — always 2 col */
        .wd-split {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0;
          align-items: start;
          margin-top: 0.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border-subtle);
        }

        /* col1 — title + location */
        .wd-col-title {
          padding-inline-end: 2.5rem;
        }

        /* col2 — metadata + description */
        .wd-col-desc { }
        .wd-col-desc--no-text { } /* no description, just metadata */

        .wd-meta-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }

        .wd-col-desc p {
          font-size: 0.92rem;
          line-height: 1.9;
          color: var(--text-secondary);
          margin: 0;
        }

        @media (max-width: 767px) {
          .wd-split {
            grid-template-columns: 1fr 1fr;
            gap: 0;
          }
          .wd-col-title { padding-inline-end: 1rem; }
        }

        .wd-code {
          font-size: 0.68rem;
          color: var(--text-subtle);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .wd-category {
          font-size: 0.72rem;
          color: var(--text-muted);
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 0.15rem 0.65rem;
        }

        .wd-date {
          font-size: 0.72rem;
          color: var(--text-subtle);
        }

        .wd-title {
          font-family: var(--font-heading);
          font-size: clamp(1.5rem, 4vw, 2.5rem);
          font-weight: 300;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin-bottom: 0.75rem;
        }

        .wd-location {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.82rem;
          color: var(--text-muted);
        }

        .wd-location-link {
          color: inherit;
          text-decoration: none;
          border-bottom: 1px solid var(--border);
          transition: color var(--transition-fast), border-color var(--transition-fast);
        }
        .wd-location-link:hover {
          color: var(--text-primary);
          border-color: var(--text-muted);
        }

        .wd-section-title {
          display: block;
          font-family: var(--font-heading);
          font-weight: 400;
          color: var(--text-muted);
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.7rem;
        }

        /* EXIF + Share footer row */
        .wd-footer-row {
          display: flex;
          gap: 3rem;
          align-items: flex-start;
          padding-top: 1.75rem;
          margin-top: 1.75rem;
          border-top: 1px solid var(--border-subtle);
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
        }

        .wd-exif { flex: 1; min-width: 0; }

        .wd-exif-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem 1.5rem;
        }

        .wd-exif-item {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .wd-exif-label {
          font-size: 0.68rem;
          color: var(--text-subtle);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .wd-exif-value {
          font-size: 0.82rem;
          color: var(--text-secondary);
          font-variant-numeric: tabular-nums;
        }

        .wd-share { flex-shrink: 0; }

        @media (max-width: 640px) {
          .wd-footer-row { gap: 1.5rem; }
        }

        /* ── Prev / Next fixed arrows ── */
        .wd-nav {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 0;
          text-decoration: none;
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }

        .wd-nav--prev { left: 0; flex-direction: row; }
        .wd-nav--next { right: 0; flex-direction: row-reverse; }

        .wd-nav:hover { color: var(--text-primary); }

        .wd-nav-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 56px;
          background: var(--bg-primary);
          border: 1px solid var(--border-subtle);
          transition: background var(--transition-fast), border-color var(--transition-fast), width var(--transition-base);
        }

        .wd-nav--prev .wd-nav-arrow {
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
          border-inline-start: none;
        }

        .wd-nav--next .wd-nav-arrow {
          border-radius: var(--radius-md) 0 0 var(--radius-md);
          border-inline-end: none;
        }

        .wd-nav:hover .wd-nav-arrow {
          background: var(--bg-secondary);
          border-color: var(--border);
        }

        /* Thumbnail — hidden by default, slides in on hover */
        .wd-nav-thumb {
          width: 0;
          height: 56px;
          overflow: hidden;
          transition: width var(--transition-base);
          display: block;
          flex-shrink: 0;
        }

        .wd-nav-thumb img {
          width: 56px;
          height: 56px;
          object-fit: cover;
          display: block;
          pointer-events: none;
        }

        .wd-nav--prev .wd-nav-thumb { border-radius: 0 var(--radius-md) var(--radius-md) 0; overflow: hidden; }
        .wd-nav--next .wd-nav-thumb { border-radius: var(--radius-md) 0 0 var(--radius-md); overflow: hidden; }

        .wd-nav:hover .wd-nav-thumb { width: 56px; }

        /* Mobile inline nav — below image */
        .wd-mobile-nav {
          display: none;
        }

        @media (max-width: 768px) {
          /* Hide fixed side arrows */
          .wd-nav { display: none; }

          /* Show inline nav row */
          .wd-mobile-nav {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.6rem 0 0;
          }

          .wd-article { padding-bottom: 5rem; }
        }

        .wd-mnav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid var(--border-subtle);
          border-radius: 50%;
          color: var(--text-muted);
          text-decoration: none;
          transition: background var(--transition-fast), color var(--transition-fast);
        }
        .wd-mnav-btn:hover { background: var(--bg-secondary); color: var(--text-primary); }
        .wd-mnav-btn--empty { visibility: hidden; }

      `}</style>
    </>
  );
}
