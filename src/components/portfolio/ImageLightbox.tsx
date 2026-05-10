"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export default function ImageLightbox({ src, alt, width, height }: Props) {
  const [open, setOpen] = useState(false);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Clickable hero wrapper */}
      <div
        className="ilb-trigger"
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
        aria-label="عرض الصورة بالحجم الكامل"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="ilb-hero-img"
          sizes="(max-width: 768px) 100vw, 1200px"
          priority
        />
        {/* Zoom hint */}
        <span className="ilb-zoom-hint" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="7.5" cy="7.5" r="5.5" />
            <path d="M11.5 11.5L16 16" />
            <path d="M5.5 7.5h4M7.5 5.5v4" />
          </svg>
        </span>
      </div>

      {/* Lightbox overlay */}
      {open && (
        <div className="ilb-backdrop" onClick={() => setOpen(false)}>
          <div className="ilb-img-wrap" onClick={(e) => e.stopPropagation()}>
            <Image
              src={src}
              alt={alt}
              fill
              className="ilb-full-img"
              sizes="100vw"
              priority
            />
          </div>

          {/* Close button */}
          <button
            className="ilb-close"
            onClick={() => setOpen(false)}
            aria-label="إغلاق"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M15 5L5 15M5 5l10 10" />
            </svg>
          </button>
        </div>
      )}

      <style>{`
        /* ── Trigger ── */
        .ilb-trigger {
          position: relative;
          width: 100%;
          max-height: 80svh;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--bg-primary);
          cursor: zoom-in;
        }

        .ilb-hero-img { object-fit: contain; }

        /* Zoom hint badge — bottom-right corner */
        .ilb-zoom-hint {
          position: absolute;
          bottom: 0.75rem;
          inset-inline-end: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(0, 0, 0, 0.45);
          border-radius: 50%;
          color: rgba(255,255,255,0.8);
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
          backdrop-filter: blur(4px);
        }

        .ilb-trigger:hover .ilb-zoom-hint { opacity: 1; }

        /* ── Backdrop ── */
        .ilb-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.97);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: zoom-out;
          animation: ilb-fade-in 0.2s ease;
        }

        @keyframes ilb-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Full image ── */
        .ilb-img-wrap {
          position: relative;
          width: 100%;
          height: 100%;
          max-width: min(95vw, calc(95vh * ${width / height}));
          max-height: min(95vh, calc(95vw * ${height / width}));
          cursor: default;
          animation: ilb-scale-in 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes ilb-scale-in {
          from { transform: scale(0.96); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }

        .ilb-full-img { object-fit: contain; }

        /* ── Close button ── */
        .ilb-close {
          position: fixed;
          top: 1rem;
          inset-inline-end: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.1);
          border: none;
          border-radius: 50%;
          color: rgba(255,255,255,0.8);
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          z-index: 10;
        }
        .ilb-close:hover { background: rgba(255,255,255,0.2); color: #fff; }
      `}</style>
    </>
  );
}
