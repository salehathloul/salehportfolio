"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";

// ── Types ─────────────────────────────────────────────────────────────────────

type GridLayout = "grid" | "masonry" | "scattered";

interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
}

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
  categoryId: string | null;
}

interface Props {
  works: Work[];
  categories: Category[];
  availableLayouts: GridLayout[];
  defaultLayout: GridLayout;
}

// ── Scattered pattern (6-column grid) ────────────────────────────────────────

const PATTERN: { col: number; row: number }[] = [
  { col: 3, row: 2 },
  { col: 2, row: 1 },
  { col: 1, row: 2 },
  { col: 2, row: 2 },
  { col: 1, row: 1 },
  { col: 3, row: 1 },
  { col: 1, row: 1 },
  { col: 2, row: 1 },
  { col: 1, row: 2 },
  { col: 2, row: 1 },
  { col: 1, row: 1 },
  { col: 3, row: 2 },
];

// ── Card entrance animation ───────────────────────────────────────────────────

const cardAnim = {
  hidden: { opacity: 0, scale: 0.97, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: Math.min(i * 0.04, 0.4),
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
};

// ── Layout icons ──────────────────────────────────────────────────────────────

function IconGrid() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
      <rect x="0.5" y="0.5" width="5.5" height="5.5" rx="1" />
      <rect x="8.5" y="0.5" width="5.5" height="5.5" rx="1" />
      <rect x="0.5" y="8.5" width="5.5" height="5.5" rx="1" />
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" />
    </svg>
  );
}

function IconMasonry() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
      <rect x="0.5" y="0.5" width="5.5" height="8.5" rx="1" />
      <rect x="9" y="0.5" width="5.5" height="5" rx="1" />
      <rect x="0.5" y="11" width="5.5" height="3.5" rx="1" />
      <rect x="9" y="7.5" width="5.5" height="7" rx="1" />
    </svg>
  );
}

function IconScattered() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
      <rect x="0.5" y="0.5" width="8.5" height="4.5" rx="1" />
      <rect x="11" y="0.5" width="3.5" height="7.5" rx="1" />
      <rect x="0.5" y="7" width="3.5" height="7.5" rx="1" />
      <rect x="6" y="7" width="3.5" height="3" rx="1" />
      <rect x="6" y="12" width="3.5" height="2.5" rx="1" />
    </svg>
  );
}

// ── WorkCard ──────────────────────────────────────────────────────────────────

interface CardProps {
  work: Work;
  locale: string;
  showInfo: boolean;
  index: number;
  style?: React.CSSProperties;
  className?: string;
}

