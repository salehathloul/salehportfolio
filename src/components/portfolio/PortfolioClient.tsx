"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";

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
  captionAr?: string | null;
  captionEn?: string | null;
  imageUrl: string;
  width: number;
  height: number;
  categoryId: string | null;
}

interface Project {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  coverImage: string;
  _count: { images: number };
}

interface Props {
  works: Work[];
  categories: Category[];
  projects: Project[];
  availableLayouts: GridLayout[];
  defaultLayout: GridLayout;
}

// ── Filter — fully dynamic (no hardcoded slugs) ───────────────────────────────
// activeFilter values:
//   "all"      → كل الأعمال + كل المشاريع
//   "projects" → فقط المشاريع (بدون أعمال)
//   <categoryId> → أعمال من هذا التصنيف فقط (بدون مشاريع)

// ── Scattered pattern ─────────────────────────────────────────────────────────

const PATTERN: { col: number; row: number }[] = [
  { col: 2, row: 2 },  // كبير
  { col: 1, row: 1 },  // صغير
  { col: 1, row: 1 },  // صغير
  { col: 1, row: 2 },  // طويل
  { col: 2, row: 1 },  // عريض
  { col: 1, row: 1 },  // صغير
  { col: 2, row: 1 },  // عريض
  { col: 1, row: 2 },  // طويل
  { col: 1, row: 1 },  // صغير
  { col: 2, row: 2 },  // كبير
  { col: 1, row: 1 },  // صغير
  { col: 1, row: 1 },  // صغير
];

// ── Card animation ────────────────────────────────────────────────────────────

