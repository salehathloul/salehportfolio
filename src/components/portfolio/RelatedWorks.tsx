import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";

interface Props {
  currentCode: string;
  categoryId: string | null;
  locale: string;
}

export default async function RelatedWorks({ currentCode, categoryId, locale }: Props) {
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  let works: { id: string; code: string; titleAr: string; titleEn: string; imageUrl: string; width: number; height: number }[] = [];

  try {
    // Try to get works from same category first, fallback to latest
    if (categoryId) {
      works = await db.work.findMany({
        where: { categoryId, isPublished: true, code: { not: currentCode } },
        select: { id: true, code: true, titleAr: true, titleEn: true, imageUrl: true, width: true, height: true },
        orderBy: { order: "asc" },
        take: 4,
      });
    }
    if (works.length < 4) {
      const existing = works.map((w) => w.code);
      const more = await db.work.findMany({
        where: { isPublished: true, code: { not: currentCode, notIn: existing } },
        select: { id: true, code: true, titleAr: true, titleEn: true, imageUrl: true, width: true, height: true },
        orderBy: { isFeatured: "desc" },
        take: 4 - works.length,
      });
      works = [...works, ...more];
    }
  } catch {
    return null;
  }

  if (works.length === 0) return null;

  const heading = isAr ? "أعمال أخرى" : "More Works";

  return (
    <section className="rw-section" dir={dir}>
      <div className="rw-header">
        <h2 className="rw-title">{heading}</h2>
        <Link href={`/${locale}/portfolio`} className="rw-all-link">
          {isAr ? "عرض الكل ←" : "View all →"}
        </Link>
      </div>

      <div className="rw-grid">
        {works.map((work) => {
          const title = isAr ? work.titleAr : work.titleEn;
          return (
            <Link key={work.id} href={`/${locale}/portfolio/${work.code}`} className="rw-item">
              <div className="rw-img-wrap">
                <Image
                  src={work.imageUrl}
                  alt={title}
                  fill
                  className="rw-img"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
              </div>
              <div className="rw-info">
                <span className="rw-name">{title}</span>
                <span className="rw-code">{work.code}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <style>{`
        .rw-section {
          padding-top: 3rem;
          margin-top: 3rem;
          border-top: 1px solid var(--border-subtle);
          padding-bottom: 2rem;
        }

        .rw-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .rw-title {
          font-family: var(--font-heading);
          font-size: 0.75rem;
          font-weight: 400;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin: 0;
        }

        .rw-all-link {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 150ms;
        }
        .rw-all-link:hover { color: var(--text-primary); }

        .rw-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
        }

        @media (max-width: 768px) {
          .rw-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .rw-item {
          display: block;
          text-decoration: none;
          group: true;
        }

        .rw-img-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          border-radius: var(--radius-sm);
          background: var(--bg-secondary);
        }

        .rw-img {
          object-fit: cover;
          transition: transform 500ms ease;
        }
        .rw-item:hover .rw-img { transform: scale(1.04); }

        .rw-info {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 0.5rem;
          padding: 0.5rem 0 0;
        }

        .rw-name {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 150ms;
        }
        .rw-item:hover .rw-name { color: var(--text-primary); }

        .rw-code {
          font-size: 0.68rem;
          color: var(--text-subtle);
          letter-spacing: 0.06em;
          flex-shrink: 0;
        }
      `}</style>
    </section>
  );
}
