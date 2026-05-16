export const dynamic = "force-dynamic";
import { getTranslations, getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import BlogList from "@/components/blog/BlogList";
import NewsletterForm from "@/components/newsletter/NewsletterForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "المدونة" : "Journal",
    description: locale === "ar" ? "مقالات ومشاركات فوتوغرافية" : "Photography articles and thoughts",
    alternates: { canonical: `/${locale}/blog` },
    openGraph: { url: `/${locale}/blog` },
  };
}

async function getPosts() {
  try {
    return await db.blogPost.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        slug: true,
        titleAr: true,
        titleEn: true,
        coverImage: true,
        publishedAt: true,
        createdAt: true,
      },
    });
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const t = await getTranslations("blog");
  const locale = (await getLocale()) as "ar" | "en";
  const posts = await getPosts();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <>
      <div className="bp-header container" dir={dir}>
        <div className="bp-header-row">
          <h1 className="bp-title">{t("title")}</h1>
          <div className="bp-nl-inline">
            <NewsletterForm locale={locale} variant="inline" />
          </div>
        </div>
      </div>

      <div className="bp-body container">
        <BlogList posts={posts} />
      </div>

      <style>{`
        .bp-header {
          padding-top: 3.5rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 3rem;
        }

        .bp-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .bp-title {
          font-family: var(--font-heading);
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 300;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .bp-nl-inline {
          flex-shrink: 0;
        }

        .bp-body {
          padding-bottom: 6rem;
        }
      `}</style>
    </>
  );
}
