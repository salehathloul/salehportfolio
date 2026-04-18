import { db } from "@/lib/db";
import BlogTagsClient from "./BlogTagsClient";

export const dynamic = "force-dynamic";

export default async function BlogTagsPage() {
  const tags = await db.blogTag.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { nameAr: "asc" },
  });

  return <BlogTagsClient initialTags={tags} />;
}
