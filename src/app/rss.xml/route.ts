export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://salehalhathoul.com";

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  let posts: {
    slug: string;
    titleAr: string;
    titleEn: string | null;
    coverImage: string | null;
    publishedAt: Date | null;
    updatedAt: Date;
  }[] = [];

  try {
    posts = await db.blogPost.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      take: 30,
      select: {
        slug: true,
        titleAr: true,
        titleEn: true,
        coverImage: true,
        publishedAt: true,
        updatedAt: true,
      },
    });
  } catch {
    posts = [];
  }

  const items = posts
    .map((post) => {
      const title = escape(post.titleAr);
      const url = `${BASE_URL}/ar/blog/${post.slug}`;
      const pubDate = (post.publishedAt ?? post.updatedAt).toUTCString();
      const enclosure = post.coverImage
        ? `<enclosure url="${escape(post.coverImage)}" type="image/jpeg" />`
        : "";
      return `
    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      ${enclosure}
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>صالح الهذلول — مدونة</title>
    <link>${BASE_URL}/ar/blog</link>
    <description>مقالات فوتوغرافية من صالح الهذلول</description>
    <language>ar</language>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
