import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { db } from "@/lib/db";

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, code } = await params;
  const work = await getWork(code);
  if (!work) return {};
  const title = locale === "ar" ? work.titleAr : work.titleEn;
  const desc = locale === "ar" ? work.descriptionAr : work.descriptionEn;
  return {
    title,
    description: desc ?? undefined,
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

  const hasMap = work.lat != null && work.lng != null;
  // Google Maps link: prefer direct mapsUrl, fall back to lat/lng
  const googleMapsUrl = (work as { mapsUrl?: string | null }).mapsUrl
    ?? (hasMap ? `https://www.google.com/maps?q=${work.lat!},${work.lng!}` : null);

  return (
    <>
      <article className="wd-article">
        <div className="wd-inner container">
          {/* Back */}
          <Link href={`/${locale}/portfolio`} className="wd-back" dir={dir}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {locale === "ar" ? <path d="M5 2l4 5-4 5" /> : <path d="M9 2L5 7l4 5" />}
            </svg>
            {t("title")}
          </Link>

          {/* Hero image */}
          <div
            className="wd-hero"
            style={{ aspectRatio: `${work.width} / ${work.height}` }}
          >
            <Image
              src={work.imageUrl}
              alt={title ?? ""}
              fill
              className="wd-hero-img"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
            />
          </div>

          {/* Content */}
          <div className="wd-content" dir={dir}>
            {/* Header */}
            <div className="wd-header">
              <div className="wd-meta-row">
                <span className="wd-code">{work.code}</span>
                {category && <span className="wd-category">{category}</span>}
                {formattedDate && <span className="wd-date">{formattedDate}</span>}
              </div>
              <h1 className="wd-title">{title}</h1>
              {location && (
                <div className="wd-location">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                  {location}
                  {googleMapsUrl && (
                    <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="wd-maps-link">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      {locale === "ar" ? "خرائط جوجل" : "Google Maps"}
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            {description && (
              <div className="wd-description">
                <p>{description}</p>
              </div>
            )}

            {/* Extra images gallery */}
            {work.images.length > 0 && (
              <div className="wd-gallery">
                <h2 className="wd-gallery-title">{locale === "ar" ? "صور إضافية" : "Additional Photos"}</h2>
                <div className="wd-gallery-grid">
                  {work.images.map((img) => (
                    <div key={img.id} className="wd-gallery-item">
                      <Image
                        src={img.url}
                        alt={title ?? ""}
                        fill
                        className="wd-gallery-img"
                        sizes="(max-width: 640px) 50vw, 400px"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {hasMap && (
              <div className="wd-map-section">
                <h2 className="wd-section-title">
                  {locale === "ar" ? "موقع التصوير" : "Shooting Location"}
                </h2>
                <div className="wd-map-wrap">
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${(work.lng! - 0.05).toFixed(6)},${(work.lat! - 0.05).toFixed(6)},${(work.lng! + 0.05).toFixed(6)},${(work.lat! + 0.05).toFixed(6)}&layer=mapnik&marker=${work.lat!.toFixed(6)},${work.lng!.toFixed(6)}`}
                    title={locale === "ar" ? "موقع التصوير" : "Location map"}
                    loading="lazy"
                    className="wd-map-iframe"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </article>

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

        .wd-hero {
          position: relative;
          width: 100%;
          max-height: 80svh;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--bg-secondary);
        }

        .wd-hero-img { object-fit: contain; }

        .wd-content { margin-top: 2.5rem; }

        .wd-header { margin-bottom: 2rem; }

        .wd-meta-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
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

        .wd-maps-link {
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
          font-size: 0.72rem;
          color: var(--text-subtle);
          text-decoration: none;
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 0.1rem 0.5rem;
          transition: color var(--transition-fast), border-color var(--transition-fast);
          white-space: nowrap;
        }
        .wd-maps-link:hover {
          color: var(--text-primary);
          border-color: var(--text-muted);
        }

        .wd-description {
          max-width: 680px;
          color: var(--text-secondary);
          line-height: 1.8;
          font-size: 1rem;
          margin-bottom: 3rem;
          border-top: 1px solid var(--border-subtle);
          padding-top: 2rem;
        }

        .wd-section-title, .wd-gallery-title {
          font-family: var(--font-heading);
          font-weight: 400;
          color: var(--text-muted);
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.75rem;
        }

        .wd-gallery { margin-bottom: 3rem; }

        .wd-gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 0.75rem;
        }

        .wd-gallery-item {
          position: relative;
          aspect-ratio: 4/3;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--bg-secondary);
        }

        .wd-gallery-img { object-fit: cover; transition: transform 500ms ease; }
        .wd-gallery-item:hover .wd-gallery-img { transform: scale(1.04); }

        .wd-map-section { margin-bottom: 3rem; }

        .wd-map-wrap {
          border-radius: var(--radius-md);
          overflow: hidden;
          height: 380px;
          border: 1px solid var(--border);
        }

        .wd-map-iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }

        @media (max-width: 640px) {
          .wd-gallery-grid { grid-template-columns: repeat(2, 1fr); }
          .wd-map-wrap { height: 260px; }
        }
      `}</style>
    </>
  );
}
