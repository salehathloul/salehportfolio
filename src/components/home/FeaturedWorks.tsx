"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";

interface Work {
  id: string;
  code: string;
  titleAr: string;
  titleEn: string;
  locationAr: string | null;
  locationEn: string | null;
  imageUrl: string;
  width: number;
  height: number;
}

interface Props {
  works: Work[];
}

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.72,
      delay: (i % 3) * 0.08,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

function WorkCard({ work, locale, index }: { work: Work; locale: string; index: number }) {
  const [loaded, setLoaded] = useState(false);
  const title = locale === "ar" ? work.titleAr : work.titleEn;
  const location = locale === "ar" ? work.locationAr : work.locationEn;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      <Link href={`/${locale}/portfolio`} className="fw-card">
        <div className="fw-img-wrap">
          {/* Shimmer placeholder */}
          <div className={`fw-shimmer ${loaded ? "loaded" : ""}`} />
          <Image
            src={work.imageUrl}
            alt={title}
            fill
            className={`fw-img ${loaded ? "loaded" : ""}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            onLoad={() => setLoaded(true)}
          />
          {/* Hover overlay */}
          <div className="fw-overlay" />
          <div className="fw-hover-info">
            <span className="fw-code">{work.code}</span>
            <span className="fw-name">{title}</span>
            {location && <span className="fw-location">{location}</span>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function FeaturedWorks({ works }: Props) {
  const locale = useLocale();
  const t = useTranslations("home");

  if (works.length === 0) return null;

  return (
    <section className="fw-section container">
      <motion.div
        className="fw-header"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="fw-title">{t("latestWorks")}</h2>
        <Link href={`/${locale}/portfolio`} className="fw-see-all">
          {t("viewAll")}
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            {locale === "ar" ? (
              <path d="M9 3L5 7l4 4" />
            ) : (
              <path d="M5 3l4 4-4 4" />
            )}
          </svg>
        </Link>
      </motion.div>

      <div className="fw-grid">
        {works.map((work, i) => (
          <WorkCard
            key={work.id}
            work={work}
            locale={locale}
            index={i}
          />
        ))}
      </div>

      <style>{`
        .fw-section {
          padding-block: 6rem;
        }

        .fw-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 2.5rem;
        }

        .fw-title {
          font-family: var(--font-heading);
          font-size: clamp(1.25rem, 2.5vw, 1.75rem);
          font-weight: 300;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .fw-see-all {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.825rem;
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }

        .fw-see-all:hover {
          color: var(--text-primary);
        }

        /* Grid */
        .fw-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        @media (max-width: 900px) {
          .fw-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 480px) {
          .fw-grid { grid-template-columns: 1fr; }
          .fw-section { padding-block: 4rem; }
        }

        /* Card */
        .fw-card {
          display: block;
          text-decoration: none;
        }

        .fw-img-wrap {
          position: relative;
          padding-bottom: 72%;
          overflow: hidden;
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
        }

        /* Shimmer */
        .fw-shimmer {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(
            90deg,
            var(--bg-secondary) 0%,
            var(--bg-tertiary) 50%,
            var(--bg-secondary) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.6s infinite;
          transition: opacity 0.4s;
        }

        .fw-shimmer.loaded {
          opacity: 0;
          pointer-events: none;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Image */
        .fw-img {
          object-fit: cover;
          transition: transform var(--transition-slow), opacity 0.5s;
          opacity: 0;
        }

        .fw-img.loaded {
          opacity: 1;
        }

        .fw-card:hover .fw-img {
          transform: scale(1.04);
        }

        /* Overlay hover info */
        .fw-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%);
          opacity: 0;
          transition: opacity var(--transition-base);
        }

        .fw-hover-info {
          position: absolute;
          bottom: 0;
          inset-inline: 0;
          padding: 1rem 1rem 0.875rem;
          transform: translateY(5px);
          opacity: 0;
          transition:
            transform var(--transition-base),
            opacity var(--transition-base);
        }

        .fw-card:hover .fw-overlay,
        .fw-card:hover .fw-hover-info {
          opacity: 1;
        }

        .fw-card:hover .fw-hover-info {
          transform: translateY(0);
        }

        .fw-code {
          display: block;
          font-size: 0.65rem;
          color: rgba(255,255,255,0.55);
          letter-spacing: 0.07em;
          margin-bottom: 0.15rem;
        }

        .fw-name {
          display: block;
          font-size: 0.875rem;
          color: #fff;
          font-weight: 400;
        }

        .fw-location {
          display: block;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.65);
          margin-top: 0.2rem;
        }
      `}</style>
    </section>
  );
}
