"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Post {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  coverImage: string | null;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  published: "منشور",
  hidden: "مخفي",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#f59e0b",
  published: "#10b981",
  hidden: "#6b7280",
};

export default function BlogListPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [creating, setCreating] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const url = filter === "all" ? "/api/blog" : `/api/blog?status=${filter}`;
    const res = await fetch(url);
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  async function createNewPost() {
    setCreating(true);
    // Generate a unique slug by timestamp
    const slug = `post-${Date.now()}`;
    const res = await fetch("/api/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        titleAr: "تدوينة جديدة",
        titleEn: "New Post",
        contentAr: {},
        status: "draft",
      }),
    });
    if (res.ok) {
      const post: Post = await res.json();
      window.location.href = `/admin/blog/editor/${post.id}`;
    } else {
      alert("فشل إنشاء التدوينة");
      setCreating(false);
    }
  }

  async function deletePost(id: string, title: string) {
    if (!confirm(`حذف "${title}"؟`)) return;
    const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
    if (res.ok) fetchPosts();
  }

  const filteredPosts =
    filter === "all" ? posts : posts.filter((p) => p.status === filter);

  return (
    <div className="blog-list-page">
      <div className="blog-list-header">
        <div>
          <h1 className="blog-list-title">المدونة</h1>
          <p className="blog-list-subtitle">{posts.length} تدوينة</p>
        </div>
        <button
          onClick={createNewPost}
          disabled={creating}
          className="btn-primary"
        >
          {creating ? "جاري الإنشاء..." : "+ تدوينة جديدة"}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="blog-filter-tabs">
        {["all", "published", "draft", "hidden"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`blog-filter-tab ${filter === s ? "active" : ""}`}
          >
            {s === "all" ? "الكل" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="blog-loading">جاري التحميل...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="blog-empty">لا توجد تدوينات</div>
      ) : (
        <div className="blog-posts-list">
          {filteredPosts.map((post) => (
            <div key={post.id} className="blog-post-row">
              {/* Cover */}
              <div className="blog-post-cover">
                {post.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.coverImage} alt="" />
                ) : (
                  <div className="blog-post-cover-placeholder">📝</div>
                )}
              </div>

              {/* Info */}
              <div className="blog-post-info">
                <div className="blog-post-top">
                  <span
                    className="blog-post-status"
                    style={{ color: STATUS_COLORS[post.status] }}
                  >
                    ● {STATUS_LABELS[post.status] ?? post.status}
                  </span>
                  <span className="blog-post-date">
                    {new Date(post.updatedAt).toLocaleDateString("ar-SA")}
                  </span>
                </div>
                <h2 className="blog-post-title">{post.titleAr}</h2>
                {post.titleEn && (
                  <p className="blog-post-title-en">{post.titleEn}</p>
                )}
                <p className="blog-post-slug">/{post.slug}</p>
              </div>

              {/* Actions */}
              <div className="blog-post-actions">
                <Link href={`/admin/blog/editor/${post.id}`} className="btn-secondary">
                  تعديل
                </Link>
                <button
                  onClick={() => deletePost(post.id, post.titleAr)}
                  className="btn-danger"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .blog-list-page { max-width: 900px; margin: 0 auto; }

        .blog-list-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .blog-list-title { font-size: 1.5rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem; }
        .blog-list-subtitle { font-size: 0.875rem; color: var(--text-muted); }

        .blog-filter-tabs {
          display: flex;
          gap: 0.25rem;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0;
        }
        .blog-filter-tab {
          padding: 0.5rem 1rem;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 0.875rem;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: color var(--transition-fast), border-color var(--transition-fast);
        }
        .blog-filter-tab.active {
          color: var(--text-primary);
          border-bottom-color: var(--text-primary);
          font-weight: 500;
        }

        .blog-loading, .blog-empty {
          text-align: center;
          color: var(--text-muted);
          padding: 3rem 1rem;
          font-size: 0.9375rem;
        }

        .blog-posts-list { display: flex; flex-direction: column; gap: 0.75rem; }

        .blog-post-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 1rem;
          transition: border-color var(--transition-fast);
        }
        .blog-post-row:hover { border-color: var(--text-muted); }

        .blog-post-cover {
          width: 80px;
          height: 60px;
          flex-shrink: 0;
          border-radius: var(--radius-sm);
          overflow: hidden;
          background: var(--bg-secondary);
        }
        .blog-post-cover img { width: 100%; height: 100%; object-fit: cover; }
        .blog-post-cover-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem;
        }

        .blog-post-info { flex: 1; min-width: 0; }
        .blog-post-top { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem; }
        .blog-post-status { font-size: 0.75rem; font-weight: 500; }
        .blog-post-date { font-size: 0.75rem; color: var(--text-subtle); }
        .blog-post-title { font-size: 1rem; font-weight: 500; color: var(--text-primary); margin-bottom: 0.125rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .blog-post-title-en { font-size: 0.8125rem; color: var(--text-muted); direction: ltr; margin-bottom: 0.125rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .blog-post-slug { font-size: 0.75rem; color: var(--text-subtle); direction: ltr; }

        .blog-post-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }

        .btn-primary {
          padding: 0.5rem 1.25rem;
          background: var(--text-primary);
          color: var(--bg-primary);
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          transition: opacity var(--transition-fast);
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.85; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-secondary {
          padding: 0.375rem 0.875rem;
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          transition: border-color var(--transition-fast), color var(--transition-fast);
        }
        .btn-secondary:hover { border-color: var(--text-secondary); color: var(--text-primary); }

        .btn-danger {
          padding: 0.375rem 0.875rem;
          background: transparent;
          color: #e53e3e;
          border: 1px solid #fed7d7;
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        .btn-danger:hover { background: #fff5f5; }
        .dark .btn-danger { border-color: #742a2a; }
        .dark .btn-danger:hover { background: #2d1b1b; }
      `}</style>
    </div>
  );
}
