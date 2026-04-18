export const dynamic = "force-dynamic";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import TipTapRenderer from "@/components/blog/TipTapRenderer";
import CommentsSection from "@/components/blog/CommentsSection";
import RelatedPosts from "@/components/blog/RelatedPosts";
import NewsletterForm from "@/components/newsletter/NewsletterForm";
import Breadcrumb from "@/components/ui/Breadcrumb";

async function getSettings() {
  try {
    return await db.siteSettings.findUnique({ where: { id: "main" } });
  } catch {
    return null;
  }
}

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://saleh-portfolio.vercel.app";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

async function getPost(slug: string) {
  try {
    return await db.blogPost.findFirst({
      where: { slug, status: "published" },
      include: { tags: true },
    });
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

function calcReadingTime(content: object | null | undefined): number {
  if (!content) return 1;
  let text = "";
  function extract(node: unknown) {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (typeof n.text === "string") text += " " + n.text;
    if (Array.isArray(n.content)) n.content.forEach(extract);
    if (Array.isArray(n.children)) n.children.forEach(extract);
  }
  extract(content);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("blog");

  const [post, settings] = await Promise.all([getPost(slug), getSettings()]);
  if (!post) notFound();

  const title   = locale === "ar" ? post.titleAr : post.titleEn;
  const content = locale === "ar" ? post.contentAr : (post.contentEn ?? post.contentAr);
  const dir     = locale === "ar" ? "rtl" as const : "ltr" as const;

  // Signature
  const sigOn = (settings?.blogSignatureOn ?? true) && !post.signatureDisabled;
  const sigText = locale === "ar"
    ? (settings?.blogSignatureAr ?? null)
    : (settings?.blogSignatureEn ?? null);
  const sigPos = settings?.blogSignaturePos ?? "bottom";

  const formattedDate = post.publishedAt
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar-u-ca-gregory-nu-latn" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(post.publishedAt))
    : null;

  const readingMins = calcReadingTime(content as object);
  const readingLabel = locale === "ar" ? `${readingMins} دقيقة قراءة` : `${readingMins} min read`;

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


      <article className="bpost-article">
        <div className="bpost-inner container">
          <Breadcrumb
            items={[
              { label: locale === "ar" ? "الرئيسية" : "Home", href: `/${locale}` },
              { label: locale === "ar" ? "المدونة" : "Blog", href: `/${locale}/blog` },
              { label: title ?? post.slug },
            ]}
          />

          {/* Header */}
          <header className="bpost-header" dir={dir}>
            <div className="bpost-meta-row">
              {formattedDate && (
                <time className="bpost-date">{formattedDate}</time>
              )}
              <span className="bpost-reading-time">{readingLabel}</span>
            </div>
            <h1 className="bpost-title">{title}</h1>
            <div className="bpost-divider" />
            {post.tags && post.tags.length > 0 && (
              <div className="bpost-tags" dir={dir}>
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/${locale}/blog?tag=${tag.slug}`}
                    className="bpost-tag-pill"
                  >
                    {locale === "ar" ? tag.nameAr : (tag.nameEn || tag.nameAr)}
                  </Link>
                ))}
              </div>
            )}
          </header>

          {/* Content */}
          <div className="bpost-content">
            {sigOn && sigText && sigPos === "top" && (
              <p className="bpost-signature" dir={dir}>{sigText}</p>
            )}
            <TipTapRenderer content={content as object} dir={dir} />
            {sigOn && sigText && sigPos === "bottom" && (
              <p className="bpost-signature" dir={dir}>{sigText}</p>
            )}
          </div>

          {/* Comments */}
          <CommentsSection postId={post.id} locale={locale as "ar" | "en"} />

          {/* Related posts */}
          <RelatedPosts currentSlug={post.slug} locale={locale as "ar" | "en"} />

          {/* Newsletter */}
          <div className="bpost-newsletter">
            <NewsletterForm locale={locale as "ar" | "en"} />
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

        /* Header */
        .bpost-header { margin-bottom: 2.5rem; }

        .bpost-meta-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.875rem;
          flex-wrap: wrap;
        }

        .bpost-date {
          font-size: 0.75rem;
          color: var(--text-subtle);
          letter-spacing: 0.04em;
        }

        .bpost-reading-time {
          display: inline-flex;
          align-items: center;
          font-size: 0.72rem;
          color: var(--text-subtle);
          letter-spacing: 0.04em;
          gap: 0.35rem;
        }
        .bpost-reading-time::before {
          content: "·";
          color: var(--border);
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

        /* Tags */
        .bpost-tags {
          display: flex; flex-wrap: wrap; gap: 0.5rem;
          margin-top: 1.25rem;
        }
        .bpost-tag-pill {
          font-size: 0.72rem; padding: 0.25rem 0.75rem;
          border: 1px solid var(--border); border-radius: 999px;
          color: var(--text-muted); text-decoration: none;
          transition: border-color var(--transition-fast), color var(--transition-fast);
          letter-spacing: 0.02em;
        }
        .bpost-tag-pill:hover { border-color: var(--text-secondary); color: var(--text-primary); }

        /* Content */
        .bpost-content { padding-top: 2rem; }

        /* Signature */
        .bpost-signature {
          font-size: 0.875rem;
          color: var(--text-muted);
          font-style: italic;
          margin-top: 2.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border-subtle);
          line-height: 1.6;
          white-space: pre-line;
        }

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

        .bpost-newsletter {
          margin-top: 4rem;
          padding-top: 3rem;
          border-top: 1px solid var(--border-subtle);
        }
      `}</style>
    </>
  );
}
