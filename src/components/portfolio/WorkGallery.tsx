"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

interface GalleryImage {
  id: string;
  url: string;
}

interface Props {
  images: GalleryImage[];
  title: string;
  headingLabel: string;
  dir?: "rtl" | "ltr";
}

export default function WorkGallery({ images, title, headingLabel, dir = "rtl" }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(() =>
    setLightboxIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length]);
  const next = useCallback(() =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") dir === "rtl" ? next() : prev();
      else if (e.key === "ArrowRight") dir === "rtl" ? prev() : next();
      else if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, close, prev, next, dir]);

  if (images.length === 0) return null;

  const current = lightboxIndex !== null ? images[lightboxIndex] : null;

  return (
    <>
      <div className="wg-section" dir={dir}>
        <h2 className="wg-heading">{headingLabel}</h2>
        <div className="wg-grid">
          {images.map((img, i) => (
            <button
              key={img.id}
              className="wg-item"
              onClick={() => setLightboxIndex(i)}
              aria-label={`${title} — ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={`${title} — ${i + 1}`}
                fill
                className="wg-img"
                sizes="(max-width: 640px) 50vw, 400px"
              />
            </button>
          ))}
        </div>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────────── */}
      {current && lightboxIndex !== null && (
        <div className="lb-backdrop" onClick={close} role="dialog" aria-modal="true">
          {/* Image container — stop click propagation so clicking the image itself doesn't close */}
          <div className="lb-frame" onClick={(e) => e.stopPropagation()}>
            <Image
              src={current.url}
              alt={`${title} — ${lightboxIndex + 1}`}
              fill
              className="lb-img"
              sizes="100vw"
              priority
            />
          </div>

          {/* Controls */}
          <button className="lb-close" onClick={close} aria-label="إغلاق">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M15 5L5 15M5 5l10 10" />
            </svg>
          </button>

          {images.length > 1 && (
            <>
              <button
                className="lb-arrow lb-arrow--prev"
                onClick={(e) => { e.stopPropagation(); dir === "rtl" ? next() : prev(); }}
                aria-label="السابقة"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                className="lb-arrow lb-arrow--next"
                onClick={(e) => { e.stopPropagation(); dir === "rtl" ? prev() : next(); }}
                aria-label="التالية"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>

              {/* Counter */}
              <div className="lb-counter">
                {lightboxIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        /* ── Gallery grid ── */
        .wg-section { margin-bottom: 3rem; }

        .wg-heading {
          font-family: var(--font-heading);
          font-weight: 400;
          color: var(--text-muted);
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-size: 0.75rem;
        }

        .wg-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 0.75rem;
        }

        @media (max-width: 640px) {
          .wg-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .wg-item {
          position: relative;
          aspect-ratio: 4/3;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--bg-secondary);
          border: none;
          padding: 0;
          cursor: zoom-in;
        }

        .wg-img {
          object-fit: cover;
          transition: transform 500ms ease;
        }
        .wg-item:hover .wg-img { transform: scale(1.04); }

        /* ── Lightbox ── */
        .lb-backdrop {
          position: fixed;
          inset: 0;
          z-index: 300;
          background: rgba(0, 0, 0, 0.92);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: zoom-out;
        }

        .lb-frame {
          position: relative;
          width: min(90vw, 90vh * 1.6);
          height: min(90vh, 90vw * 0.7);
          max-width: 1200px;
          cursor: default;
        }

        .lb-img {
          object-fit: contain;
        }

        .lb-close {
          position: fixed;
          top: 1.25rem;
          inset-inline-end: 1.25rem;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 200ms;
          z-index: 301;
        }
        .lb-close:hover { background: rgba(255,255,255,0.2); }

        .lb-arrow {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 200ms;
          z-index: 301;
        }
        .lb-arrow:hover { background: rgba(255,255,255,0.2); }
        .lb-arrow--prev { inset-inline-start: 1.25rem; }
        .lb-arrow--next { inset-inline-end: 1.25rem; }

        .lb-counter {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.8125rem;
          color: rgba(255,255,255,0.6);
          user-select: none;
          z-index: 301;
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </>
  );
}
