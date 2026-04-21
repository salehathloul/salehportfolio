"use client";

import { useEffect, useState } from "react";

interface Props {
  slug: string;
  initialCount: number;
  locale: "ar" | "en";
}

const LIKED_KEY = "liked_posts";
const VISITOR_KEY = "visitor_id";

function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

function isLiked(slug: string): boolean {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    if (!raw) return false;
    return (JSON.parse(raw) as string[]).includes(slug);
  } catch {
    return false;
  }
}

function setLiked(slug: string, liked: boolean) {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (liked) {
      if (!list.includes(slug)) list.push(slug);
    } else {
      const idx = list.indexOf(slug);
      if (idx !== -1) list.splice(idx, 1);
    }
    localStorage.setItem(LIKED_KEY, JSON.stringify(list));
  } catch {}
}

export default function LikeButton({ slug, initialCount, locale }: Props) {
  const [liked, setLikedState] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    setLikedState(isLiked(slug));
  }, [slug]);

  async function handleLike() {
    if (loading) return;
    setLoading(true);

    const newLiked = !liked;
    // Optimistic update
    setLikedState(newLiked);
    setCount((c) => newLiked ? c + 1 : Math.max(0, c - 1));
    if (newLiked) setBurst(true);

    try {
      const visitorId = getVisitorId();
      const res = await fetch(`/api/blog-likes/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      });
      if (res.ok) {
        const data = await res.json();
        setLikedState(data.liked);
        setCount(data.likesCount);
        setLiked(slug, data.liked);
      } else {
        // Revert on error
        setLikedState(!newLiked);
        setCount((c) => newLiked ? Math.max(0, c - 1) : c + 1);
      }
    } catch {
      setLikedState(!newLiked);
      setCount((c) => newLiked ? Math.max(0, c - 1) : c + 1);
    } finally {
      setLoading(false);
      setTimeout(() => setBurst(false), 600);
    }
  }

  return (
    <div className="lb-wrap">
      <button
        onClick={handleLike}
        disabled={loading}
        aria-label={locale === "ar" ? (liked ? "إلغاء الإعجاب" : "إعجاب") : (liked ? "Unlike" : "Like")}
        className={`lb-btn ${liked ? "lb-btn--liked" : ""} ${burst ? "lb-btn--burst" : ""}`}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lb-icon"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span className="lb-count">{count > 0 ? count : ""}</span>
      </button>

      <style>{`
        .lb-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 2.5rem 0 1rem;
        }

        .lb-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.125rem;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: transparent;
          color: var(--text-muted);
          font-size: 0.875rem;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s, background 0.2s, transform 0.15s;
          user-select: none;
        }

        .lb-btn:hover:not(:disabled) {
          color: #e05a5a;
          border-color: #e05a5a66;
        }

        .lb-btn--liked {
          color: #e05a5a;
          border-color: #e05a5a66;
          background: #e05a5a0d;
        }

        .lb-btn--burst {
          animation: lb-pop 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
        }

        @keyframes lb-pop {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.18); }
          60%  { transform: scale(0.95); }
          100% { transform: scale(1); }
        }

        .lb-icon {
          flex-shrink: 0;
          transition: fill 0.2s, stroke 0.2s;
        }

        .lb-count {
          font-variant-numeric: tabular-nums;
          min-width: 1ch;
          line-height: 1;
        }

        .lb-btn:disabled { opacity: 0.7; cursor: default; }
      `}</style>
    </div>
  );
}
