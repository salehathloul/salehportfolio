"use client";

import { useEffect, useState } from "react";

interface Props {
  code: string;
  initialCount: number;
  locale: "ar" | "en";
}

const LIKED_KEY = "liked_works";
const VISITOR_KEY = "visitor_id";

function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch { return "anon"; }
}

function isLiked(code: string): boolean {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    if (!raw) return false;
    return (JSON.parse(raw) as string[]).includes(code);
  } catch { return false; }
}

function persistLike(code: string, liked: boolean) {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (liked) { if (!list.includes(code)) list.push(code); }
    else { const i = list.indexOf(code); if (i !== -1) list.splice(i, 1); }
    localStorage.setItem(LIKED_KEY, JSON.stringify(list));
  } catch {}
}

export default function WorkLikeButton({ code, initialCount, locale }: Props) {
  const [liked,   setLiked]   = useState(false);
  const [count,   setCount]   = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [burst,   setBurst]   = useState(false);

  useEffect(() => { setLiked(isLiked(code)); }, [code]);

  async function handleLike() {
    if (loading) return;
    setLoading(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setCount(c => newLiked ? c + 1 : Math.max(0, c - 1));
    if (newLiked) setBurst(true);

    try {
      const res = await fetch(`/api/work-likes/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: getVisitorId() }),
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setCount(data.likesCount);
        persistLike(code, data.liked);
      } else {
        // revert
        setLiked(!newLiked);
        setCount(c => newLiked ? Math.max(0, c - 1) : c + 1);
      }
    } catch {
      setLiked(!newLiked);
      setCount(c => newLiked ? Math.max(0, c - 1) : c + 1);
    } finally {
      setLoading(false);
      setTimeout(() => setBurst(false), 600);
    }
  }

  const label = locale === "ar"
    ? (liked ? "إلغاء الإعجاب" : "إعجاب")
    : (liked ? "Unlike" : "Like");

  return (
    <>
      <button
        onClick={handleLike}
        disabled={loading}
        aria-label={label}
        title={label}
        className={`wlb-btn ${liked ? "wlb-btn--liked" : ""} ${burst ? "wlb-btn--burst" : ""}`}
      >
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {count > 0 && <span className="wlb-count">{count}</span>}
      </button>

      <style>{`
        .wlb-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.875rem;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: transparent;
          color: var(--text-muted);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s, background 0.2s;
          user-select: none;
          white-space: nowrap;
        }
        .wlb-btn:hover:not(:disabled) {
          color: #e05a5a;
          border-color: rgba(224,90,90,0.4);
        }
        .wlb-btn--liked {
          color: #e05a5a;
          border-color: rgba(224,90,90,0.4);
          background: rgba(224,90,90,0.06);
        }
        .wlb-btn--burst {
          animation: wlb-pop 0.38s cubic-bezier(0.36,0.07,0.19,0.97);
        }
        @keyframes wlb-pop {
          0%  { transform: scale(1); }
          35% { transform: scale(1.2); }
          65% { transform: scale(0.94); }
          100%{ transform: scale(1); }
        }
        .wlb-count {
          font-variant-numeric: tabular-nums;
          line-height: 1;
        }
        .wlb-btn:disabled { opacity: 0.65; cursor: default; }
      `}</style>
    </>
  );
}
