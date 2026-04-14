// Server Component — fetches related blog posts directly from the DB.
import Link from "next/link";
import { db } from "@/lib/db";

interface RelatedPostsProps {
  currentSlug: string;
  locale: "ar" | "en";
}

export default async function RelatedPosts({ currentSlug, locale }: RelatedPostsProps) {
  let posts: {
    id: string;
    slug: string;
    titleAr: string;
    titleEn: string;
    coverImage: string | null;
    publishedAt: Date | null;
  }[] = [];

  try {
    posts = await db.blogPost.findMany({
      where: {
        status: "published",
        slug: { not: currentSlug },
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: {
        id: true,
        slug: true,
        titleAr: true,
        titleEn: true,
        coverImage: true,
        publishedAt: true,
      },
    });
  } catch {
    // Silently return nothing if DB is unavailable
    return null;
  }

  if (!posts.length) return null;

  const heading  = locale === "ar" ? "تدوينات أخرى" : "More Posts";
  const dir      = locale === "ar" ? ("rtl" as const) : ("ltr" as const);

  return (
    <section className="rp-section" dir={dir} aria-label={heading}>
      <h2 className="rp-heading">{heading}</h2>

      <div className="rp-grid">
        {posts.map((post) => {
          const title = locale === "ar" ? post.titleAr : (post.titleEn ?? post.titleAr);
          const date  = post.publishedAt
            ? new Intl.DateTimeFormat(locale === "ar" ? "ar-u-ca-gregory-nu-latn" : "en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }).format(new Date(post.publishedAt))
            : null;

          return (
            <Link key={post.id} href={`/${locale}/blog/${post.slug}`} className="rp-card">
              {/* Thumbnail */}
              <div className="rp-thumb">
                {post.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverImage}
                    alt={title ?? ""}
                    className="rp-thumb-img"
                    loading="lazy"
                  />
                ) : (
                  <div className="rp-thumb-placeholder" aria-hidden="true" />
                )}
              </div>

              {/* Meta */}
              <div className="rp-meta">
                <p className="rp-title">{title}</p>
                {date && <time className="rp-date">{date}</time>}
              </div>
            </Link>
          );
        })}
      </div>

      <style>{`
        .rp-section {
          margin-top: 5rem;
          padding-top: 2.5rem;
          border-top: 1px solid var(--border-subtle, rgba(0,0,0,0.07));
        }

        .rp-heading {
          font-family: var(--font-heading);
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-subtle, #aaa);
          margin-bottom: 1.75rem;
        }

        .rp-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }

        @media (max-width: 640px) {
          .rp-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
        }

        @media (min-width: 641px) and (max-width: 900px) {
          .rp-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .rp-card {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          text-decoration: none;
          color: inherit;
          transition: opacity 200ms ease;
        }

        .rp-card:hover { opacity: 0.75; }

        .rp-thumb {
          aspect-ratio: 3/2;
          border-radius: var(--radius-md, 8px);
          overflow: hidden;
          background: var(--bg-secondary, #f5f5f5);
          flex-shrink: 0;
        }

        .rp-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 450ms ease;
        }

        .rp-card:hover .rp-thumb-img { transform: scale(1.04); }

        .rp-thumb-placeholder {
          width: 100%;
          height: 100%;
          background: var(--bg-tertiary, #ebebeb);
        }

        .rp-meta {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .rp-title {
          font-size: 0.875rem;
          color: var(--text-primary, #111);
          line-height: 1.4;
          font-weight: 400;
          margin: 0;
        }

        .rp-date {
          font-size: 0.72rem;
          color: var(--text-subtle, #aaa);
          display: block;
        }
      `}</style>
    </section>
  );
}
