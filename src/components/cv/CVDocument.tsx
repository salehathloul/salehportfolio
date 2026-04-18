"use client";

interface ExhibitionItem {
  titleAr: string;
  titleEn: string;
  locationAr: string | null;
  locationEn: string | null;
  year: number;
  type: string;
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

interface CVProps {
  locale: "ar" | "en";
  name: string;
  bioAr: string | null;
  bioEn: string | null;
  experience: ExperienceItem[];
  achievements: AchievementItem[];
  exhibitions: ExhibitionItem[];
  socialEmail: string | null;
  socialLinkedin: string | null;
  socialInstagram: string | null;
  artistSignatureUrl: string | null;
}

const typeLabels: Record<string, { ar: string; en: string }> = {
  solo: { ar: "معرض فردي", en: "Solo Exhibition" },
  group: { ar: "معرض جماعي", en: "Group Exhibition" },
  award: { ar: "جائزة", en: "Award" },
  publication: { ar: "منشور", en: "Publication" },
};

export default function CVDocument({
  locale,
  name,
  bioAr,
  bioEn,
  experience,
  achievements,
  exhibitions,
  socialEmail,
  socialLinkedin,
  socialInstagram,
  artistSignatureUrl,
}: CVProps) {
  const isAr = locale === "ar";
  const bio = isAr ? bioAr : bioEn;

  const contactParts: string[] = [];
  if (socialEmail) contactParts.push(socialEmail);
  if (socialLinkedin) contactParts.push(socialLinkedin);
  if (socialInstagram) contactParts.push(socialInstagram);

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 1.5cm; }
          body { background: white !important; }
          header, nav, footer,
          .site-header, .site-footer,
          .bc-nav, .floating-contact,
          [data-noprint] {
            display: none !important;
          }
          .cv-print-btn { display: none !important; }
          .cv-wrapper { padding: 0 !important; }
          .cv-doc { box-shadow: none !important; }
        }

        .cv-wrapper {
          padding: 2rem 1rem 4rem;
          background: var(--bg-primary);
          min-height: 100vh;
        }

        .cv-topbar {
          max-width: 800px;
          margin: 0 auto 1.25rem;
          display: flex;
          justify-content: flex-end;
        }

        .cv-print-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 1.2rem;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 4px;
          font-family: var(--font-body);
          font-size: 0.8rem;
          color: var(--text-primary);
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .cv-print-btn:hover {
          background: var(--text-primary);
          color: var(--bg-primary);
        }

        .cv-doc {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          color: #111;
          padding: 3rem 3.5rem;
          box-shadow: 0 2px 24px rgba(0,0,0,0.08);
          font-family: var(--font-body, Georgia, serif);
          line-height: 1.6;
        }

        .cv-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid #111;
          margin-bottom: 1.75rem;
        }

        .cv-name {
          font-family: var(--font-heading, Georgia, serif);
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #111;
          margin: 0 0 0.35rem;
          line-height: 1.15;
        }

        .cv-bio {
          font-size: 0.87rem;
          color: #444;
          max-width: 480px;
          margin: 0;
          line-height: 1.65;
        }

        .cv-contact {
          text-align: end;
          font-size: 0.78rem;
          color: #555;
          line-height: 1.9;
          flex-shrink: 0;
        }
        .cv-contact a {
          color: #555;
          text-decoration: none;
        }

        .cv-section {
          margin-bottom: 2.25rem;
        }

        .cv-section-title {
          font-family: var(--font-heading, Georgia, serif);
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #888;
          margin: 0 0 1rem;
          padding-bottom: 0.4rem;
          border-bottom: 1px solid #ddd;
        }

        .cv-item {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 0 1.5rem;
          margin-bottom: 1.1rem;
          align-items: baseline;
        }

        .cv-item-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #111;
          margin: 0;
        }

        .cv-item-org {
          font-size: 0.82rem;
          color: #555;
          margin: 0.1rem 0 0;
        }

        .cv-item-desc {
          font-size: 0.8rem;
          color: #666;
          margin: 0.3rem 0 0;
          grid-column: 1 / -1;
          line-height: 1.55;
        }

        .cv-item-meta {
          font-size: 0.78rem;
          color: #888;
          white-space: nowrap;
          text-align: end;
        }

        .cv-item-type {
          font-size: 0.7rem;
          color: #aaa;
          display: block;
          margin-top: 0.15rem;
        }

        .cv-signature {
          margin-top: 2.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: flex-end;
        }
        .cv-signature img {
          height: 48px;
          width: auto;
          opacity: 0.75;
        }

        @media (max-width: 600px) {
          .cv-doc { padding: 1.75rem 1.25rem; }
          .cv-header { flex-direction: column; gap: 1rem; }
          .cv-contact { text-align: start; }
          .cv-name { font-size: 1.5rem; }
        }
      `}</style>

      <div className="cv-wrapper" dir={isAr ? "rtl" : "ltr"}>
        {/* Top action bar — hidden when printing */}
        <div className="cv-topbar">
          <button className="cv-print-btn" onClick={() => window.print()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            {isAr ? "تحميل PDF" : "Download PDF"}
          </button>
        </div>

        {/* CV Document */}
        <div className="cv-doc">
          {/* Header */}
          <div className="cv-header">
            <div>
              <h1 className="cv-name">{name}</h1>
              {bio && <p className="cv-bio">{bio}</p>}
            </div>
            {contactParts.length > 0 && (
              <div className="cv-contact">
                {socialEmail && (
                  <div>
                    <a href={`mailto:${socialEmail}`}>{socialEmail}</a>
                  </div>
                )}
                {socialLinkedin && (
                  <div>
                    <a href={socialLinkedin} target="_blank" rel="noopener noreferrer">
                      {socialLinkedin.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  </div>
                )}
                {socialInstagram && (
                  <div>
                    <a href={`https://instagram.com/${socialInstagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer">
                      {socialInstagram.startsWith("@") ? socialInstagram : `@${socialInstagram}`}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Experience */}
          {experience.length > 0 && (
            <div className="cv-section">
              <h2 className="cv-section-title">
                {isAr ? "الخبرات" : "Experience"}
              </h2>
              {experience.map((item, i) => (
                <div key={i} className="cv-item">
                  <div>
                    <p className="cv-item-title">{isAr ? item.titleAr : item.titleEn}</p>
                    <p className="cv-item-org">{isAr ? item.orgAr : item.orgEn}</p>
                  </div>
                  <div className="cv-item-meta">{item.period}</div>
                  {(isAr ? item.descAr : item.descEn) && (
                    <p className="cv-item-desc">{isAr ? item.descAr : item.descEn}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="cv-section">
              <h2 className="cv-section-title">
                {isAr ? "الإنجازات" : "Achievements"}
              </h2>
              {achievements.map((item, i) => (
                <div key={i} className="cv-item">
                  <div>
                    <p className="cv-item-title">{isAr ? item.titleAr : item.titleEn}</p>
                  </div>
                  <div className="cv-item-meta">{item.year}</div>
                  {(isAr ? item.descAr : item.descEn) && (
                    <p className="cv-item-desc">{isAr ? item.descAr : item.descEn}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Exhibitions */}
          {exhibitions.length > 0 && (
            <div className="cv-section">
              <h2 className="cv-section-title">
                {isAr ? "المعارض والجوائز" : "Exhibitions & Awards"}
              </h2>
              {exhibitions.map((item) => (
                <div key={item.titleEn + item.year} className="cv-item">
                  <div>
                    <p className="cv-item-title">{isAr ? item.titleAr : item.titleEn}</p>
                    {(isAr ? item.locationAr : item.locationEn) && (
                      <p className="cv-item-org">{isAr ? item.locationAr : item.locationEn}</p>
                    )}
                  </div>
                  <div className="cv-item-meta">
                    {item.year}
                    <span className="cv-item-type">
                      {(typeLabels[item.type] ?? typeLabels.solo)[isAr ? "ar" : "en"]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Signature */}
          {artistSignatureUrl && (
            <div className="cv-signature">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={artistSignatureUrl} alt={isAr ? "توقيع الفنان" : "Artist signature"} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
