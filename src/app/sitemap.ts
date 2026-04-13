import { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://saleh-portfolio.vercel.app";

const LOCALES = ["ar", "en"] as const;

function url(path: string) {
  return `${BASE_URL}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes = [
    "",
    "/portfolio",
    "/blog",
    "/acquire",
    "/about",
    "/contact",
  ];

  const staticEntries = LOCALES.flatMap((locale) =>
    staticRoutes.map((route) => ({
      url: url(`/${locale}${route}`),
      lastModified: new Date(),
      changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : 0.8,
    }))
  );

  // Blog posts
  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await db.blogPost.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true },
    });
    blogEntries = LOCALES.flatMap((locale) =>
      posts.map((post) => ({
        url: url(`/${locale}/blog/${post.slug}`),
        lastModified: post.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }))
    );
  } catch {
    // DB not available during build
  }

  return [...staticEntries, ...blogEntries];
}
