export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;
  const title =
    locale === "ar"
      ? q ? `نتائج البحث عن "${q}"` : "بحث"
      : q ? `Search results for "${q}"` : "Search";
  return { title };
}

interface WorkResult {
  code: string;
  titleAr: string;
  titleEn: string;
  imageUrl: string;
  locationAr: string | null;
  locationEn: string | null;
}

interface PostResult {
  slug: string;
  titleAr: string;
  titleEn: string;
  coverImage: string | null;
}

async function search(
  q: string
): Promise<{ works: WorkResult[]; posts: PostResult[] }> {
  if (q.length < 2) return { works: [], posts: [] };

  const [works, posts] = await Promise.all([
    db.work.findMany({
      where: {
        isPublished: true,
        OR: [
          { titleAr: { contains: q, mode: "insensitive" } },
          { titleEn: { contains: q, mode: "insensitive" } },
          { locationAr: { contains: q, mode: "insensitive" } },
          { locationEn: { contains: q, mode: "insensitive" } },
          { code: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        code: true,
        titleAr: true,
        titleEn: true,
        imageUrl: true,
        locationAr: true,
        locationEn: true,
      },
      orderBy: { order: "asc" },
      take: 5,
    }),
    db.blogPost.findMany({
      where: {
        status: "published",
        OR: [
          { titleAr: { contains: q, mode: "insensitive" } },
          { titleEn: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        slug: true,
        titleAr: true,
        titleEn: true,
        coverImage: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
  ]);

  return { works, posts };
}

export default async function SearchPage({
  params,
  searchParams,
}: SearchPageProps) {
  const { locale } = await params;
  const { q = "" } = await searchParams;
  const trimmedQ = q.trim();

  const isAr = locale === "ar";

  if (!trimmedQ) {
    return (
      <div className="search-page-empty">
        <div className="search-page-empty-inner">
          <svg
            className="search-page-icon"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <h1 className="search-page-empty-title">
            {isAr ? "ابحث في الموقع" : "Search the site"}
          </h1>
          <p className="search-page-empty-hint">
            {isAr
              ? "ابحث عن الأعمال الفوتوغرافية أو التدوينات"
              : "Search for portfolio works or blog posts"}
          </p>
          <form action={`/${locale}/search`} method="get" className="search-page-form">
            <div className="search-page-input-wrap">
              <svg
                className="search-page-input-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                name="q"
                autoFocus
                className="search-page-input"
                placeholder={isAr ? "ابحث…" : "Search…"}
                dir={isAr ? "rtl" : "ltr"}
              />
            </div>
          </form>
        </div>

        <style>{pageStyles}</style>
      </div>
    );
  }

  const { works, posts } = await search(trimmedQ);
  const hasResults = works.length > 0 || posts.length > 0;

  return (
    <div className="search-page">
      <div className="search-page-header">
        <h1 className="search-page-title">
          {isAr ? `نتائج البحث عن` : `Search results for`}{" "}
          <span className="search-page-query">«{trimmedQ}»</span>
        </h1>
        <form action={`/${locale}/search`} method="get" className="search-page-form search-page-form--inline">
          <div className="search-page-input-wrap">
            <svg
              className="search-page-input-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              name="q"
              defaultValue={trimmedQ}
              className="search-page-input"
              placeholder={isAr ? "ابحث…" : "Search…"}
              dir={isAr ? "rtl" : "ltr"}
            />
          </div>
        </form>
      </div>

      {!hasResults && (
        <p className="search-page-no-results">
          {isAr
            ? `لا توجد نتائج لـ «${trimmedQ}»`
            : `No results for «${trimmedQ}»`}
        </p>
      )}

      {works.length > 0 && (
        <section className="search-section">
          <h2 className="search-section-title">
            {isAr ? "الأعمال" : "Works"}
          </h2>
          <div className="search-results-list">
            {works.map((work) => (
              <Link
                key={work.code}
                href={`/${locale}/portfolio/${work.code}`}
                className="search-result-item"
              >
                <div className="search-result-thumb">
                  <Image
                    src={work.imageUrl}
                    alt={isAr ? work.titleAr : work.titleEn}
                    width={80}
                    height={80}
                    className="search-result-img"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className="search-result-info">
                  <p className="search-result-title">
                    {isAr ? work.titleAr : work.titleEn}
                  </p>
                  <p className="search-result-code">{work.code}</p>
                  {(isAr ? work.locationAr : work.locationEn) && (
                    <p className="search-result-sub">
                      {isAr ? work.locationAr : work.locationEn}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="search-section">
          <h2 className="search-section-title">
            {isAr ? "المدونة" : "Blog"}
          </h2>
          <div className="search-results-list">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/${locale}/blog/${post.slug}`}
                className="search-result-item"
              >
                {post.coverImage && (
                  <div className="search-result-thumb">
                    <Image
                      src={post.coverImage}
                      alt={isAr ? post.titleAr : post.titleEn}
                      width={80}
                      height={80}
                      className="search-result-img"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                )}
                <div className="search-result-info">
                  <p className="search-result-title">
                    {isAr ? post.titleAr : post.titleEn}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <style>{pageStyles}</style>
    </div>
  );
}

const pageStyles = `
  .search-page,
  .search-page-empty {
    max-width: 760px;
    margin: 0 auto;
    padding: 3rem 1.5rem 5rem;
  }

  .search-page-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
  }

  .search-page-empty-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    width: 100%;
    max-width: 480px;
    text-align: center;
  }

  .search-page-icon {
    color: var(--text-muted);
    opacity: 0.5;
    margin-bottom: 0.5rem;
  }

  .search-page-empty-title {
    font-size: 1.5rem;
    font-weight: 400;
    color: var(--text-primary);
    margin: 0;
  }

  .search-page-empty-hint {
    font-size: 0.9rem;
    color: var(--text-muted);
    margin: 0;
  }

  .search-page-header {
    margin-bottom: 2.5rem;
  }

  .search-page-title {
    font-size: 1.25rem;
    font-weight: 400;
    color: var(--text-secondary);
    margin: 0 0 1.25rem;
  }

  .search-page-query {
    color: var(--text-primary);
    font-weight: 500;
  }

  .search-page-form {
    width: 100%;
  }

  .search-page-form--inline {
    max-width: 400px;
  }

  .search-page-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-page-input-icon {
    position: absolute;
    inset-inline-start: 14px;
    color: var(--text-muted);
    pointer-events: none;
    flex-shrink: 0;
  }

  .search-page-input {
    width: 100%;
    height: 48px;
    padding-inline: 44px 16px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg, 12px);
    font-size: 1rem;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.18s;
  }

  .search-page-input:focus {
    border-color: var(--text-muted);
  }

  .search-page-no-results {
    font-size: 1rem;
    color: var(--text-muted);
    margin-top: 1rem;
  }

  .search-section {
    margin-bottom: 2.5rem;
  }

  .search-section-title {
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin: 0 0 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-subtle);
  }

  .search-results-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .search-result-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.875rem 0;
    border-bottom: 1px solid var(--border-subtle);
    text-decoration: none;
    transition: background 0.15s;
    border-radius: var(--radius-md);
    padding-inline: 0.5rem;
  }

  .search-result-item:hover {
    background: var(--bg-secondary);
  }

  .search-result-thumb {
    flex-shrink: 0;
    width: 64px;
    height: 64px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: var(--bg-secondary);
  }

  .search-result-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .search-result-info {
    flex: 1;
    min-width: 0;
  }

  .search-result-title {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-primary);
    margin: 0 0 0.2rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .search-result-code {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin: 0 0 0.15rem;
    font-variant-numeric: tabular-nums;
  }

  .search-result-sub {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 640px) {
    .search-page,
    .search-page-empty {
      padding: 2rem 1rem 4rem;
    }

    .search-page-input {
      height: 44px;
      font-size: 0.95rem;
    }
  }
`;