const cardAnim = {
  hidden: { opacity: 0, scale: 0.97, y: 12 },
  show: (i: number) => ({
    opacity: 1, scale: 1, y: 0,
    transition: { duration: 0.5, delay: Math.min(i * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
};

// ── Icons ─────────────────────────────────────────────────────────────────────

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

function IconSeries() {
  return (
    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="9" height="9" rx="1.5" />
      <path d="M1 5v6a2 2 0 002 2h6" opacity="0.6" />
    </svg>
  );
}

// ── WorkCard ──────────────────────────────────────────────────────────────────

interface WorkCardProps {
  work: Work; locale: string; showInfo: boolean; index: number;
  style?: React.CSSProperties; className?: string;
}

function WorkCard({ work, locale, showInfo, index, style, className = "" }: WorkCardProps) {
  const [loaded, setLoaded] = useState(false);
  const title    = locale === "ar" ? work.titleAr    : work.titleEn;
  const location = locale === "ar" ? work.locationAr : work.locationEn;
  const caption  = locale === "ar" ? work.captionAr  : work.captionEn;

  return (
    <motion.div custom={index} variants={cardAnim} initial="hidden" animate="show" exit="exit"
      className={`wc ${showInfo ? "wc--info" : ""} ${className}`} style={style} layout>
      <Link href={`/${locale}/portfolio/${work.code}`} className="wc-link" tabIndex={0} aria-label={title}>
        <div className={`wc-shimmer ${loaded ? "wc-shimmer--done" : ""}`} />
        <div className="wc-img-wrap">
          <Image src={work.imageUrl} alt={title} fill
            className={`wc-img ${loaded ? "wc-img--loaded" : ""}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy" onLoad={() => setLoaded(true)} />
        </div>
        <div className="wc-overlay" />
        <div className="wc-info">
          <span className="wc-code">{work.code}</span>
          <span className="wc-title">{title}</span>
          {location && <span className="wc-location">{location}</span>}
          {caption  && <span className="wc-caption">{caption}</span>}
        </div>
      </Link>
    </motion.div>
  );
}

// ── ProjectCard ───────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project; locale: string; showInfo: boolean; index: number;
  style?: React.CSSProperties; className?: string;
}

function ProjectCard({ project, locale, showInfo, index, style, className = "" }: ProjectCardProps) {
  const [loaded, setLoaded] = useState(false);
  const title = locale === "ar" ? project.titleAr : project.titleEn;
  const count = project._count.images;
  const countLabel = locale === "ar"
    ? `${count} ${count === 2 ? "صورتان" : count < 11 ? "صور" : "صورة"}`
    : `${count} photo${count !== 1 ? "s" : ""}`;

  return (
    <motion.div custom={index} variants={cardAnim} initial="hidden" animate="show" exit="exit"
      className={`wc wc--project ${showInfo ? "wc--info" : ""} ${className}`} style={style} layout>
      <Link href={`/${locale}/portfolio/project/${project.slug}`} className="wc-link" tabIndex={0} aria-label={title}>
        <div className={`wc-shimmer ${loaded ? "wc-shimmer--done" : ""}`} />
        <div className="wc-img-wrap">
          <Image src={project.coverImage} alt={title} fill
            className={`wc-img ${loaded ? "wc-img--loaded" : ""}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy" onLoad={() => setLoaded(true)} />
        </div>
        {/* Series badge — always visible */}
        <div className="wc-series-badge">
          <IconSeries />
          <span>{countLabel}</span>
        </div>
        <div className="wc-overlay" />
        <div className="wc-info">
          <span className="wc-project-label">{locale === "ar" ? "مشروع" : "Project"}</span>
          <span className="wc-title">{title}</span>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Mixed item helper ─────────────────────────────────────────────────────────

type MixedItem =
  | { kind: "work"; work: Work }
  | { kind: "project"; project: Project };

function buildMixed(works: Work[], projects: Project[]): MixedItem[] {
  if (projects.length === 0) return works.map((w) => ({ kind: "work", work: w }));
  // إذا لم تكن هناك أعمال → أرجع المشاريع فقط (يمنع الحلقة اللانهائية)
  if (works.length === 0) return projects.map((p) => ({ kind: "project", project: p }));
  const result: MixedItem[] = [];
  let wi = 0, pi = 0;
  const interval = Math.max(3, Math.floor(works.length / Math.max(projects.length, 1)));
  while (wi < works.length || pi < projects.length) {
    if (pi < projects.length && wi > 0 && wi % interval === 0)
      result.push({ kind: "project", project: projects[pi++] });
    if (wi < works.length) result.push({ kind: "work", work: works[wi++] });
    else if (pi < projects.length) result.push({ kind: "project", project: projects[pi++] });
  }
  return result;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PortfolioClient({ works, categories, projects, availableLayouts, defaultLayout }: Props) {
  const locale = useLocale();
  const isAr   = locale === "ar";
  // Fallback: if defaultLayout is no longer available, use the first available
  const [layout, setLayout] = useState<GridLayout>(
    () => availableLayouts.includes(defaultLayout) ? defaultLayout : (availableLayouts[0] ?? "masonry")
  );
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showInfo, setShowInfo]         = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");

  const matchesSearch = (titleAr: string, titleEn: string, locAr?: string | null, locEn?: string | null) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return titleAr.toLowerCase().includes(q) || titleEn.toLowerCase().includes(q) ||
           (locAr ?? "").toLowerCase().includes(q) || (locEn ?? "").toLowerCase().includes(q);
  };

  const filteredWorks = works
    .filter((w) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "projects") return false;
      return w.categoryId === activeFilter;
    })
    .filter((w) => matchesSearch(w.titleAr, w.titleEn, w.locationAr, w.locationEn));

  const filteredProjects = (activeFilter === "all" || activeFilter === "projects")
    ? projects.filter((p) => matchesSearch(p.titleAr, p.titleEn))
    : [];

  const isEmpty = filteredWorks.length === 0 && filteredProjects.length === 0;

  return (
    <>
      {/* Search */}
      <div className="pt-search-wrap container">
        <div className="pt-search">
          <svg className="pt-search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="4.5" /><path d="M10 10l3 3" />
          </svg>
          <input type="search" className="pt-search-input"
            placeholder={locale === "ar" ? "ابحث عن عمل..." : "Search works..."}
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            dir={locale === "ar" ? "rtl" : "ltr"} />
          {searchQuery && (
            <button className="pt-search-clear" onClick={() => setSearchQuery("")} aria-label="Clear">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 1l10 10M11 1L1 11" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="pt-toolbar container">
        <div className="pt-cats">
          {/* الكل */}
          <button
            className={`pt-cat ${activeFilter === "all" ? "pt-cat--active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            {isAr ? "الكل" : "All"}
          </button>

          {/* تصنيفات ديناميكية من قاعدة البيانات */}
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`pt-cat ${activeFilter === cat.id ? "pt-cat--active" : ""}`}
              onClick={() => setActiveFilter(cat.id)}
            >
              {isAr ? cat.nameAr : cat.nameEn}
            </button>
          ))}

          {/* مشاريع فوتوغرافية — يظهر فقط إذا وجدت مشاريع */}
          {projects.length > 0 && (
            <button
              className={`pt-cat ${activeFilter === "projects" ? "pt-cat--active" : ""}`}
              onClick={() => setActiveFilter("projects")}
            >
              {isAr ? "مشاريع فوتوغرافية" : "Photo Series"}
            </button>
          )}
        </div>

        <div className="pt-controls">
          <button className={`pt-btn ${showInfo ? "pt-btn--active" : ""}`}
            onClick={() => setShowInfo((v) => !v)}
            title={locale === "ar" ? "إظهار المعلومات" : "Show info"}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              <circle cx="7.5" cy="7.5" r="6.5" /><path d="M7.5 6.5v4M7.5 4.5h.01" />
            </svg>
          </button>

          {availableLayouts.length > 1 && (
            <div className="pt-layouts">
              {availableLayouts.includes("grid")      && <button className={`pt-layout-btn ${layout === "grid"      ? "pt-layout-btn--active" : ""}`} onClick={() => setLayout("grid")}      title="Grid"><IconGrid /></button>}
              {availableLayouts.includes("masonry")   && <button className={`pt-layout-btn ${layout === "masonry"   ? "pt-layout-btn--active" : ""}`} onClick={() => setLayout("masonry")}   title="Masonry"><IconMasonry /></button>}
              {availableLayouts.includes("scattered") && <button className={`pt-layout-btn ${layout === "scattered" ? "pt-layout-btn--active" : ""}`} onClick={() => setLayout("scattered")} title="Scattered"><IconScattered /></button>}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="pt-grid-wrap container">
        {isEmpty ? (
          <p className="pt-empty">{locale === "ar" ? "لا توجد أعمال" : "No works found"}</p>
        ) : layout === "grid" ? (
          <GridLayout works={filteredWorks} projects={filteredProjects} locale={locale} showInfo={showInfo} />
        ) : layout === "masonry" ? (
          <MasonryLayout works={filteredWorks} projects={filteredProjects} locale={locale} showInfo={showInfo} />
        ) : (
          <ScatteredLayout works={filteredWorks} projects={filteredProjects} locale={locale} showInfo={showInfo} />
        )}
      </div>

      <style>{`
        .pt-toolbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding-block:1.5rem 1.25rem; flex-wrap:wrap; }
        .pt-cats { display:flex; flex-wrap:wrap; gap:0.375rem; }
        .pt-cat { padding:0.35rem 0.875rem; font-size:0.8rem; color:var(--text-muted); background:transparent; border:1px solid transparent; border-radius:999px; cursor:pointer; transition:all var(--transition-fast); white-space:nowrap; }
        .pt-cat:hover { color:var(--text-primary); border-color:var(--border); }
        .pt-cat--active { color:var(--text-primary); background:var(--bg-secondary); border-color:var(--border); font-weight:500; }
        .pt-controls { display:flex; align-items:center; gap:0.5rem; flex-shrink:0; }
        .pt-btn { display:flex; align-items:center; justify-content:center; width:34px; height:34px; border:1px solid var(--border); border-radius:var(--radius-md); background:transparent; cursor:pointer; color:var(--text-muted); transition:all var(--transition-fast); }
        .pt-btn:hover, .pt-btn--active { background:var(--bg-secondary); color:var(--text-primary); }
        .pt-layouts { display:flex; border:1px solid var(--border); border-radius:var(--radius-md); overflow:hidden; }
        .pt-layout-btn { display:flex; align-items:center; justify-content:center; width:34px; height:34px; background:transparent; border:none; border-inline-end:1px solid var(--border); cursor:pointer; color:var(--text-muted); transition:all var(--transition-fast); }
        .pt-layout-btn:last-child { border-inline-end:none; }
        .pt-layout-btn:hover, .pt-layout-btn--active { background:var(--bg-secondary); color:var(--text-primary); }
        .pt-grid-wrap { padding-bottom:5rem; }
        .pt-empty { text-align:center; color:var(--text-muted); padding:4rem 0; }

        /* Card */
        .wc { position:relative; cursor:pointer; border-radius:var(--radius-md); overflow:hidden; background:var(--bg-secondary); }
        .wc-shimmer { position:absolute; inset:0; z-index:2; background:linear-gradient(90deg,var(--bg-secondary) 0%,var(--bg-tertiary) 50%,var(--bg-secondary) 100%); background-size:200% 100%; animation:wc-shimmer 1.6s infinite; transition:opacity 0.4s; }
        .wc-shimmer--done { opacity:0; pointer-events:none; }
        @keyframes wc-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .wc-img-wrap { position:absolute; inset:0; overflow:hidden; }
        .wc-img { object-fit:cover; transition:transform 600ms ease,opacity 0.45s; opacity:0; }
        .wc-img--loaded { opacity:1; }
        .wc:hover .wc-img { transform:scale(1.04); }
        .wc-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.68) 0%,transparent 55%); opacity:0; transition:opacity var(--transition-base); z-index:3; }
        .wc-info { position:absolute; bottom:0; inset-inline:0; padding:0.875rem 1rem; z-index:4; transform:translateY(6px); opacity:0; transition:transform var(--transition-base),opacity var(--transition-base); }
        .wc:hover .wc-overlay, .wc--info .wc-overlay { opacity:1; }
        .wc:hover .wc-info, .wc--info .wc-info { transform:translateY(0); opacity:1; }
        .wc-code { display:block; font-size:0.63rem; color:rgba(255,255,255,0.52); letter-spacing:0.07em; margin-bottom:0.1rem; }
        .wc-title { display:block; font-size:0.875rem; color:#fff; font-weight:400; line-height:1.3; }
        .wc-location { display:block; font-size:0.72rem; color:rgba(255,255,255,0.6); margin-top:0.2rem; }
        .wc-caption { display:block; font-size:0.72rem; color:rgba(255,255,255,0.5); margin-top:0.3rem; font-style:italic; line-height:1.4; }

        /* Project badge */
        .wc-series-badge { position:absolute; top:0.75rem; inset-inline-end:0.75rem; z-index:5; display:flex; align-items:center; gap:0.3rem; padding:0.25rem 0.6rem; background:rgba(0,0,0,0.5); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px); border:1px solid rgba(255,255,255,0.15); border-radius:999px; color:rgba(255,255,255,0.88); font-size:0.65rem; letter-spacing:0.04em; white-space:nowrap; pointer-events:none; }
        .wc-project-label { display:block; font-size:0.6rem; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.5); margin-bottom:0.15rem; }

        /* Grid */
        .pt-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:0.625rem; }
        @media(max-width:768px){.pt-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:480px){.pt-grid{grid-template-columns:1fr}}
        .pt-grid .wc { padding-bottom:75%; }

        /* Masonry */
        .pt-masonry { columns:3; column-gap:12px; }
        @media(max-width:768px){.pt-masonry{columns:2}}
        @media(max-width:480px){.pt-masonry{columns:1}}
        .pt-masonry-item { break-inside:avoid; margin-bottom:12px; }
        .pt-masonry .wc { padding-bottom:var(--aspect,66%); }

        /* Scattered */
        .pt-scattered { display:grid; grid-template-columns:repeat(3,1fr); grid-auto-rows:260px; gap:12px; grid-auto-flow:dense; }
        @media(max-width:768px){.pt-scattered{grid-template-columns:repeat(2,1fr);grid-auto-rows:220px}}
        @media(max-width:480px){.pt-scattered>*{grid-column:span 1 !important;grid-row:span 1 !important}}
        /* Cards in scattered must fill their grid cell (no padding-bottom trick here) */
        .pt-scattered .wc { height:100%; }

        /* Search */
        .pt-search-wrap { padding-top:2rem; padding-bottom:0; }
        .pt-search { position:relative; display:flex; align-items:center; max-width:380px; }
        .pt-search-icon { position:absolute; inset-inline-start:0.75rem; color:var(--text-muted); pointer-events:none; flex-shrink:0; }
        .pt-search-input { width:100%; padding:0.55rem 2.25rem; font-size:0.85rem; background:transparent; border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text-primary); outline:none; transition:border-color var(--transition-fast); }
        .pt-search-input::placeholder { color:var(--text-subtle); }
        .pt-search-input:focus { border-color:var(--text-muted); }
        .pt-search-clear { position:absolute; inset-inline-end:0.65rem; display:flex; align-items:center; justify-content:center; width:18px; height:18px; background:transparent; border:none; cursor:pointer; color:var(--text-muted); padding:0; transition:color var(--transition-fast); }
        .pt-search-clear:hover { color:var(--text-primary); }
        .wc-link { display:block; position:absolute; inset:0; background:transparent; border:none; padding:0; cursor:pointer; text-decoration:none; color:inherit; }
      `}</style>
    </>
  );
}

// ── Sub-layouts ───────────────────────────────────────────────────────────────

interface SubLayoutProps { works: Work[]; projects: Project[]; locale: string; showInfo: boolean; }

function GridLayout({ works, projects, locale, showInfo }: SubLayoutProps) {
  const items = buildMixed(works, projects);
  return (
    <div className="pt-grid">
      <AnimatePresence mode="popLayout">
        {items.map((item, i) =>
          item.kind === "work"
            ? <WorkCard key={`w-${item.work.id}`} work={item.work} locale={locale} showInfo={showInfo} index={i} />
            : <ProjectCard key={`p-${item.project.id}`} project={item.project} locale={locale} showInfo={showInfo} index={i} />
        )}
      </AnimatePresence>
    </div>
  );
}

function MasonryLayout({ works, projects, locale, showInfo }: SubLayoutProps) {
  const items = buildMixed(works, projects);
  return (
    <div className="pt-masonry">
      <AnimatePresence>
        {items.map((item, i) => {
          if (item.kind === "work") {
            const pct = (item.work.height / item.work.width) * 100;
            return (
              <div key={`w-${item.work.id}`} className="pt-masonry-item">
                <WorkCard work={item.work} locale={locale} showInfo={showInfo} index={i} style={{ "--aspect": `${pct}%` } as React.CSSProperties} />
              </div>
            );
          }
          return (
            <div key={`p-${item.project.id}`} className="pt-masonry-item">
              <ProjectCard project={item.project} locale={locale} showInfo={showInfo} index={i} style={{ "--aspect": "75%" } as React.CSSProperties} />
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function ScatteredLayout({ works, projects, locale, showInfo }: SubLayoutProps) {
  const items = buildMixed(works, projects);
  return (
    <div className="pt-scattered">
      <AnimatePresence mode="popLayout">
        {items.map((item, i) => {
          const p = PATTERN[i % PATTERN.length];
          const style: React.CSSProperties = { gridColumn: `span ${p.col}`, gridRow: `span ${p.row}`, position: "relative" };
          return item.kind === "work"
            ? <WorkCard key={`w-${item.work.id}`} work={item.work} locale={locale} showInfo={showInfo} index={i} style={style} />
            : <ProjectCard key={`p-${item.project.id}`} project={item.project} locale={locale} showInfo={showInfo} index={i} style={style} />;
        })}
      </AnimatePresence>
    </div>
  );
}
