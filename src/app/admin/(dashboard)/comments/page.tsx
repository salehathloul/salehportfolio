"use client";

import { useEffect, useState, useCallback } from "react";

interface Comment {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  content: string;
  status: "pending" | "approved" | "rejected" | "deleted";
  createdAt: string;
  post: { id: string; titleAr: string; slug: string };
}

type Filter = "approved" | "pending" | "rejected" | "deleted";

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("approved");

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/comments");
    if (res.ok) setComments(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // ── تغيير الحالة ──────────────────────────────────────────
  async function setStatus(id: string, status: Comment["status"]) {
    const res = await fetch(`/api/admin/comments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) setComments((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
  }

  // ── حذف نهائي ─────────────────────────────────────────────
  async function permanentDelete(id: string, name: string) {
    if (!confirm(`حذف تعليق "${name}" نهائياً؟ لا يمكن التراجع.`)) return;
    const res = await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id));
  }

  const counts = {
    approved: comments.filter((c) => c.status === "approved").length,
    pending:  comments.filter((c) => c.status === "pending").length,
    rejected: comments.filter((c) => c.status === "rejected").length,
    deleted:  comments.filter((c) => c.status === "deleted").length,
  };

  const filtered = comments.filter((c) => c.status === filter);

  const tabs: { key: Filter; label: string; dot?: boolean }[] = [
    { key: "approved", label: `ظاهر (${counts.approved})` },
    { key: "pending",  label: `معلّق (${counts.pending})`,  dot: counts.pending > 0 },
    { key: "rejected", label: `مرفوض (${counts.rejected})` },
    { key: "deleted",  label: `محذوف (${counts.deleted})`,  dot: counts.deleted > 0 },
  ];

  return (
    <div className="cm-page">
      <div className="cm-header">
        <div>
          <h1 className="cm-title">التعليقات</h1>
          <p className="cm-subtitle">
            {counts.approved + counts.pending + counts.rejected} تعليق نشط
            {counts.deleted > 0 && ` — ${counts.deleted} محذوف`}
          </p>
        </div>
      </div>

      {/* تبويبات */}
      <div className="cm-tabs">
        {tabs.map(({ key, label, dot }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`cm-tab ${filter === key ? "active" : ""} ${key === "deleted" ? "cm-tab--deleted" : ""}`}
          >
            {label}
            {dot && <span className="cm-dot" />}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="cm-loading">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="cm-empty">
          {filter === "deleted" ? "سلة المحذوفات فارغة" : "لا توجد تعليقات"}
        </div>
      ) : (
        <div className="cm-list">
          {filtered.map((comment) => (
            <div
              key={comment.id}
              className={`cm-item ${comment.status === "deleted" ? "cm-item--deleted" : ""} ${comment.status === "pending" ? "cm-item--pending" : ""}`}
            >
              {/* عنوان التدوينة */}
              <div className="cm-post-label">
                <a href={`/admin/blog/editor/${comment.post.id}`} className="cm-post-link">
                  {comment.post.titleAr}
                </a>
                <span className={`cm-badge cm-badge--${comment.status}`}>
                  {comment.status === "approved" ? "ظاهر"
                    : comment.status === "pending" ? "معلّق"
                    : comment.status === "rejected" ? "مرفوض"
                    : "محذوف"}
                </span>
              </div>

              <div className="cm-body">
                {/* معلومات الكاتب */}
                <div className="cm-author">
                  <div className="cm-avatar">{comment.name.charAt(0).toUpperCase()}</div>
                  <div className="cm-author-info">
                    <span className="cm-author-name">{comment.name}</span>
                    <span className="cm-author-email">{comment.email}</span>
                    {comment.phone && <span className="cm-author-phone">{comment.phone}</span>}
                  </div>
                  <span className="cm-date">
                    {new Date(comment.createdAt).toLocaleDateString("ar-SA", {
                      year: "numeric", month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* نص التعليق */}
                <p className="cm-content">{comment.content}</p>

                {/* أزرار الإجراءات */}
                <div className="cm-actions">
                  {comment.status === "deleted" ? (
                    // تبويب المحذوفات: استعادة + حذف نهائي
                    <>
                      <button onClick={() => setStatus(comment.id, "approved")} className="cm-btn cm-btn--restore">
                        ↩ استعادة
                      </button>
                      <button onClick={() => permanentDelete(comment.id, comment.name)} className="cm-btn cm-btn--permanent">
                        حذف نهائي
                      </button>
                    </>
                  ) : (
                    // التبويبات الأخرى
                    <>
                      {comment.status !== "approved" && (
                        <button onClick={() => setStatus(comment.id, "approved")} className="cm-btn cm-btn--approve">
                          موافقة
                        </button>
                      )}
                      {comment.status !== "rejected" && (
                        <button onClick={() => setStatus(comment.id, "rejected")} className="cm-btn cm-btn--reject">
                          رفض
                        </button>
                      )}
                      {comment.status !== "pending" && (
                        <button onClick={() => setStatus(comment.id, "pending")} className="cm-btn">
                          معلّق
                        </button>
                      )}
                      {/* حذف = soft delete → ينتقل لتبويب المحذوفات */}
                      <button onClick={() => setStatus(comment.id, "deleted")} className="cm-btn cm-btn--delete">
                        حذف
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .cm-page { max-width: 860px; }

        .cm-header { margin-bottom: 1.5rem; }
        .cm-title  { font-size: 1.375rem; font-weight: 600; color: var(--text-primary); }
        .cm-subtitle { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.2rem; }

        /* تبويبات */
        .cm-tabs {
          display: flex; gap: 0; margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border);
        }
        .cm-tab {
          position: relative;
          padding: 0.5rem 1rem; border: none; background: transparent;
          color: var(--text-muted); font-size: 0.875rem; cursor: pointer;
          border-bottom: 2px solid transparent; margin-bottom: -1px;
          transition: color 150ms, border-color 150ms;
          display: flex; align-items: center; gap: 0.4rem;
          white-space: nowrap;
        }
        .cm-tab:hover { color: var(--text-secondary); }
        .cm-tab.active { color: var(--text-primary); border-bottom-color: var(--text-primary); font-weight: 500; }
        .cm-tab--deleted.active { color: #e53e3e; border-bottom-color: #e53e3e; }

        .cm-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #f59e0b; flex-shrink: 0;
        }
        .cm-tab--deleted .cm-dot { background: #e53e3e; }

        .cm-loading, .cm-empty {
          text-align: center; color: var(--text-muted);
          padding: 4rem 2rem; font-size: 0.9375rem;
        }

        /* قائمة */
        .cm-list { display: flex; flex-direction: column; gap: 0.75rem; }

        .cm-item {
          background: var(--bg-primary); border: 1px solid var(--border);
          border-radius: var(--radius-md); overflow: hidden;
        }
        .cm-item--pending { border-color: #f59e0b55; }
        .cm-item--deleted {
          opacity: 0.6; background: var(--bg-secondary);
          transition: opacity 150ms;
        }
        .cm-item--deleted:hover { opacity: 1; }

        /* رأس البطاقة */
        .cm-post-label {
          padding: 0.375rem 1rem;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          font-size: 0.75rem;
          display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
        }
        .cm-post-link { color: var(--text-muted); text-decoration: none; }
        .cm-post-link:hover { color: var(--text-primary); }

        .cm-badge {
          font-size: 0.7rem; padding: 1px 8px; border-radius: 999px;
          font-weight: 500; flex-shrink: 0;
        }
        .cm-badge--approved { background: #d1fae5; color: #065f46; border: 1px solid #10b98133; }
        .cm-badge--pending  { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b33; }
        .cm-badge--rejected { background: #fee2e2; color: #991b1b; border: 1px solid #ef444433; }
        .cm-badge--deleted  { background: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db; }
        .dark .cm-badge--approved { background: #065f4622; color: #34d399; }
        .dark .cm-badge--pending  { background: #45190322; color: #fbbf24; }
        .dark .cm-badge--rejected { background: #7f1d1d22; color: #f87171; }
        .dark .cm-badge--deleted  { background: #1f293722; color: #9ca3af; }

        /* جسم البطاقة */
        .cm-body { padding: 1rem; }

        .cm-author { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem; }
        .cm-avatar {
          width: 34px; height: 34px; flex-shrink: 0; border-radius: 50%;
          background: var(--bg-tertiary); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary);
        }
        .cm-author-info { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
        .cm-author-name  { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
        .cm-author-email { font-size: 0.775rem; color: var(--text-muted); direction: ltr; }
        .cm-author-phone { font-size: 0.775rem; color: var(--text-muted); direction: ltr; }
        .cm-date { font-size: 0.75rem; color: var(--text-subtle); white-space: nowrap; margin-top: 0.1rem; }

        .cm-content {
          font-size: 0.9rem; color: var(--text-secondary); line-height: 1.65;
          white-space: pre-line; margin: 0 0 0.875rem;
          padding-inline-start: 2.75rem;
        }

        /* أزرار */
        .cm-actions {
          display: flex; gap: 0.4rem; padding-inline-start: 2.75rem; flex-wrap: wrap;
        }
        .cm-btn {
          padding: 0.275rem 0.7rem;
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          background: transparent; color: var(--text-muted);
          font-size: 0.775rem; cursor: pointer;
          transition: all 150ms;
        }
        .cm-btn:hover { border-color: var(--text-secondary); color: var(--text-primary); }

        .cm-btn--approve { color: #065f46; border-color: #10b98155; background: #d1fae511; }
        .cm-btn--approve:hover { background: #d1fae5; }
        .cm-btn--reject  { color: #991b1b; border-color: #ef444455; background: #fee2e211; }
        .cm-btn--reject:hover  { background: #fee2e2; }

        .cm-btn--delete  { color: #b45309; border-color: #f59e0b55; }
        .cm-btn--delete:hover  { background: #fef3c7; color: #92400e; }

        .cm-btn--restore { color: #065f46; border-color: #10b98155; background: #d1fae511; font-weight: 500; }
        .cm-btn--restore:hover { background: #d1fae5; }
        .cm-btn--permanent { color: #991b1b; border-color: #ef444455; }
        .cm-btn--permanent:hover { background: #fee2e2; }

        .dark .cm-btn--approve  { color: #34d399; background: #065f4611; }
        .dark .cm-btn--approve:hover  { background: #065f4633; }
        .dark .cm-btn--reject   { color: #f87171; background: #7f1d1d11; }
        .dark .cm-btn--reject:hover   { background: #7f1d1d33; }
        .dark .cm-btn--delete   { color: #fbbf24; border-color: #f59e0b44; }
        .dark .cm-btn--delete:hover   { background: #45190333; }
        .dark .cm-btn--restore  { color: #34d399; background: #065f4611; }
        .dark .cm-btn--restore:hover  { background: #065f4633; }
        .dark .cm-btn--permanent { color: #f87171; }
        .dark .cm-btn--permanent:hover { background: #7f1d1d33; }
      `}</style>
    </div>
  );
}
