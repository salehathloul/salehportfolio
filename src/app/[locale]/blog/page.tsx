import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import BlogList from "@/components/blog/BlogList";

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
  const posts = await getPosts();

  return (
    <>
      <div className="bp-header container">
        <h1 className="bp-title">{t("title")}</h1>
      </div>

      <div className="bp-body container">
        <BlogList posts={posts} />
      </div>

      <style>{`
        .bp-header {
          padding-top: 3.5rem;
          padding-bottom: 2.5rem;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 3rem;
        }

        .bp-title {
          font-family: var(--font-heading);
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 300;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .bp-body {
          padding-bottom: 6rem;
        }
      `}</style>
    </>
  );
}
