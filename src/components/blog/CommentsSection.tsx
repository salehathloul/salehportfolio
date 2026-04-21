"use client";

import { useEffect, useState } from "react";

interface Comment {
  id: string;
  name: string;
  content: string;
  createdAt: string;
}

interface Props {
  postId: string;
  locale: "ar" | "en";
}

const STORAGE_KEY = "comment_author";

const T = {
  ar: {
    title: "التعليقات",
    noComments: "لا توجد تعليقات بعد — كن أول من يعلّق.",
    namePlaceholder: "اسمك *",
    emailPlaceholder: "بريدك الإلكتروني *",
    contentPlaceholder: "اكتب تعليقك...",
    rememberMe: "تذكّرني",
    submit: "إرسال التعليق",
    submitting: "جاري الإرسال...",
    successMsg: "تم إرسال تعليقك وسيظهر بعد المراجعة.",
    errorMsg: "فشل إرسال التعليق. حاول مرة أخرى.",
    formTitle: "أضف تعليقاً",
    ago: (d: Date) => {
      const diff = (Date.now() - d.getTime()) / 1000;
      if (diff < 60) return "للتو";
      if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
      if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
      return d.toLocaleDateString("ar-SA");
    },
  },
  en: {
    title: "Comments",
    noComments: "No comments yet — be the first to comment.",
    namePlaceholder: "Your name *",
    emailPlaceholder: "Your email *",
    contentPlaceholder: "Write your comment...",
    rememberMe: "Remember me",
    submit: "Post Comment",
    submitting: "Submitting...",
    successMsg: "Comment submitted and will appear after review.",
    errorMsg: "Failed to submit. Please try again.",
    formTitle: "Leave a Comment",
    ago: (d: Date) => {
      const diff = (Date.now() - d.getTime()) / 1000;
      if (diff < 60) return "just now";
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    },
  },
};

export default function CommentsSection({ postId, locale }: Props) {
  const t = T[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Load saved author from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { name: n, email: e } = JSON.parse(saved);
        if (n) setName(n);
        if (e) setEmail(e);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetch(`/api/comments?postId=${postId}`)
      .then((r) => r.json())
      .then((data) => { setComments(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, name, email, content }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? t.errorMsg);
      } else {
        // Save author to localStorage if rememberMe is checked
        if (rememberMe) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, email }));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
        setContent("");
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch {
      setError(t.errorMsg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="cs-section" dir={dir}>
      <div className="cs-header">
        <h2 className="cs-title">{t.title}</h2>
        {!loading && <span className="cs-count">{comments.length}</span>}
      </div>

      {/* Comment list */}
      {loading ? (
        <div className="cs-loading" />
      ) : comments.length === 0 ? (
        <p className="cs-empty">{t.noComments}</p>
      ) : (
        <div className="cs-list">
          {comments.map((c) => (
            <div key={c.id} className="cs-item">
              <div className="cs-avatar">{c.name.charAt(0).toUpperCase()}</div>
              <div className="cs-body">
                <div className="cs-meta">
                  <span className="cs-name">{c.name}</span>
                  <span className="cs-time">{t.ago(new Date(c.createdAt))}</span>
                </div>
                <p className="cs-text">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment form */}
      <div className="cs-form-wrap">
        <p className="cs-form-title">{t.formTitle}</p>
        {submitted ? (
          <p className="cs-success">{t.successMsg}</p>
        ) : (
          <form onSubmit={handleSubmit} className="cs-form">
            <div className="cs-fields-row">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePlaceholder}
                required
                className="cs-input"
                dir={dir}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
                className="cs-input"
                dir="ltr"
              />
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.contentPlaceholder}
              required
              rows={3}
              className="cs-textarea"
              dir={dir}
            />
            <div className="cs-footer-row">
              <label className="cs-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="cs-checkbox"
                />
                <span>{t.rememberMe}</span>
              </label>
              <div className="cs-form-actions">
                {error && <p className="cs-error">{error}</p>}
                <button type="submit" disabled={submitting} className="cs-submit">
                  {submitting ? t.submitting : t.submit}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <style>{`
        .cs-section {
          margin-top: 5rem;
          padding-top: 3rem;
          border-top: 1px solid var(--border);
        }

        .cs-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .cs-title {
          font-family: var(--font-heading);
          font-size: clamp(1.2rem, 2.5vw, 1.5rem);
          font-weight: 400;
          color: var(--text-primary);
          margin: 0;
        }

        .cs-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          height: 24px;
          padding: 0 6px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 999px;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .cs-loading {
          height: 2px;
          background: var(--border);
          border-radius: 999px;
          animation: cs-pulse 1.2s ease-in-out infinite;
          margin-bottom: 2rem;
        }
        @keyframes cs-pulse { 0%,100%{opacity:.4} 50%{opacity:1} }

        .cs-empty {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-bottom: 2rem;
        }

        .cs-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .cs-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .cs-avatar {
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          border-radius: 50%;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          user-select: none;
        }

        .cs-body { flex: 1; min-width: 0; }

        .cs-meta {
          display: flex;
          align-items: baseline;
          gap: 0.625rem;
          margin-bottom: 0.3rem;
        }

        .cs-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .cs-time {
          font-size: 0.75rem;
          color: var(--text-subtle);
        }

        .cs-text {
          font-size: 0.9375rem;
          color: var(--text-secondary);
          line-height: 1.7;
          white-space: pre-line;
          margin: 0;
        }

        /* Form */
        .cs-form-wrap {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 1.5rem;
        }

        .cs-form-title {
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0 0 1.25rem;
        }

        .cs-form { display: flex; flex-direction: column; gap: 0.75rem; }

        .cs-fields-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        @media (max-width: 600px) {
          .cs-fields-row { grid-template-columns: 1fr; }
        }

        .cs-input, .cs-textarea {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.9rem;
          font-family: inherit;
          outline: none;
          transition: border-color var(--transition-fast);
          box-sizing: border-box;
        }
        .cs-input:focus, .cs-textarea:focus { border-color: var(--text-primary); }
        .cs-input::placeholder, .cs-textarea::placeholder { color: var(--text-subtle); }

        .cs-textarea { resize: vertical; min-height: 100px; line-height: 1.6; }

        .cs-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .cs-remember {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8125rem;
          color: var(--text-muted);
          cursor: pointer;
          user-select: none;
        }

        .cs-checkbox {
          width: 14px;
          height: 14px;
          accent-color: var(--text-primary);
          cursor: pointer;
          flex-shrink: 0;
        }

        .cs-form-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .cs-error {
          font-size: 0.85rem;
          color: #e53e3e;
          margin: 0;
        }

        .cs-success {
          font-size: 0.875rem;
          color: #10b981;
          margin: 0;
          padding: 0.75rem 0;
        }

        .cs-submit {
          flex-shrink: 0;
          padding: 0.6rem 1.5rem;
          background: var(--text-primary);
          color: var(--bg-primary);
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity var(--transition-fast);
          white-space: nowrap;
        }
        .cs-submit:hover:not(:disabled) { opacity: 0.85; }
        .cs-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </section>
  );
}
