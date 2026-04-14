import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import Link from "next/link";

export const metadata: Metadata = { title: "المعارض والجوائز" };

async function getExhibitions() {
  try {
    return await db.exhibition.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }, { order: "asc" }],
    });
  } catch {
    return [];
  }
}

const TYPE_ICONS: Record<string, string> = {
  solo: "◆",
  group: "◇",
  award: "★",
  publication: "◎",
};

const TYPE_LABELS = {
  ar: { solo: "معرض فردي", group: "معرض جماعي", award: "جائزة / تكريم", publication: "نشر / إعلام" },
  en: { solo: "Solo Exhibition", group: "Group Exhibition", award: "Award / Recognition", publication: "Publication / Press" },
};

export default async function ExhibitionsPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const exhibitions = await getExhibitions();

  const typeLabels = isAr ? TYPE_LABELS.ar : TYPE_LABELS.en;

  // Group by year
  const byYear = exhibitions.reduce<Record<number, typeof exhibitions>>((acc, ex) => {
    if (!acc[ex.year]) acc[ex.year] = [];
    acc[ex.year].push(ex);
    return acc;
  }, {});
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

  const title = isAr ? "المعارض والجوائز" : "Exhibitions & Awards";
  const sub = isAr ? "مسيرة فنية موثّقة" : "A documented artistic journey";

  return (
    <main className="ex-main container" dir={dir}>
      <header className="ex-header">
        <h1 className="ex-page-title">{title}</h1>
        <p className="ex-sub">{sub}</p>
      </header>

      {/* Legend */}
      <div className="ex-legend">
        {(["solo", "group", "award", "publication"] as const).map((t) => (
          <span key={t} className="ex-legend-item">
            <span className="ex-icon">{TYPE_ICONS[t]}</span>
            {typeLabels[t]}
          </span>
        ))}
      </div>

      {years.length === 0 ? (
        <p className="ex-empty">{isAr ? "لا توجد بيانات بعد." : "No data yet."}</p>
      ) : (
        <div className="ex-timeline">
          {years.map((year) => (
            <div key={year} className="ex-year-group">
              <div className="ex-year-label">{year}</div>
              <div className="ex-year-items">
                {byYear[year].map((ex) => {
                  const exTitle = isAr ? ex.titleAr : ex.titleEn;
                  const exLocation = isAr ? ex.locationAr : ex.locationEn;
                  const exDesc = isAr ? ex.descriptionAr : ex.descriptionEn;
                  return (
                    <div key={ex.id} className="ex-item">
                      <span className="ex-item-icon" title={typeLabels[ex.type as keyof typeof typeLabels]}>
                        {TYPE_ICONS[ex.type] ?? "·"}
                      </span>
                      <div className="ex-item-body">
                        <div className="ex-item-title">{exTitle}</div>
                        {exLocation && (
                          <div className="ex-item-location">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                              <circle cx="12" cy="9" r="2.5"/>
                            </svg>
                            {exLocation}
                          </div>
                        )}
                        {exDesc && <p className="ex-item-desc">{exDesc}</p>}
                        <span className="ex-type-badge">{typeLabels[ex.type as keyof typeof typeLabels]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="ex-back">
        <Link href={`/${locale}/about`} className="ex-back-link">
          {isAr ? "← عودة للملف الشخصي" : "← Back to About"}
        </Link>
      </div>

      <style>{`
        .ex-main {
          max-width: 780px;
          margin-inline: auto;
          padding-top: 3rem;
          padding-bottom: 8rem;
        }

        .ex-header { margin-bottom: 2.5rem; }

        .ex-page-title {
          font-family: var(--font-heading);
          font-size: clamp(1.75rem, 5vw, 3rem);
          font-weight: 300;
          color: var(--text-primary);
          letter-spacing: -0.03em;
          margin: 0 0 0.5rem;
        }

        .ex-sub {
          font-size: 0.9375rem;
          color: var(--text-muted);
          margin: 0;
        }

        /* Legend */
        .ex-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem 2rem;
          margin-bottom: 3rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-subtle);
        }
        .ex-legend-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
        .ex-icon { font-size: 0.7rem; color: var(--text-subtle); }

        /* Timeline */
        .ex-timeline { display: flex; flex-direction: column; gap: 3rem; }

        .ex-year-group { display: grid; grid-template-columns: 4rem 1fr; gap: 0 2rem; align-items: start; }

        .ex-year-label {
          font-family: var(--font-heading);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-subtle);
          padding-top: 0.125rem;
          text-align: end;
          position: sticky;
          top: 5rem;
        }

        .ex-year-items {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding-inline-start: 1.5rem;
          border-inline-start: 1px solid var(--border-subtle);
        }

        .ex-item {
          display: flex;
          gap: 0.875rem;
          align-items: flex-start;
        }

        .ex-item-icon {
          font-size: 0.65rem;
          color: var(--text-subtle);
          padding-top: 0.3rem;
          flex-shrink: 0;
          min-width: 14px;
        }

        .ex-item-body { flex: 1; min-width: 0; }

        .ex-item-title {
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
          line-height: 1.4;
        }

        .ex-item-location {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 0.3rem;
        }

        .ex-item-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.65;
          margin: 0.3rem 0 0.5rem;
        }

        .ex-type-badge {
          display: inline-block;
          font-size: 0.68rem;
          color: var(--text-subtle);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 0.1rem 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .ex-empty {
          text-align: center;
          color: var(--text-muted);
          padding: 4rem 0;
          font-size: 0.9375rem;
        }

        .ex-back { margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--border-subtle); }

        .ex-back-link {
          font-size: 0.875rem;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 150ms;
        }
        .ex-back-link:hover { color: var(--text-primary); }

        @media (max-width: 640px) {
          .ex-year-group { grid-template-columns: 3rem 1fr; gap: 0 1rem; }
          .ex-year-label { font-size: 0.75rem; }
          .ex-year-items { padding-inline-start: 1rem; }
        }
      `}</style>
    </main>
  );
}
