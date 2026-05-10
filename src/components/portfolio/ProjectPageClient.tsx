"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ProjectImage {
  id: string;
  url: string;
  captionAr: string | null;
  captionEn: string | null;
  width: number;
  height: number;
}

interface Props {
  images: ProjectImage[];
  locale: "ar" | "en";
}

export default function ProjectPageClient({ images, locale }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Keyboard nav + ESC
  useEffect(() => {
    if (lightbox === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft")  setLightbox(i => i !== null && i > 0 ? i - 1 : i);
      if (e.key === "ArrowRight") setLightbox(i => i !== null && i < images.length - 1 ? i + 1 : i);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, images.length]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = lightbox !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  const active = lightbox !== null ? images[lightbox] : null;

  return (
    <>
      {/* ── Stacked images ── */}
      <div className="pp-stack" dir={locale === "ar" ? "rtl" : "ltr"}>
        {images.map((img, i) => {
          const caption = locale === "ar" ? img.captionAr : img.captionEn;
          const aspectRatio = img.width > 0 && img.height > 0
            ? img.width / img.height
            : 3 / 2;

          return (
            <figure key={img.id} className="pp-figure">
              <div
                className="pp-img-wrap"
                style={{ aspectRatio: String(aspectRatio) }}
                onClick={() => setLightbox(i)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && setLightbox(i)}
                aria-label={locale === "ar" ? "عرض الصورة بالحجم الكامل" : "View fullscreen"}
              >
                <Image
                  src={img.url}
                  alt={caption ?? ""}
                  fill
                  className="pp-img"
                  sizes="(max-width: 768px) 100vw, 860px"
                  loading={i < 2 ? "eager" : "lazy"}
                />
                {/* Zoom hint */}
                <span className="pp-zoom-hint" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                    <circle cx="7.5" cy="7.5" r="5.5" />
                    <path d="M11.5 11.5L16 16M5.5 7.5h4M7.5 5.5v4" />
                  </svg>
                </span>

                {/* Index number */}
                <span className="pp-index">{i + 1}</span>
              </div>

              {caption && (
                <figcaption className="pp-caption">{caption}</figcaption>
              )}
            </figure>
          );
        })}
      </div>

      {/* ── Lightbox ── */}
      {active && (
        <div className="pp-lb" onClick={() => setLightbox(null)}>
          <div
            className="pp-lb-img-wrap"
            onClick={e => e.stopPropagation()}
            style={{
              aspectRatio: active.width > 0 && active.height > 0
                ? `${active.width} / ${active.height}`
                : "3/2",
            }}
          >
            <Image
              src={active.url}
              alt=""
              fill
              className="pp-lb-img"
              sizes="100vw"
              priority
            />
          </div>

          {/* Close */}
          <button className="pp-lb-close" onClick={() => setLightbox(null)} aria-label="إغلاق">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M15 5L5 15M5 5l10 10" />
            </svg>
          </button>

          {/* Prev */}
          {lightbox !== null && lightbox > 0 && (
            <button className="pp-lb-nav pp-lb-prev" onClick={e => { e.stopPropagation(); setLightbox(l => l !== null ? l - 1 : l); }} aria-label="السابق">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M13 4l-7 6 7 6" />
              </svg>
            </button>
          )}

          {/* Next */}
          {lightbox !== null && lightbox < images.length - 1 && (
            <button className="pp-lb-nav pp-lb-next" onClick={e => { e.stopPropagation(); setLightbox(l => l !== null ? l + 1 : l); }} aria-label="التالي">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M7 4l7 6-7 6" />
              </svg>
            </button>
          )}

          {/* Counter */}
          {lightbox !== null && (
            <div className="pp-lb-counter">{lightbox + 1} / {images.length}</div>
          )}
        </div>
      )}

      <style>{`
        /* ── Stacked images ── */
        .pp-stack {
          display: flex;
          flex-direction: column;
          gap: 4rem;
        }

        .pp-figure {
          margin: 0;
        }

        .pp-img-wrap {
          position: relative;
          width: 100%;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--bg-secondary);
          cursor: zoom-in;
        }

        .pp-img {
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.22,1,0.36,1);
        }

        .pp-img-wrap:hover .pp-img {
          transform: scale(1.015);
        }

        /* Zoom hint */
        .pp-zoom-hint {
          position: absolute;
          bottom: 0.875rem;
          inset-inline-end: 0.875rem;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.45);
          border-radius: 50%;
          color: rgba(255,255,255,0.85);
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
          backdrop-filter: blur(4px);
        }
        .pp-img-wrap:hover .pp-zoom-hint { opacity: 1; }

        /* Image index number */
        .pp-index {
          position: absolute;
          top: 0.875rem;
          inset-inline-start: 0.875rem;
          font-size: 0.65rem;
          color: rgba(255,255,255,0.4);
          letter-spacing: 0.06em;
          pointer-events: none;
        }

        /* Caption */
        .pp-caption {
          margin-top: 0.75rem;
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.6;
          padding-inline-start: 0.25rem;
          border-inline-start: 2px solid var(--border-subtle);
          padding-inline-start: 0.75rem;
        }

        /* ── Lightbox ── */
        .pp-lb {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0,0,0,0.97);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: zoom-out;
          animation: pp-fade 0.2s ease;
        }

        @keyframes pp-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .pp-lb-img-wrap {
          position: relative;
          max-width: min(92vw, 1200px);
          max-height: 92vh;
          width: 100%;
          cursor: default;
          animation: pp-scale 0.25s cubic-bezier(0.22,1,0.36,1);
        }

        @keyframes pp-scale {
          from { transform: scale(0.96); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }

        .pp-lb-img { object-fit: contain; }

        .pp-lb-close {
          position: fixed;
          top: 1rem;
          inset-inline-end: 1rem;
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.1);
          border: none; border-radius: 50%;
          color: rgba(255,255,255,0.8);
          cursor: pointer;
          transition: background 0.2s;
          z-index: 10;
        }
        .pp-lb-close:hover { background: rgba(255,255,255,0.2); }

        .pp-lb-nav {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.08);
          border: none; border-radius: 50%;
          color: rgba(255,255,255,0.75);
          cursor: pointer;
          transition: background 0.2s;
          z-index: 10;
        }
        .pp-lb-nav:hover { background: rgba(255,255,255,0.18); color: #fff; }
        .pp-lb-prev { inset-inline-start: 1.25rem; }
        .pp-lb-next { inset-inline-end: 1.25rem; }

        .pp-lb-counter {
          position: fixed;
          bottom: 1.25rem;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.72rem;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.08em;
          user-select: none;
        }

        @media (max-width: 640px) {
          .pp-stack { gap: 2.5rem; }
          .pp-lb-nav { width: 36px; height: 36px; }
          .pp-lb-prev { inset-inline-start: 0.5rem; }
          .pp-lb-next { inset-inline-end: 0.5rem; }
        }
      `}</style>
    </>
  );
}
