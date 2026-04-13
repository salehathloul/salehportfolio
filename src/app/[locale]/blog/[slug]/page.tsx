import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import TipTapRenderer from "@/components/blog/TipTapRenderer";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://saleh-portfolio.vercel.app";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

async function getPost(slug: string) {
  try {
    return await db.blogPost.findFirst({ where: { slug, status: "published" } });
  } catch {
    return null;
  }
}

// ── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const posts = await db.blogPost.findMany({
      where: { status: "published" },
      select: { slug: true },
    });
    return ["ar", "en"].flatMap((locale) =>
      posts.map((p) => ({ locale, slug: p.slug }))
    );
  } catch {
    return [];
  }
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const title = locale === "ar" ? post.titleAr : (post.titleEn ?? post.titleAr);
  const images = post.coverImage
    ? [{ url: post.coverImage, width: 1200, height: 630 }]
    : [];

  return {
    title,
    openGraph: {
      type: "article",
      title,
      url: `/${locale}/blog/${slug}`,
      images,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
    },
    twitter: { card: "summary_large_image", title, images: post.coverImage ? [post.coverImage] : [] },
    alternates: {
      canonical: `/${locale}/blog/${slug}`,
      languages: {
        ar: `${BASE_URL}/ar/blog/${slug}`,
        en: `${BASE_URL}/en/blog/${slug}`,
      },
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("blog");

  const post = await getPost(slug);
  if (!post) notFound();

  const title   = locale === "ar" ? post.titleAr : post.titleEn;
  const content = locale === "ar" ? post.contentAr : (post.contentEn ?? post.contentAr);
  const dir     = locale === "ar" ? "rtl" as const : "ltr" as const;

  const formattedDate = post.publishedAt
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar-u-ca-gregory-nu-latn" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(post.publishedAt))
    : null;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    image: post.coverImage ? [post.coverImage] : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt?.toISOString(),
    inLanguage: locale === "ar" ? "ar" : "en",
    url: `${BASE_URL}/${locale}/blog/${post.slug}`,
  };

  return (
    <>
      <Script
        id="blog-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Cover ── */}
      {post.coverImage && (
        <div className="bpost-cover">
          <Image
            src={post.coverImage}
            alt={title}
            fill
            priority
            className="bpost-cover-img"
            sizes="100vw"
          />
          <div className="bpost-cover-overlay" />
        </div>
      )}

      <article className="bpost-article">
        <div className="bpost-inner container">
          {/* Back */}
          <Link href={`/${locale}/blog`} className="bpost-back" dir={dir}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {locale === "ar"
                ? <path d="M5 2l4 5-4 5" />  /* AR: points right (back = right in RTL) */
                : <path d="M9 2L5 7l4 5" />  /* EN: points left */
              }
            </svg>
            {t("title")}
          </Link>

          {/* Header */}
          <header className="bpost-header" dir={dir}>
            {formattedDate && (
              <time className="bpost-date">{formattedDate}</time>
            )}
            <h1 className="bpost-title">{title}</h1>
            <div className="bpost-divider" />
          </header>

          {/* Content */}
          <div className="bpost-content">
            <TipTapRenderer content={content as object} dir={dir} />
          </div>

          {/* Footer nav */}
          <div className="bpost-footer" dir={dir}>
            <Link href={`/${locale}/blog`} className="bpost-back-footer">
              {locale === "ar" ? `${t("title")} →` : `← ${t("title")}`}
            </Link>
          </div>
        </div>
      </article>

      <style>{`
        /* Cover */
        .bpost-cover {
          position: relative;
          width: 100%;
          height: clamp(280px, 55vw, 580px);
          background: var(--bg-secondary);
          overflow: hidden;
        }

        .bpost-cover-img { object-fit: cover; }

        .bpost-cover-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.35) 100%);
        }

        /* Article */
        .bpost-article { padding-bottom: 8rem; }

        .bpost-inner {
          max-width: 760px;
          margin-inline: auto;
          padding-top: 3rem;
        }

        /* Back link */
        .bpost-back {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 2.5rem;
          transition: color var(--transition-fast);
        }

        .bpost-back:hover { color: var(--text-primary); }

        /* Header */
        .bpost-header { margin-bottom: 2.5rem; }

        .bpost-date {
          display: block;
          font-size: 0.75rem;
          color: var(--text-subtle);
          letter-spacing: 0.04em;
          margin-bottom: 0.875rem;
        }

        .bpost-title {
          font-family: var(--font-heading);
          font-size: clamp(1.75rem, 4vw, 2.75rem);
          font-weight: 300;
          color: var(--text-primary);
          line-height: 1.25;
          letter-spacing: -0.02em;
          margin-bottom: 2rem;
        }

        .bpost-divider {
          width: 3rem;
          height: 1px;
          background: var(--border);
        }

        /* Content */
        .bpost-content { padding-top: 2rem; }

        /* Footer */
        .bpost-footer {
          margin-top: 5rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border-subtle);
        }

        .bpost-back-footer {
          font-size: 0.85rem;
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }

        .bpost-back-footer:hover { color: var(--text-primary); }
      `}</style>
    </>
  );
}