function WorkCard({ work, locale, showInfo, index, style, className = "" }: CardProps) {
  const [loaded, setLoaded] = useState(false);
  const title = locale === "ar" ? work.titleAr : work.titleEn;
  const location = locale === "ar" ? work.locationAr : work.locationEn;

  return (
    <motion.div
      custom={index}
      variants={cardAnim}
      initial="hidden"
      animate="show"
      exit="exit"
      className={`wc ${showInfo ? "wc--info" : ""} ${className}`}
      style={style}
      layout
    >
      <Link href={`/${locale}/portfolio/${work.code}`} className="wc-link" tabIndex={0} aria-label={title}>
        {/* Shimmer */}
        <div className={`wc-shimmer ${loaded ? "wc-shimmer--done" : ""}`} />

        {/* Image */}
        <div className="wc-img-wrap">
          <Image
            src={work.imageUrl}
            alt={title}
            fill
            className={`wc-img ${loaded ? "wc-img--loaded" : ""}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            onLoad={() => setLoaded(true)}
          />
        </div>

        {/* Info overlay */}
        <div className="wc-overlay" />
        <div className="wc-info">
          <span className="wc-code">{work.code}</span>
          <span className="wc-title">{title}</span>
          {location && <span className="wc-location">{location}</span>}
        </div>
      </Link>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PortfolioClient({
  works,
  categories,
  availableLayouts,
  defaultLayout,
}: Props) {
  const locale = useLocale();
  const t = useTranslations("portfolio");

  const [layout, setLayout] = useState<GridLayout>(defaultLayout);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showInfo, setShowInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered works — category + search
  const filtered = works
    .filter((w) =>
      activeCategory === "all"
        ? true
        : w.categoryId === activeCategory ||
          (w as { categories?: { id: string }[] }).categories?.some((c) => c.id === activeCategory)
    )
    .filter((w) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        w.titleAr.toLowerCase().includes(q) ||
        w.titleEn.toLowerCase().includes(q) ||
        (w.locationAr ?? "").toLowerCase().includes(q) ||
        (w.locationEn ?? "").toLowerCase().includes(q)
      );
    });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Search ── */}
      <div className="pt-search-wrap container">
        <div className="pt-search">
          <svg className="pt-search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="4.5" />
            <path d="M10 10l3 3" />
          </svg>
          <input
            type="search"
            className="pt-search-input"
            placeholder={locale === "ar" ? "ابحث عن عمل..." : "Search works..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            dir={locale === "ar" ? "rtl" : "ltr"}
          />
          {searchQuery && (
            <button className="pt-search-clear" onClick={() => setSearchQuery("")} aria-label="Clear">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 1l10 10M11 1L1 11" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="pt-toolbar container">
        {/* Categories */}
        <div className="pt-cats">
          <button
            className={`pt-cat ${activeCategory === "all" ? "pt-cat--active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            {t("all")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`pt-cat ${activeCategory === cat.id ? "pt-cat--active" : ""}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {locale === "ar" ? cat.nameAr : cat.nameEn}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="pt-controls">
          {/* Info toggle */}
          <button
            className={`pt-btn ${showInfo ? "pt-btn--active" : ""}`}
            onClick={() => setShowInfo((v) => !v)}
            title={locale === "ar" ? "إظهار المعلومات" : "Show info"}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              <circle cx="7.5" cy="7.5" r="6.5" />
              <path d="M7.5 6.5v4M7.5 4.5h.01" />
            </svg>
          </button>

          {/* Layout switcher */}
          {availableLayouts.length > 1 && (
            <div className="pt-layouts">
              {availableLayouts.includes("grid") && (
                <button
                  className={`pt-layout-btn ${layout === "grid" ? "pt-layout-btn--active" : ""}`}
                  onClick={() => setLayout("grid")}
                  title="Grid"
                >
                  <IconGrid />
                </button>
              )}
              {availableLayouts.includes("masonry") && (
                <button
                  className={`pt-layout-btn ${layout === "masonry" ? "pt-layout-btn--active" : ""}`}
                  onClick={() => setLayout("masonry")}
                  title="Masonry"
                >
                  <IconMasonry />
                </button>
              )}
              {availableLayouts.includes("scattered") && (
                <button
                  className={`pt-layout-btn ${layout === "scattered" ? "pt-layout-btn--active" : ""}`}
                  onClick={() => setLayout("scattered")}
                  title="Scattered"
                >
                  <IconScattered />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="pt-grid-wrap container">
        {filtered.length === 0 ? (
          <p className="pt-empty">{t("noWorks")}</p>
        ) : layout === "grid" ? (
          <GridLayout works={filtered} locale={locale} showInfo={showInfo} />
        ) : layout === "masonry" ? (
          <MasonryLayout works={filtered} locale={locale} showInfo={showInfo} />
        ) : (
          <ScatteredLayout works={filtered} locale={locale} showInfo={showInfo} />
        )}
      </div>

      {/* ── Styles ── */}
      <style>{`
        /* ── Toolbar ── */
        .pt-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding-block: 1.5rem 1.25rem;
          flex-wrap: wrap;
        }

        .pt-cats {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }

        .pt-cat {
          padding: 0.35rem 0.875rem;
          font-size: 0.8rem;
          color: var(--text-muted);
          background: transparent;
          border: 1px solid transparent;
          border-radius: 999px;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .pt-cat:hover { color: var(--text-primary); border-color: var(--border); }
        .pt-cat--active {
          color: var(--text-primary);
          background: var(--bg-secondary);
          border-color: var(--border);
          font-weight: 500;
        }

        .pt-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .pt-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: transparent;
          cursor: pointer;
          color: var(--text-muted);
          transition: all var(--transition-fast);
        }

        .pt-btn:hover, .pt-btn--active {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .pt-layouts {
          display: flex;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .pt-layout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          background: transparent;
          border: none;
          border-inline-end: 1px solid var(--border);
          cursor: pointer;
          color: var(--text-muted);
          transition: all var(--transition-fast);
        }

        .pt-layout-btn:last-child { border-inline-end: none; }
        .pt-layout-btn:hover, .pt-layout-btn--active {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        /* ── Grid wrap ── */
        .pt-grid-wrap { padding-bottom: 5rem; }
        .pt-empty { text-align: center; color: var(--text-muted); padding: 4rem 0; }

        /* ── Shared card ── */
        .wc {
          position: relative;
          cursor: pointer;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--bg-secondary);
        }

        .wc-shimmer {
          position: absolute;
          inset: 0;
          z-index: 2;
          background: linear-gradient(90deg, var(--bg-secondary) 0%, var(--bg-tertiary) 50%, var(--bg-secondary) 100%);
          background-size: 200% 100%;
          animation: wc-shimmer 1.6s infinite;
          transition: opacity 0.4s;
        }

        .wc-shimmer--done { opacity: 0; pointer-events: none; }

        @keyframes wc-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .wc-img-wrap {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .wc-img {
          object-fit: cover;
          transition: transform 600ms ease, opacity 0.45s;
          opacity: 0;
        }

        .wc-img--loaded { opacity: 1; }
        .wc:hover .wc-img { transform: scale(1.04); }

        .wc-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.68) 0%, transparent 55%);
          opacity: 0;
          transition: opacity var(--transition-base);
          z-index: 3;
        }

        .wc-info {
          position: absolute;
          bottom: 0;
          inset-inline: 0;
          padding: 0.875rem 1rem;
          z-index: 4;
          transform: translateY(6px);
          opacity: 0;
          transition: transform var(--transition-base), opacity var(--transition-base);
        }

        .wc:hover .wc-overlay,
        .wc--info .wc-overlay { opacity: 1; }

        .wc:hover .wc-info,
        .wc--info .wc-info { transform: translateY(0); opacity: 1; }

        .wc-code {
          display: block;
          font-size: 0.63rem;
          color: rgba(255,255,255,0.52);
          letter-spacing: 0.07em;
          margin-bottom: 0.1rem;
        }

        .wc-title {
          display: block;
          font-size: 0.875rem;
          color: #fff;
          font-weight: 400;
          line-height: 1.3;
        }

        .wc-location {
          display: block;
          font-size: 0.72rem;
          color: rgba(255,255,255,0.6);
          margin-top: 0.2rem;
        }

        /* ── Grid layout ── */
        .pt-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.625rem;
        }

        @media (max-width: 768px) { .pt-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .pt-grid { grid-template-columns: 1fr; } }

        .pt-grid .wc {
          padding-bottom: 75%;
        }

        /* ── Masonry layout ── */
        .pt-masonry {
          columns: 3;
          column-gap: 0.625rem;
        }

        @media (max-width: 768px) { .pt-masonry { columns: 2; } }
        @media (max-width: 480px) { .pt-masonry { columns: 1; } }

        .pt-masonry-item {
          break-inside: avoid;
          margin-bottom: 0.625rem;
        }

        .pt-masonry .wc {
          padding-bottom: var(--aspect, 66%);
        }

        /* ── Scattered layout ── */
        .pt-scattered {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          grid-auto-rows: 180px;
          gap: 0.625rem;
        }

        @media (max-width: 1200px) {
          .pt-scattered {
            grid-template-columns: repeat(4, 1fr);
            grid-auto-rows: 160px;
          }
        }

        @media (max-width: 640px) {
          .pt-scattered {
            grid-template-columns: repeat(2, 1fr);
            grid-auto-rows: 200px;
          }
        }

        .pt-scattered .wc {
          position: absolute;
          inset: 0;
        }

        .pt-scattered .wc-wrapper {
          position: relative;
        }

        /* ── Search ── */
        .pt-search-wrap {
          padding-top: 2rem;
          padding-bottom: 0;
        }

        .pt-search {
          position: relative;
          display: flex;
          align-items: center;
          max-width: 380px;
        }

        .pt-search-icon {
          position: absolute;
          inset-inline-start: 0.75rem;
          color: var(--text-muted);
          pointer-events: none;
          flex-shrink: 0;
        }

        .pt-search-input {
          width: 100%;
          padding: 0.55rem 2.25rem;
          font-size: 0.85rem;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          outline: none;
          transition: border-color var(--transition-fast);
        }

        .pt-search-input::placeholder { color: var(--text-subtle); }
        .pt-search-input:focus { border-color: var(--text-muted); }

        .pt-search-clear {
          position: absolute;
          inset-inline-end: 0.65rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          padding: 0;
          transition: color var(--transition-fast);
        }
        .pt-search-clear:hover { color: var(--text-primary); }

        /* ── Card button ── */
        .wc-link {
          display: block;
          position: absolute;
          inset: 0;
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
        }


      `}</style>
    </>
  );
}

// ── Sub-layout components ─────────────────────────────────────────────────────

interface SubLayoutProps {
  works: Work[];
  locale: string;
  showInfo: boolean;
}

function GridLayout({ works, locale, showInfo }: SubLayoutProps) {
  return (
    <div className="pt-grid">
      <AnimatePresence mode="popLayout">
        {works.map((w, i) => (
          <WorkCard key={w.id} work={w} locale={locale} showInfo={showInfo} index={i} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function MasonryLayout({ works, locale, showInfo }: SubLayoutProps) {
  return (
    <div className="pt-masonry">
      <AnimatePresence>
        {works.map((w, i) => {
          const pct = (w.height / w.width) * 100;
          return (
            <div key={w.id} className="pt-masonry-item">
              <WorkCard
                work={w} locale={locale} showInfo={showInfo} index={i}
                style={{ "--aspect": `${pct}%` } as React.CSSProperties}
              />
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function ScatteredLayout({ works, locale, showInfo }: SubLayoutProps) {
  return (
    <div className="pt-scattered">
      <AnimatePresence mode="popLayout">
        {works.map((w, i) => {
          const p = PATTERN[i % PATTERN.length];
          return (
            <WorkCard
              key={w.id} work={w} locale={locale} showInfo={showInfo} index={i}
              style={{ gridColumn: `span ${p.col}`, gridRow: `span ${p.row}`, position: "relative" }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}
