export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import ProjectPageClient from "@/components/portfolio/ProjectPageClient";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

async function getProject(slug: string) {
  try {
    return await db.project.findFirst({
      where: { slug, isPublished: true },
      include: { images: { orderBy: { order: "asc" } } },
    });
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};
  const title = locale === "ar" ? project.titleAr : project.titleEn;
  const desc  = locale === "ar" ? project.descriptionAr : project.descriptionEn;
  return {
    title,
    description: desc ?? undefined,
    openGraph: { images: [{ url: project.coverImage }] },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const locale   = await getLocale();

  const project = await getProject(slug);
  if (!project) notFound();

  const title = locale === "ar" ? project.titleAr : project.titleEn;
  const desc  = locale === "ar" ? project.descriptionAr : project.descriptionEn;
  const dir   = locale === "ar" ? "rtl" : "ltr";

  return (
    <>
      <article className="proj-article">
        <div className="proj-inner container">

          {/* ── Back ── */}
          <Link href={`/${locale}/portfolio`} className="proj-back" dir={dir}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {locale === "ar" ? <path d="M5 2l4 5-4 5" /> : <path d="M9 2L5 7l4 5" />}
            </svg>
            {locale === "ar" ? "المعرض" : "Portfolio"}
          </Link>

          {/* ── Header ── */}
          <header className="proj-header" dir={dir}>
            <p className="proj-eyebrow">
              {locale === "ar" ? "مشروع فوتوغرافي" : "Photography Project"}
              <span className="proj-count">
                {project.images.length} {locale === "ar" ? "صورة" : "photos"}
              </span>
            </p>
            <h1 className="proj-title">{title}</h1>

            {desc && (
              <p className="proj-description">{desc}</p>
            )}

            <div className="proj-divider" />
          </header>

          {/* ── Images — stacked photo book ── */}
          <ProjectPageClient
            images={project.images.map(img => ({
              id: img.id,
              url: img.url,
              captionAr: img.captionAr,
              captionEn: img.captionEn,
              width: img.width,
              height: img.height,
            }))}
            locale={locale as "ar" | "en"}
          />

        </div>
      </article>

      <style>{`
        .proj-article {
          padding-bottom: 8rem;
        }

        .proj-inner {
          max-width: 860px;
          margin-inline: auto;
          padding-top: 2.5rem;
        }

        /* Back link */
        .proj-back {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          color: var(--text-muted);
          text-decoration: none;
          margin-bottom: 2.5rem;
          transition: color var(--transition-fast);
        }
        .proj-back:hover { color: var(--text-primary); }

        /* Header */
        .proj-header {
          margin-bottom: 3rem;
        }

        .proj-eyebrow {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.72rem;
          color: var(--text-subtle);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 0.875rem;
        }

        .proj-count {
          color: var(--text-muted);
          font-size: 0.7rem;
          padding: 0.15rem 0.6rem;
          border: 1px solid var(--border);
          border-radius: 999px;
          letter-spacing: 0.03em;
          text-transform: none;
        }

        .proj-title {
          font-family: var(--font-heading);
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 300;
          color: var(--text-primary);
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin-bottom: 1.5rem;
        }

        .proj-description {
          font-size: 1rem;
          line-height: 1.9;
          color: var(--text-secondary);
          max-width: 620px;
          margin-bottom: 0;
        }

        .proj-divider {
          width: 3rem;
          height: 1px;
          background: var(--border);
          margin-top: 2rem;
        }
      `}</style>
    </>
  );
}
