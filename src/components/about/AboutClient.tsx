"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

// ─── Types ────────────────────────────────────────────────

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

interface Props {
  name: string;
  bioAr: string | null;
  bioEn: string | null;
  imageUrl: string | null;
  layout: "classic" | "stacked" | "portrait" | "minimal";
  experience: ExperienceItem[];
  achievements: AchievementItem[];
  locale: string;
}

// ─── Animation variants ───────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.75,
      delay: i * 0.1,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

// ─── Helpers ──────────────────────────────────────────────

function splitBio(bio: string | null): string[] {
  return bio ? bio.split(/\n\n+/).filter(Boolean) : [];
}

// ─── Sub-components ───────────────────────────────────────

function ExperienceSection({ items, locale, isRtl }: { items: ExperienceItem[]; locale: string; isRtl: boolean }) {
  if (items.length === 0) return null;
  return (
    <div className="about-exp-section">
      <h3 className="about-section-heading">{isRtl ? "التجارب" : "Experience"}</h3>
      <div className="about-timeline">
        {items.map((item, i) => (
          <motion.div
            key={i}
            className="about-timeline-item"
            custom={i}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-20px" }}
          >
            <div className="about-timeline-dot" />
            <div className="about-timeline-content">
              <div className="about-timeline-meta">
                <span className="about-timeline-period" dir="ltr">{item.period}</span>
              </div>
              <h4 className="about-timeline-title">
                {isRtl ? item.titleAr : item.titleEn}
              </h4>
              <p className="about-timeline-org">
                {isRtl ? item.orgAr : item.orgEn}
              </p>
              {(isRtl ? item.descAr : item.descEn) && (
                <p className="about-timeline-desc">
                  {isRtl ? item.descAr : item.descEn}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AchievementsSection({ items, locale, isRtl }: { items: AchievementItem[]; locale: string; isRtl: boolean }) {
  if (items.length === 0) return null;
  return (
    <div className="about-ach-section">
      <h3 className="about-section-heading">{isRtl ? "الإنجازات" : "Achievements"}</h3>
      <div className="about-ach-grid">
        {items.map((item, i) => (
          <motion.div
            key={i}
            className="about-ach-card"
            custom={i}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-20px" }}
          >
            <span className="about-ach-year" dir="ltr">{item.year}</span>
            <h4 className="about-ach-title">{isRtl ? item.titleAr : item.titleEn}</h4>
            {(isRtl ? item.descAr : item.descEn) && (
              <p className="about-ach-desc">{isRtl ? item.descAr : item.descEn}</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PhotoBlock({ imageUrl, name, className, sizes }: { imageUrl: string; name: string; className?: string; sizes?: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <motion.div className={`about-img-wrap ${className ?? ""}`} variants={fadeIn} initial="hidden" animate="show">
      <div className={`about-shimmer ${loaded ? "done" : ""}`} />
      <Image
        src={imageUrl}
        alt={name}
        fill
        className={`about-img ${loaded ? "loaded" : ""}`}
        sizes={sizes ?? "(max-width: 900px) 100vw, 40vw"}
        priority
        onLoad={() => setLoaded(true)}
      />
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────

export default function AboutClient({
  name,
  bioAr,
  bioEn,
  imageUrl,
  layout,
  experience,
  achievements,
  locale,
}: Props) {
  const t = useTranslations("about");
  const isRtl = locale === "ar";
  const bio = isRtl ? bioAr : bioEn;
  const paragraphs = splitBio(bio);
  const hasExtra = experience.length > 0 || achievements.length > 0;

  return (
    <div className={`about-page container about-layout--${layout}`} dir={isRtl ? "rtl" : "ltr"}>
      {/* Page label */}
      <motion.p
        className="about-label"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {t("title")}
      </motion.p>

      {/* ── CLASSIC layout ── */}
      {layout === "classic" && (
        <>
          <div className="about-classic-grid">
            {imageUrl && (
              <div className="about-classic-img-col">
                <PhotoBlock imageUrl={imageUrl} name={name} className="about-classic-img-wrap" sizes="(max-width: 900px) 100vw, 40vw" />
              </div>
            )}
            <div className={`about-text-col${!imageUrl ? " about-text-col--full" : ""}`}>
              <motion.h1 className="about-name" custom={0} variants={fadeUp} initial="hidden" animate="show">{name}</motion.h1>
              <motion.div
                className="about-rule"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                style={{ transformOrigin: isRtl ? "right" : "left" }}
              />
              <div className="about-bio">
                {paragraphs.length > 0 ? paragraphs.map((para, i) => (
                  <motion.p key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-20px" }}>{para}</motion.p>
                )) : (
                  <motion.p custom={0} variants={fadeUp} initial="hidden" animate="show" className="about-placeholder">&mdash;</motion.p>
                )}
              </div>
            </div>
          </div>
          {hasExtra && (
            <div className="about-extra-row">
              <ExperienceSection items={experience} locale={locale} isRtl={isRtl} />
              <AchievementsSection items={achievements} locale={locale} isRtl={isRtl} />
            </div>
          )}
        </>
      )}

      {/* ── STACKED layout ── */}
      {layout === "stacked" && (
        <>
          {imageUrl && (
            <div className="about-stacked-img-wrap">
              <PhotoBlock imageUrl={imageUrl} name={name} className="about-stacked-photo" sizes="(max-width: 768px) 100vw, 600px" />
            </div>
          )}
          <div className="about-stacked-text">
            <motion.h1 className="about-name" custom={0} variants={fadeUp} initial="hidden" animate="show">{name}</motion.h1>
            <motion.div
              className="about-rule"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              style={{ transformOrigin: isRtl ? "right" : "left" }}
            />
            <div className="about-bio">
              {paragraphs.length > 0 ? paragraphs.map((para, i) => (
                <motion.p key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-20px" }}>{para}</motion.p>
              )) : (
                <motion.p custom={0} variants={fadeUp} initial="hidden" animate="show" className="about-placeholder">&mdash;</motion.p>
              )}
            </div>
          </div>
          {hasExtra && (
            <div className="about-extra-row">
              <ExperienceSection items={experience} locale={locale} isRtl={isRtl} />
              <AchievementsSection items={achievements} locale={locale} isRtl={isRtl} />
            </div>
          )}
        </>
      )}

      {/* ── PORTRAIT layout ── */}
      {layout === "portrait" && (
        <div className="about-portrait-grid">
          {imageUrl && (
            <div className="about-portrait-img-col">
              <PhotoBlock imageUrl={imageUrl} name={name} className="about-portrait-photo" sizes="(max-width: 900px) 100vw, 35vw" />
            </div>
          )}
          <div className={`about-portrait-content${!imageUrl ? " about-portrait-content--full" : ""}`}>
            <motion.h1 className="about-name" custom={0} variants={fadeUp} initial="hidden" animate="show">{name}</motion.h1>
            <motion.div
              className="about-rule"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              style={{ transformOrigin: isRtl ? "right" : "left" }}
            />
            <div className="about-bio">
              {paragraphs.length > 0 ? paragraphs.map((para, i) => (
                <motion.p key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-20px" }}>{para}</motion.p>
              )) : (
                <motion.p custom={0} variants={fadeUp} initial="hidden" animate="show" className="about-placeholder">&mdash;</motion.p>
              )}
            </div>
            <ExperienceSection items={experience} locale={locale} isRtl={isRtl} />
            <AchievementsSection items={achievements} locale={locale} isRtl={isRtl} />
          </div>
        </div>
      )}

      {/* ── MINIMAL layout ── */}
      {layout === "minimal" && (
        <div className="about-minimal-wrap">
          {imageUrl && (
            <motion.div className="about-minimal-avatar-wrap" variants={fadeIn} initial="hidden" animate="show">
              <div className="about-minimal-avatar">
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  className="about-minimal-avatar-img"
                  sizes="160px"
                  priority
                />
              </div>
            </motion.div>
          )}
          <motion.h1 className="about-name about-name--centered" custom={0} variants={fadeUp} initial="hidden" animate="show">{name}</motion.h1>
          <motion.div
            className="about-rule"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            style={{ transformOrigin: "center" }}
          />
          <div className="about-bio about-bio--centered">
            {paragraphs.length > 0 ? paragraphs.map((para, i) => (
              <motion.p key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-20px" }}>{para}</motion.p>
            )) : (
              <motion.p custom={0} variants={fadeUp} initial="hidden" animate="show" className="about-placeholder">&mdash;</motion.p>
            )}
          </div>
          {hasExtra && (
            <div className="about-minimal-extra">
              <ExperienceSection items={experience} locale={locale} isRtl={isRtl} />
              <AchievementsSection items={achievements} locale={locale} isRtl={isRtl} />
            </div>
          )}
        </div>
      )}

      {/* ── Styles ── */}
      <style>{`
        .about-page {
          padding-top: 4rem;
          padding-bottom: 7rem;
          padding-inline: calc(2rem + 3vw);
        }

        .about-label {
          font-size: 1.1rem;
          letter-spacing: 0.04em;
          font-family: var(--font-heading);
          color: var(--text-subtle);
          margin-bottom: 3.5rem;
        }

        /* ── Image shared ── */
        .about-img-wrap {
          position: relative;
          overflow: hidden;
          background: var(--bg-secondary);
        }

        .about-shimmer {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(90deg, var(--bg-secondary) 0%, var(--bg-tertiary) 50%, var(--bg-secondary) 100%);
          background-size: 200% 100%;
          animation: about-shimmer 1.6s infinite;
          transition: opacity 0.4s;
        }

        .about-shimmer.done { opacity: 0; pointer-events: none; }

        @keyframes about-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .about-img {
          object-fit: cover;
          transition: opacity 0.5s;
          opacity: 0;
        }

        .about-img.loaded { opacity: 1; }

        /* ── Text shared ── */
        .about-name {
          font-family: var(--font-heading);
          font-size: clamp(1.9rem, 3.5vw, 3rem);
          font-weight: 300;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          line-height: 1.1;
          margin-bottom: 1.5rem;
        }

        .about-name--centered {
          text-align: center;
        }

        .about-rule {
          height: 1px;
          background: var(--border);
          margin-bottom: 2.5rem;
        }

        .about-bio {
          display: flex;
          flex-direction: column;
          gap: 1.6rem;
          color: var(--text-secondary);
          line-height: 1.9;
          font-size: clamp(0.95rem, 1.3vw, 1.05rem);
        }

        .about-bio--centered {
          max-width: 680px;
          margin-inline: auto;
          text-align: center;
        }

        .about-placeholder {
          color: var(--text-subtle);
        }

        .about-text-col {
          padding-top: 0.5rem;
        }

        .about-text-col--full {
          max-width: 680px;
        }

        /* ── CLASSIC ── */
        .about-classic-grid {
          display: grid;
          grid-template-columns: 2.5fr 9.5fr;
          gap: 5rem;
          align-items: start;
        }

        @media (max-width: 900px) {
          .about-classic-grid { grid-template-columns: 1fr; gap: 2.5rem; }
        }

        .about-classic-img-col {
          position: sticky;
          top: 5.5rem;
        }

        @media (max-width: 900px) {
          .about-classic-img-col { position: static; }
        }

        .about-classic-img-wrap {
          border-radius: var(--radius-lg);
          padding-bottom: 128%;
        }

        /* ── STACKED ── */
        .about-stacked-img-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 3rem;
        }

        .about-stacked-photo {
          width: 100%;
          max-width: 600px;
          padding-bottom: 56.25%;
          border-radius: var(--radius-lg);
        }

        .about-stacked-text {
          max-width: 720px;
          margin-inline: auto;
        }

        /* ── PORTRAIT ── */
        .about-portrait-grid {
          display: grid;
          grid-template-columns: 35fr 65fr;
          gap: 5rem;
          align-items: start;
        }

        @media (max-width: 900px) {
          .about-portrait-grid { grid-template-columns: 1fr; gap: 2.5rem; }
        }

        .about-portrait-img-col {
          position: sticky;
          top: 5.5rem;
        }

        @media (max-width: 900px) {
          .about-portrait-img-col { position: static; }
        }

        .about-portrait-photo {
          border-radius: var(--radius-lg);
          padding-bottom: 150%; /* 2:3 */
        }

        .about-portrait-content {
          padding-top: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .about-portrait-content--full {
          max-width: 720px;
        }

        /* ── MINIMAL ── */
        .about-minimal-wrap {
          max-width: 720px;
          margin-inline: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .about-minimal-avatar-wrap {
          margin-bottom: 2rem;
        }

        .about-minimal-avatar {
          position: relative;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          overflow: hidden;
          background: var(--bg-secondary);
        }

        .about-minimal-avatar-img {
          object-fit: cover;
        }

        .about-minimal-extra {
          width: 100%;
          margin-top: 3rem;
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }

        /* ── Extra sections shared ── */
        .about-extra-row {
          margin-top: 5rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: start;
        }

        @media (max-width: 900px) {
          .about-extra-row { grid-template-columns: 1fr; gap: 3rem; }
        }

        /* ── Section headings ── */
        .about-section-heading {
          font-family: var(--font-heading);
          font-size: 1.125rem;
          font-weight: 400;
          color: var(--text-primary);
          margin-bottom: 1.75rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-subtle);
          letter-spacing: 0.02em;
        }

        /* ── Experience / Timeline ── */
        .about-exp-section,
        .about-ach-section {
          display: flex;
          flex-direction: column;
        }

        .about-timeline {
          display: flex;
          flex-direction: column;
          gap: 0;
          position: relative;
          padding-inline-start: 1.25rem;
          border-inline-start: 1px solid var(--border-subtle);
        }

        .about-timeline-item {
          position: relative;
          padding-bottom: 2rem;
          padding-inline-start: 1.5rem;
        }

        .about-timeline-item:last-child {
          padding-bottom: 0;
        }

        .about-timeline-dot {
          position: absolute;
          inset-inline-start: -0.5rem;
          top: 0.35rem;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--text-muted);
          border: 2px solid var(--bg-primary);
        }

        .about-timeline-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .about-timeline-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.125rem;
        }

        .about-timeline-period {
          font-size: 0.75rem;
          color: var(--text-muted);
          letter-spacing: 0.04em;
        }

        .about-timeline-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .about-timeline-org {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .about-timeline-desc {
          font-size: 0.8375rem;
          color: var(--text-muted);
          line-height: 1.7;
          margin: 0.25rem 0 0;
        }

        /* ── Achievements grid ── */
        .about-ach-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .about-ach-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .about-ach-year {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.06em;
        }

        .about-ach-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.4;
        }

        .about-ach-desc {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
