"use client";

import { useEffect, useState, useCallback } from "react";

interface Comment {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  content: string;
  isHidden: boolean;
  createdAt: string;
  post: { id: string; titleAr: string; slug: string };
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/comments");
    if (res.ok) setComments(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  async function toggleHide(comment: Comment) {
    const res = await fetch(`/api/admin/comments/${comment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHidden: !comment.isHidden }),
    });
    if (res.ok) {
      setComments((prev) =>
        prev.map((c) => c.id === comment.id ? { ...c, isHidden: !c.isHidden } : c)
      );
    }
  }

  async function deleteComment(id: string, name: string) {
    if (!confirm(`حذف تعليق "${name}"؟`)) return;
    const res = await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id));
  }

  const filtered = comments.filter((c) => {
    if (filter === "visible") return !c.isHidden;
    if (filter === "hidden") return c.isHidden;
    return true;
  });

  const visibleCount = comments.filter((c) => !c.isHidden).length;
  const hiddenCount = comments.filter((c) => c.isHidden).length;

  return (
    <div className="cm-page">
      <div className="cm-header">
        <div>
          <h1 className="cm-title">التعليقات</h1>
          <p className="cm-subtitle">{comments.length} تعليق — {visibleCount} ظاهر، {hiddenCount} مخفي</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="cm-tabs">
        {(["all", "visible", "hidden"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`cm-tab ${filter === f ? "active" : ""}`}>
            {f === "all" ? `الكل (${comments.length})` : f === "visible" ? `ظاهر (${visibleCount})` : `مخفي (${hiddenCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="cm-loading">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="cm-empty">لا توجد تعليقات</div>
      ) : (
        <div className="cm-list">
          {filtered.map((comment) => (
            <div key={comment.id} className={`cm-item ${comment.isHidden ? "cm-item--hidden" : ""}`}>
              {/* Post label */}
              <div className="cm-post-label">
                <a href={`/admin/blog/editor/${comment.post.id}`} className="cm-post-link">
                  {comment.post.titleAr}
                </a>
              </div>

              <div className="cm-item-body">
                {/* Author info */}
                <div className="cm-author">
                  <div className="cm-avatar">{comment.name.charAt(0).toUpperCase()}</div>
                  <div className="cm-author-info">
                    <span className="cm-author-name">{comment.name}</span>
                    <span className="cm-author-email">{comment.email}</span>
                    {comment.phone && <span className="cm-author-phone">{comment.phone}</span>}
                  </div>
                  <div className="cm-meta">
                    <span className="cm-date">
                      {new Date(comment.createdAt).toLocaleDateString("ar-SA", {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                    {comment.isHidden && <span className="cm-hidden-badge">مخفي</span>}
                  </div>
                </div>

                {/* Content */}
                <p className="cm-content">{comment.content}</p>

                {/* Actions */}
                <div className="cm-actions">
                  <button
                    onClick={() => toggleHide(comment)}
                    className="cm-btn"
                  >
                    {comment.isHidden ? "إظهار" : "إخفاء"}
                  </button>
                  <button
                    onClick={() => deleteComment(comment.id, comment.name)}
                    className="cm-btn cm-btn--danger"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .cm-page { max-width: 860px; margin: 0 auto; }

        .cm-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap;
        }
        .cm-title { font-size: 1.5rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem; }
        .cm-subtitle { font-size: 0.875rem; color: var(--text-muted); }

        .cm-tabs {
          display: flex; gap: 0.25rem; margin-bottom: 1.25rem;
          border-bottom: 1px solid var(--border);
        }
        .cm-tab {
          padding: 0.5rem 1rem; border: none; background: transparent;
          color: var(--text-muted); font-size: 0.875rem; cursor: pointer;
          border-bottom: 2px solid transparent; margin-bottom: -1px;
          transition: color var(--transition-fast), border-color var(--transition-fast);
        }
        .cm-tab.active { color: var(--text-primary); border-bottom-color: var(--text-primary); font-weight: 500; }

        .cm-loading, .cm-empty {
          text-align: center; color: var(--text-muted); padding: 3rem; font-size: 0.9375rem;
        }

        .cm-list { display: flex; flex-direction: column; gap: 0.75rem; }

        .cm-item {
          background: var(--bg-primary); border: 1px solid var(--border);
          border-radius: var(--radius-md); overflow: hidden;
          transition: border-color var(--transition-fast);
        }
        .cm-item--hidden { opacity: 0.6; }
        .cm-item--hidden:hover { opacity: 1; }

        .cm-post-label {
          padding: 0.4rem 1rem;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          font-size: 0.75rem;
        }
        .cm-post-link {
          color: var(--text-muted);
          text-decoration: none;
          transition: color var(--transition-fast);
        }
        .cm-post-link:hover { color: var(--text-primary); }

        .cm-item-body { padding: 1rem; }

        .cm-author {
          display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem;
        }
        .cm-avatar {
          width: 36px; height: 36px; flex-shrink: 0; border-radius: 50%;
          background: var(--bg-tertiary); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.875rem; font-weight: 600; color: var(--text-secondary);
        }
        .cm-author-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.1rem; }
        .cm-author-name { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
        .cm-author-email { font-size: 0.8rem; color: var(--text-muted); direction: ltr; }
        .cm-author-phone { font-size: 0.8rem; color: var(--text-muted); direction: ltr; }
        .cm-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; flex-shrink: 0; }
        .cm-date { font-size: 0.75rem; color: var(--text-subtle); }
        .cm-hidden-badge {
          font-size: 0.7rem; padding: 1px 7px; border-radius: 999px;
          background: var(--bg-secondary); border: 1px solid var(--border);
          color: var(--text-muted);
        }

        .cm-content {
          font-size: 0.9375rem; color: var(--text-secondary); line-height: 1.65;
          white-space: pre-line; margin: 0 0 0.875rem;
          padding-inline-start: 2.75rem;
        }

        .cm-actions {
          display: flex; gap: 0.5rem; padding-inline-start: 2.75rem;
        }
        .cm-btn {
          padding: 0.3rem 0.75rem; background: transparent; color: var(--text-secondary);
          border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.8rem;
          cursor: pointer; transition: all var(--transition-fast);
        }
        .cm-btn:hover { border-color: var(--text-secondary); color: var(--text-primary); }
        .cm-btn--danger { color: #e53e3e; border-color: #fed7d7; }
        .cm-btn--danger:hover { background: #fff5f5; }
        .dark .cm-btn--danger { border-color: #742a2a; }
        .dark .cm-btn--danger:hover { background: #2d1b1b; }
      `}</style>
    </div>
  );
}
