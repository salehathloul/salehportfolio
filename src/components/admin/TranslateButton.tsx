"use client";

import { useState } from "react";

interface Props {
  text: string;               // النص المصدر
  from: "ar" | "en";
  to: "ar" | "en";
  onResult: (translation: string) => void;
  disabled?: boolean;
}

export default function TranslateButton({ text, from, to, onResult, disabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleClick() {
    if (!text.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, from, to }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      onResult(data.translation as string);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "خطأ");
      setTimeout(() => setErr(null), 4000);
    } finally {
      setLoading(false);
    }
  }

  const label = to === "en" ? "→ EN" : "→ عربي";

  return (
    <span className="tl-wrap">
      <button
        type="button"
        className="tl-btn"
        onClick={handleClick}
        disabled={disabled || loading || !text.trim()}
        title={to === "en" ? "ترجم إلى الإنجليزية" : "ترجم إلى العربية"}
      >
        {loading ? (
          <span className="tl-spin" />
        ) : (
          <>
            <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 5h9M7 3v2M6 5c0 3 2 6 4 7M9 12c-2-1-4-3-4-7"/>
              <path d="M11 15l2-5 2 5M12.5 13.5h2"/>
            </svg>
            {label}
          </>
        )}
      </button>
      {err && <span className="tl-err">{err}</span>}
      <style>{`
        .tl-wrap { display: inline-flex; align-items: center; gap: 0.35rem; }
        .tl-btn {
          display: inline-flex; align-items: center; gap: 0.25rem;
          padding: 0.2rem 0.55rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-muted);
          font-size: 0.72rem; font-weight: 500;
          cursor: pointer; white-space: nowrap;
          transition: all 0.15s;
        }
        .tl-btn:hover:not(:disabled) {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          border-color: var(--text-muted);
        }
        .tl-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .tl-spin {
          display: inline-block; width: 10px; height: 10px;
          border: 1.5px solid currentColor; border-top-color: transparent;
          border-radius: 50%; animation: tl-rotate 0.7s linear infinite;
        }
        @keyframes tl-rotate { to { transform: rotate(360deg); } }
        .tl-err { font-size: 0.72rem; color: #ef4444; }
      `}</style>
    </span>
  );
}
