"use client";

import { useEffect, useState } from "react";
import { useVisitor } from "@/components/auth/VisitorContext";
import LoginModal from "@/components/auth/LoginModal";

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

const T = {
  ar: {
    title: "التعليقات",
    noComments: "لا توجد تعليقات بعد — كن أول من يعلّق.",
    loginPrompt: "سجّل دخولك للتعليق",
    loginBtn: "دخول",
    namePlaceholder: "اسمك *",
    emailPlaceholder: "بريدك الإلكتروني *",
    phonePlaceholder: "جوالك (اختياري)",
    contentPlaceholder: "اكتب تعليقك...",
    submit: "إرسال التعليق",
    submitting: "جاري الإرسال...",
    successMsg: "تم إرسال تعليقك بنجاح.",
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
    loginPrompt: "Sign in to leave a comment",
    loginBtn: "Sign in",
    namePlaceholder: "Your name *",
    emailPlaceholder: "Your email *",
    phonePlaceholder: "Your phone (optional)",
    contentPlaceholder: "Write your comment...",
    submit: "Post Comment",
    submitting: "Submitting...",
    successMsg: "Your comment was submitted successfully.",
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
  const { visitor } = useVisitor();
  const [showLogin, setShowLogin] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

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
        body: JSON.stringify({
          postId,
          name: visitor?.name,
          email: visitor?.email,
          content,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? t.errorMsg);
      } else {
        const newComment: Comment = await res.json();
        setComments((prev) => [...prev, newComment]);
        setContent("");
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 4000);
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

      {/* Comment form / login prompt */}
      {visitor ? (
        <div className="cs-form-wrap">
          <div className="cs-visitor-row">
            <div className="cs-visitor-avatar">{visitor.name.charAt(0).toUpperCase()}</div>
            <span className="cs-visitor-name">{visitor.name}</span>
          </div>
          <form onSubmit={handleSubmit} className="cs-form">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.contentPlaceholder}
              required
              rows={3}
              className="cs-textarea"
              dir={dir}
            />
            {error && <p className="cs-error">{error}</p>}
            {submitted && <p className="cs-success">{t.successMsg}</p>}
            <button type="submit" disabled={submitting} className="cs-submit">
              {submitting ? t.submitting : t.submit}
            </button>
          </form>
        </div>
      ) : (
        <div className="cs-login-prompt">
          <p className="cs-login-text">{t.loginPrompt}</p>
          <button className="cs-login-btn" onClick={() => setShowLogin(true)}>
            {t.loginBtn}
          </button>
        </div>
      )}

      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} locale={locale} source="blog" />
      )}

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

        /* Visitor row (logged-in user header) */
        .cs-visitor-row {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          margin-bottom: 0.875rem;
        }

        .cs-visitor-avatar {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          border-radius: 50%;
          background: var(--text-primary);
          color: var(--bg-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8125rem;
          font-weight: 600;
          user-select: none;
        }

        .cs-visitor-name {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        /* Login prompt */
        .cs-login-prompt {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }

        .cs-login-text {
          flex: 1;
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .cs-login-btn {
          flex-shrink: 0;
          height: 34px;
          padding: 0 1.125rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: border-color var(--transition-fast), color var(--transition-fast);
          white-space: nowrap;
        }
        .cs-login-btn:hover {
          border-color: var(--text-secondary);
          color: var(--text-primary);
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

        .cs-error {
          font-size: 0.85rem;
          color: #e53e3e;
          margin: 0;
        }

        .cs-success {
          font-size: 0.85rem;
          color: #10b981;
          margin: 0;
        }

        .cs-submit {
          align-self: flex-start;
          padding: 0.6rem 1.5rem;
          background: var(--text-primary);
          color: var(--bg-primary);
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity var(--transition-fast);
        }
        .cs-submit:hover:not(:disabled) { opacity: 0.85; }
        .cs-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </section>
  );
}
