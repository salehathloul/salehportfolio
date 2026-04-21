"use client";

import { useEffect, useState, useCallback } from "react";

interface Comment {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  content: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  post: { id: string; titleAr: string; slug: string };
}

type Filter = "all" | "pending" | "approved" | "rejected";

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/comments");
    if (res.ok) setComments(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  async function setStatus(comment: Comment, status: "approved" | "rejected" | "pending") {
    const res = await fetch(`/api/admin/comments/${comment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setComments((prev) =>
        prev.map((c) => c.id === comment.id ? { ...c, status } : c)
      );
    }
  }

  async function deleteComment(id: string, name: string) {
    if (!confirm(`حذف تعليق "${name}"؟`)) return;
    const res = await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id));
  }

  const counts = {
    all: comments.length,
    pending: comments.filter((c) => c.status === "pending").length,
    approved: comments.filter((c) => c.status === "approved").length,
    rejected: comments.filter((c) => c.status === "rejected").length,
  };

  const filtered = filter === "all" ? comments : comments.filter((c) => c.status === filter);

  const tabs: { key: Filter; label: string }[] = [
    { key: "pending",  label: `معلّق (${counts.pending})` },
    { key: "approved", label: `مقبول (${counts.approved})` },
    { key: "rejected", label: `مرفوض (${counts.rejected})` },
    { key: "all",      label: `الكل (${counts.all})` },
  ];

  return (
    <div className="cm-page">
      <div className="cm-header">
        <div>
          <h1 className="cm-title">التعليقات</h1>
          <p className="cm-subtitle">
            {counts.all} تعليق — {counts.pending} بانتظار المراجعة
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="cm-tabs">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`cm-tab ${filter === key ? "active" : ""}`}
          >
            {label}
            {key === "pending" && counts.pending > 0 && (
              <span className="cm-pending-dot" />
            )}
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
            <div key={comment.id} className={`cm-item cm-item--${comment.status}`}>
              {/* Post label */}
              <div className="cm-post-label">
                <a href={`/admin/blog/editor/${comment.post.id}`} className="cm-post-link">
                  {comment.post.titleAr}
                </a>
                <span className={`cm-status-badge cm-status-badge--${comment.status}`}>
                  {comment.status === "pending" ? "معلّق" : comment.status === "approved" ? "مقبول" : "مرفوض"}
                </span>
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
                  </div>
                </div>

                {/* Content */}
                <p className="cm-content">{comment.content}</p>

                {/* Actions */}
                <div className="cm-actions">
                  {comment.status !== "approved" && (
                    <button
                      onClick={() => setStatus(comment, "approved")}
                      className="cm-btn cm-btn--approve"
                    >
                      موافقة
                    </button>
                  )}
                  {comment.status !== "rejected" && (
                    <button
                      onClick={() => setStatus(comment, "rejected")}
                      className="cm-btn cm-btn--reject"
                    >
                      رفض
                    </button>
                  )}
                  {comment.status !== "pending" && (
                    <button
                      onClick={() => setStatus(comment, "pending")}
                      className="cm-btn"
                    >
                      إعادة للمعلّق
                    </button>
                  )}
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
          position: relative;
          padding: 0.5rem 1rem; border: none; background: transparent;
          color: var(--text-muted); font-size: 0.875rem; cursor: pointer;
          border-bottom: 2px solid transparent; margin-bottom: -1px;
          transition: color var(--transition-fast), border-color var(--transition-fast);
          display: flex; align-items: center; gap: 0.35rem;
        }
        .cm-tab.active { color: var(--text-primary); border-bottom-color: var(--text-primary); font-weight: 500; }

        .cm-pending-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #f59e0b; flex-shrink: 0;
        }

        .cm-loading, .cm-empty {
          text-align: center; color: var(--text-muted); padding: 3rem; font-size: 0.9375rem;
        }

        .cm-list { display: flex; flex-direction: column; gap: 0.75rem; }

        .cm-item {
          background: var(--bg-primary); border: 1px solid var(--border);
          border-radius: var(--radius-md); overflow: hidden;
          transition: border-color var(--transition-fast);
        }
        .cm-item--pending { border-color: #f59e0b44; }
        .cm-item--rejected { opacity: 0.65; }
        .cm-item--rejected:hover { opacity: 1; }

        .cm-post-label {
          padding: 0.4rem 1rem;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          font-size: 0.75rem;
          display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
        }
        .cm-post-link {
          color: var(--text-muted); text-decoration: none;
          transition: color var(--transition-fast);
        }
        .cm-post-link:hover { color: var(--text-primary); }

        .cm-status-badge {
          font-size: 0.7rem; padding: 1px 8px; border-radius: 999px;
          font-weight: 500; flex-shrink: 0;
        }
        .cm-status-badge--pending  { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b44; }
        .cm-status-badge--approved { background: #d1fae5; color: #065f46; border: 1px solid #10b98144; }
        .cm-status-badge--rejected { background: #fee2e2; color: #991b1b; border: 1px solid #ef444444; }
        .dark .cm-status-badge--pending  { background: #451a0322; color: #fbbf24; }
        .dark .cm-status-badge--approved { background: #065f4622; color: #34d399; }
        .dark .cm-status-badge--rejected { background: #7f1d1d22; color: #f87171; }

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

        .cm-content {
          font-size: 0.9375rem; color: var(--text-secondary); line-height: 1.65;
          white-space: pre-line; margin: 0 0 0.875rem;
          padding-inline-start: 2.75rem;
        }

        .cm-actions {
          display: flex; gap: 0.5rem; padding-inline-start: 2.75rem; flex-wrap: wrap;
        }
        .cm-btn {
          padding: 0.3rem 0.75rem; background: transparent; color: var(--text-secondary);
          border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.8rem;
          cursor: pointer; transition: all var(--transition-fast);
        }
        .cm-btn:hover { border-color: var(--text-secondary); color: var(--text-primary); }
        .cm-btn--approve {
          color: #065f46; border-color: #10b98166; background: #d1fae522;
        }
        .cm-btn--approve:hover { background: #d1fae5; }
        .cm-btn--reject {
          color: #991b1b; border-color: #ef444466; background: #fee2e222;
        }
        .cm-btn--reject:hover { background: #fee2e2; }
        .dark .cm-btn--approve { color: #34d399; background: #065f4622; }
        .dark .cm-btn--approve:hover { background: #065f4644; }
        .dark .cm-btn--reject { color: #f87171; background: #7f1d1d22; }
        .dark .cm-btn--reject:hover { background: #7f1d1d44; }
        .cm-btn--danger { color: #e53e3e; border-color: #fed7d7; }
        .cm-btn--danger:hover { background: #fff5f5; }
        .dark .cm-btn--danger { border-color: #742a2a; }
        .dark .cm-btn--danger:hover { background: #2d1b1b; }
      `}</style>
    </div>
  );
}
