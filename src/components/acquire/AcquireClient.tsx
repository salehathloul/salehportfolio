"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AcquireSize {
  id: string;
  label: string;
  totalEditions: number;
  soldEditions: number;
}

interface WorkImage {
  id: string;
  url: string;
  order: number;
}

interface AcquireSpec {
  labelAr: string;
  labelEn: string;
  value: string;
}

interface AcquireItem {
  id: string;
  isActive: boolean;
  specs?: AcquireSpec[] | null;
  sizes: AcquireSize[];
  work: {
    id: string;
    code: string;
    titleAr: string;
    titleEn: string;
    locationAr: string | null;
    locationEn: string | null;
    descriptionAr: string | null;
    descriptionEn: string | null;
    imageUrl: string;
    width: number;
    height: number;
    images: WorkImage[];
  };
}

interface Props {
  items: AcquireItem[];
}

// ── Form schema ───────────────────────────────────────────────────────────────

function buildSchema(isAr: boolean) {
  return z.object({
    sizeId: z.string().min(1, isAr ? "اختر مقاساً" : "Select a size"),
    customerName: z.string().min(2, isAr ? "الاسم مطلوب" : "Name is required"),
    customerEmail: z.string().email(isAr ? "بريد إلكتروني غير صحيح" : "Invalid email"),
    customerPhone: z.string().min(9, isAr ? "رقم الجوال مطلوب" : "Phone is required"),
    message: z.string().optional(),
  });
}

type FormValues = {
  sizeId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message?: string;
};

// ── Lightbox — rendered at root level to avoid transform stacking issues ──────

function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")  setCurrent((c) => (c > 0 ? c - 1 : images.length - 1));
      if (e.key === "ArrowRight") setCurrent((c) => (c < images.length - 1 ? c + 1 : 0));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, images.length]);

  return (
    <>
      {/* Overlay */}
      <motion.div
        className="lb-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Image — uses its own fixed wrapper (NOT inside motion.div with transform) */}
      <div className="lb-stage">
        <button className="lb-close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M14 4L4 14M4 4l10 10" />
          </svg>
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="lb-img-wrap"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            <Image src={images[current]} alt="" fill className="lb-img" sizes="100vw" priority />
          </motion.div>
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button
              className="lb-nav lb-nav--prev"
              onClick={() => setCurrent((c) => (c > 0 ? c - 1 : images.length - 1))}
              aria-label="Previous"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M12 4l-6 6 6 6" />
              </svg>
            </button>
            <button
              className="lb-nav lb-nav--next"
              onClick={() => setCurrent((c) => (c < images.length - 1 ? c + 1 : 0))}
              aria-label="Next"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 4l6 6-6 6" />
              </svg>
            </button>
            <div className="lb-dots">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`lb-dot ${i === current ? "lb-dot--active" : ""}`}
                  onClick={() => setCurrent(i)}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        .lb-overlay {
          position: fixed; inset: 0; z-index: 70;
          background: rgba(0,0,0,0.93);
          backdrop-filter: blur(4px);
        }
        .lb-stage {
          position: fixed; inset: 0; z-index: 71;
          pointer-events: none;
        }
        .lb-close {
          position: absolute; top: 1.25rem; right: 1.25rem;
          width: 40px; height: 40px;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          border-radius: 50%; cursor: pointer; color: #fff;
          display: flex; align-items: center; justify-content: center;
          pointer-events: all;
          transition: background 150ms;
        }
        .lb-close:hover { background: rgba(255,255,255,0.2); }
        .lb-img-wrap {
          position: absolute; inset: 3.5rem;
          pointer-events: all;
        }
        .lb-img { object-fit: contain; }
        .lb-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 44px; height: 44px;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          border-radius: 50%; cursor: pointer; color: #fff;
          display: flex; align-items: center; justify-content: center;
          pointer-events: all;
          transition: background 150ms;
        }
        .lb-nav:hover { background: rgba(255,255,255,0.22); }
        .lb-nav--prev { left: 1rem; }
        .lb-nav--next { right: 1rem; }
        .lb-dots {
          position: absolute; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
          display: flex; gap: 0.5rem; pointer-events: all;
        }
        .lb-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: rgba(255,255,255,0.35); border: none; cursor: pointer;
          transition: background 150ms, transform 150ms;
        }
        .lb-dot--active { background: #fff; transform: scale(1.3); }
      `}</style>
    </>
  );
}

// ── Item Detail Modal — full-screen view with image carousel ──────────────────

function ItemDetailModal({
  item,
  onClose,
  onRequest,
}: {
  item: AcquireItem;
  onClose: () => void;
  onRequest: () => void;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("acquire");

  const title       = isAr ? item.work.titleAr : item.work.titleEn;
  const location    = isAr ? item.work.locationAr : item.work.locationEn;
  const description = isAr ? item.work.descriptionAr : item.work.descriptionEn;
  const dir         = isAr ? "rtl" as const : "ltr" as const;

  const allImages = [item.work.imageUrl, ...item.work.images.map((img) => img.url)];
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const availSizes = item.sizes.filter((s) => s.soldEditions < s.totalEditions);
  const hasStock   = availSizes.length > 0;

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Keyboard nav
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")  setCurrent((c) => (c > 0 ? c - 1 : allImages.length - 1));
      if (e.key === "ArrowRight") setCurrent((c) => (c < allImages.length - 1 ? c + 1 : 0));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, allImages.length]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="dm-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Close button — fixed top-right of viewport */}
      <button className="dm-close" onClick={onClose} aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M13 3L3 13M3 3l10 10" />
        </svg>
      </button>

      {/* Panel — centered via flex wrapper, not CSS transform */}
      <div className="dm-center">
        <motion.div
          className="dm-panel"
          role="dialog"
          aria-modal="true"
          dir={dir}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="dm-layout">
            {/* ── Left: image carousel ── */}
            <div className="dm-gallery">
              {/* Main image */}
              <div
                className="dm-main-img-wrap"
                onClick={() => setLightboxOpen(true)}
                style={{ cursor: "zoom-in" }}
                title={isAr ? "عرض بحجم كامل" : "View full size"}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current}
                    className="dm-main-img-inner"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Image
                      src={allImages[current]}
                      alt={title}
                      fill
                      className="dm-main-img"
                      sizes="(max-width: 768px) 100vw, 55vw"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Prev / Next overlays */}
                {allImages.length > 1 && (
                  <>
                    <button
                      className="dm-img-nav dm-img-nav--prev"
                      onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c > 0 ? c - 1 : allImages.length - 1)); }}
                      aria-label="Previous"
                    >
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M12 4l-6 6 6 6" />
                      </svg>
                    </button>
                    <button
                      className="dm-img-nav dm-img-nav--next"
                      onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c < allImages.length - 1 ? c + 1 : 0)); }}
                      aria-label="Next"
                    >
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M8 4l6 6-6 6" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Counter badge */}
                {allImages.length > 1 && (
                  <div className="dm-img-counter">
                    {current + 1} / {allImages.length}
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {allImages.length > 1 && (
                <div className="dm-thumbs">
                  {allImages.map((url, i) => (
                    <button
                      key={i}
                      className={`dm-thumb ${i === current ? "dm-thumb--active" : ""}`}
                      onClick={() => setCurrent(i)}
                      aria-label={`Image ${i + 1}`}
                    >
                      <Image src={url} alt="" fill className="dm-thumb-img" sizes="72px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Right: info + sizes + button ── */}
            <div className="dm-info">
              <div className="dm-info-top">
                <span className="dm-code">{item.work.code}</span>
                <h2 className="dm-title">{title}</h2>
                {location && <p className="dm-location">{location}</p>}
                {description && <p className="dm-description">{description}</p>}
              </div>

              {/* Specs */}
              {item.specs && item.specs.length > 0 && (
                <div className="dm-specs">
                  <p className="dm-specs-label">{t("specifications")}</p>
                  <div className="dm-specs-list">
                    {item.specs.map((spec, i) => (
                      <div key={i} className="dm-spec-row">
                        <span className="dm-spec-key">{isAr ? spec.labelAr : spec.labelEn}</span>
                        <span className="dm-spec-val">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              <div className="dm-sizes">
                <p className="dm-sizes-label">{t("availableSizes")}</p>
                {item.sizes.map((size) => {
                  const rem  = size.totalEditions - size.soldEditions;
                  const sold = rem <= 0;
                  // Show "سم" in Arabic locale instead of "cm"
                  const displayLabel = isAr ? size.label.replace(/\bcm\b/gi, "سم") : size.label;
                  return (
                    <div key={size.id} className={`dm-size-row ${sold ? "dm-size-row--sold" : ""}`}>
                      <span className="dm-size-name">{displayLabel}</span>
                      <span className="dm-size-rem">
                        {sold
                          ? t("soldOut")
                          : isAr
                            ? `${rem} / ${size.totalEditions} ${t("editions")}`
                            : `${rem} / ${size.totalEditions} ${t("editions")}`
                        }
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <button
                className={`dm-cta ${!hasStock ? "dm-cta--sold" : ""}`}
                onClick={() => { if (hasStock) { onClose(); onRequest(); } }}
                disabled={!hasStock}
              >
                {hasStock ? t("requestAcquire") : t("soldOut")}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Lightbox for full-screen zoom */}
      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox
            images={allImages}
            startIndex={current}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>

      <style>{`
        .dm-overlay {
          position: fixed; inset: 0; z-index: 55;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(3px);
        }

        /* Centering wrapper — NO transform conflict with Framer Motion */
        .dm-center {
          position: fixed; inset: 0; z-index: 56;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          pointer-events: none;
        }

        .dm-panel {
          pointer-events: all;
          position: relative;
          background: var(--bg-primary);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 900px;
          max-height: calc(100svh - 2rem);
          overflow-y: auto;
          box-shadow: 0 32px 80px rgba(0,0,0,0.25);
        }

        .dm-close {
          position: fixed;
          top: 1rem;
          right: 1rem;
          width: 40px; height: 40px;
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: var(--radius-md);
          background: rgba(20,20,20,0.75);
          backdrop-filter: blur(8px);
          cursor: pointer;
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          transition: all var(--transition-fast);
          z-index: 70;
          flex-shrink: 0;
        }
        .dm-close:hover { background: rgba(40,40,40,0.9); border-color: rgba(255,255,255,0.3); }

        .dm-layout {
          display: grid;
          grid-template-columns: 55fr 45fr;
          min-height: 400px;
        }

        @media (max-width: 640px) {
          .dm-layout { grid-template-columns: 1fr; }
        }

        /* Gallery side */
        .dm-gallery {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1.25rem;
        }

        .dm-main-img-wrap {
          position: relative;
          aspect-ratio: 4/3;
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .dm-main-img-inner {
          position: absolute; inset: 0;
        }

        .dm-main-img { object-fit: cover; }

        .dm-img-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 36px; height: 36px;
          background: rgba(0,0,0,0.45); border: none;
          border-radius: 50%; color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 150ms;
          z-index: 2;
        }
        .dm-img-nav:hover { background: rgba(0,0,0,0.65); }
        .dm-img-nav--prev { left: 0.6rem; }
        .dm-img-nav--next { right: 0.6rem; }

        .dm-img-counter {
          position: absolute; bottom: 0.6rem; left: 50%; transform: translateX(-50%);
          background: rgba(0,0,0,0.5); color: #fff;
          font-size: 0.72rem; padding: 0.2rem 0.55rem;
          border-radius: 999px; letter-spacing: 0.04em;
        }

        /* Thumbnails */
        .dm-thumbs {
          display: flex; gap: 0.5rem; flex-wrap: wrap;
        }

        .dm-thumb {
          position: relative;
          width: 60px; height: 60px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          background: var(--bg-secondary);
          padding: 0;
          transition: border-color var(--transition-fast);
          flex-shrink: 0;
        }
        .dm-thumb--active { border-color: var(--text-primary); }
        .dm-thumb-img { object-fit: cover; }

        /* Info side */
        .dm-info {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding: 2rem 1.5rem 1.5rem;
          border-inline-start: 1px solid var(--border-subtle);
        }

        @media (max-width: 640px) {
          .dm-info { border-inline-start: none; border-top: 1px solid var(--border-subtle); padding: 1.25rem; }
        }

        .dm-info-top { display: flex; flex-direction: column; gap: 0.35rem; }

        .dm-code { font-size: 0.68rem; color: var(--text-subtle); letter-spacing: 0.08em; }

        .dm-title {
          font-family: var(--font-heading);
          font-size: 1.4rem; font-weight: 400;
          color: var(--text-primary); line-height: 1.25;
        }

        .dm-location { font-size: 0.78rem; color: var(--text-muted); }

        .dm-description {
          font-size: 0.85rem; color: var(--text-secondary);
          line-height: 1.65; margin-top: 0.25rem;
        }

        /* Specs */
        .dm-specs { display: flex; flex-direction: column; gap: 0.35rem; }
        .dm-specs-label {
          font-size: 0.72rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--text-muted); margin-bottom: 0.1rem;
        }
        .dm-specs-list { display: flex; flex-direction: column; }
        .dm-spec-row {
          display: flex; justify-content: space-between; align-items: baseline;
          padding: 0.35rem 0;
          border-bottom: 1px solid var(--border-subtle);
          gap: 1rem;
        }
        .dm-spec-key { font-size: 0.78rem; color: var(--text-muted); }
        .dm-spec-val { font-size: 0.8rem; color: var(--text-primary); font-weight: 500; text-align: end; }

        /* Sizes */
        .dm-sizes { display: flex; flex-direction: column; gap: 0.1rem; }

        .dm-sizes-label {
          font-size: 0.72rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--text-muted); margin-bottom: 0.35rem;
        }

        .dm-size-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border-subtle);
          font-size: 0.82rem;
        }

        .dm-size-name { color: var(--text-secondary); }
        .dm-size-rem  { color: var(--text-muted); font-size: 0.75rem; }

        .dm-size-row--sold .dm-size-name,
        .dm-size-row--sold .dm-size-rem {
          color: var(--text-subtle);
          text-decoration: line-through;
          text-decoration-color: var(--border);
        }

        /* CTA button */
        .dm-cta {
          width: 100%;
          padding: 0.875rem;
          background: var(--text-primary);
          color: var(--bg-primary);
          border: none; border-radius: var(--radius-md);
          font-size: 0.9rem; font-family: inherit;
          cursor: pointer;
          transition: opacity var(--transition-fast);
          margin-top: auto;
        }
        .dm-cta:hover:not(.dm-cta--sold) { opacity: 0.85; }
        .dm-cta--sold {
          background: var(--bg-tertiary); color: var(--text-subtle); cursor: not-allowed;
        }
      `}</style>
    </>
  );
}

// ── Order Modal — centered via flex wrapper to avoid transform conflicts ───────

function OrderModal({
  item,
  onClose,
}: {
  item: AcquireItem;
  onClose: () => void;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("acquire");
  const tForm = useTranslations("acquire.form");

  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const schema = buildSchema(isAr);

  const {
    register, handleSubmit, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { sizeId: "", customerName: "", customerEmail: "", customerPhone: "", message: "" },
  });

  const selectedSize = watch("sizeId");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const availableSizes = item.sizes.filter((s) => s.soldEditions < s.totalEditions);

  const onSubmit = async (data: FormValues) => {
    setServerError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acquireItemId: item.id, ...data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setServerError((err as { error?: string }).error || (isAr ? "حدث خطأ، يرجى المحاولة لاحقاً" : "Something went wrong"));
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError(isAr ? "فشل الاتصال بالخادم" : "Connection failed");
    }
  };

  const title = isAr ? item.work.titleAr : item.work.titleEn;
  const dir   = isAr ? "rtl" as const : "ltr" as const;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="om-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Centering wrapper — prevents Framer transform from displacing the modal */}
      <div className="om-center">
        <motion.div
          className="om-panel"
          role="dialog"
          aria-modal="true"
          dir={dir}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="om-head">
            <h2 className="om-head-title">{t("requestAcquire")}</h2>
            <button className="om-close" onClick={onClose} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M13 3L3 13M3 3l10 10" />
              </svg>
            </button>
          </div>

          {/* Work preview */}
          <div className="om-work">
            <div className="om-work-img-wrap">
              <Image src={item.work.imageUrl} alt={title} fill className="om-work-img" sizes="72px" />
            </div>
            <div className="om-work-info">
              <span className="om-work-code">{item.work.code}</span>
              <span className="om-work-title">{title}</span>
            </div>
          </div>

          {submitted ? (
            <motion.div
              className="om-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="om-success-icon">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="18" cy="18" r="15" />
                  <path d="M11 18l5 5 9-9" />
                </svg>
              </div>
              <p className="om-success-msg">{tForm("success")}</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="om-form" noValidate>
              <div className="om-field">
                <label className="om-label">{t("selectSize")}</label>
                <div className="om-sizes">
                  {availableSizes.map((size) => {
                    const rem = size.totalEditions - size.soldEditions;
                    return (
                      <label key={size.id} className={`om-size-opt ${selectedSize === size.id ? "om-size-opt--sel" : ""}`}>
                        <input
                          type="radio"
                          value={size.id}
                          {...register("sizeId")}
                          onChange={() => setValue("sizeId", size.id, { shouldValidate: true })}
                          className="sr-only"
                        />
                        <span className="om-size-label">{isAr ? size.label.replace(/\bcm\b/gi, "سم") : size.label}</span>
                        <span className="om-size-rem">{rem} {t("remaining")}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.sizeId && <p className="om-err">{errors.sizeId.message}</p>}
              </div>

              <div className="om-field">
                <label className="om-label" htmlFor="om-name">{tForm("name")}</label>
                <input id="om-name" type="text" placeholder={tForm("namePlaceholder")}
                  className={`om-input ${errors.customerName ? "om-input--err" : ""}`}
                  {...register("customerName")} />
                {errors.customerName && <p className="om-err">{errors.customerName.message}</p>}
              </div>

              <div className="om-field">
                <label className="om-label" htmlFor="om-email">{tForm("email")}</label>
                <input id="om-email" type="email" placeholder={tForm("emailPlaceholder")}
                  className={`om-input ${errors.customerEmail ? "om-input--err" : ""}`}
                  {...register("customerEmail")} />
                {errors.customerEmail && <p className="om-err">{errors.customerEmail.message}</p>}
              </div>

              <div className="om-field">
                <label className="om-label" htmlFor="om-phone">{tForm("phone")}</label>
                <input id="om-phone" type="tel" placeholder={tForm("phonePlaceholder")}
                  className={`om-input ${errors.customerPhone ? "om-input--err" : ""}`}
                  {...register("customerPhone")} />
                {errors.customerPhone && <p className="om-err">{errors.customerPhone.message}</p>}
              </div>

              <div className="om-field">
                <label className="om-label" htmlFor="om-msg">{tForm("message")}</label>
                <textarea id="om-msg" rows={3} placeholder={tForm("messagePlaceholder")}
                  className="om-input om-textarea"
                  {...register("message")} />
              </div>

              {serverError && <p className="om-server-err">{serverError}</p>}

              <button type="submit" disabled={isSubmitting} className="om-submit">
                {isSubmitting ? tForm("submitting") : tForm("submit")}
              </button>
            </form>
          )}
        </motion.div>
      </div>

      <style>{`
        .om-overlay {
          position: fixed; inset: 0; z-index: 60;
          background: var(--overlay);
        }

        /* Flex centering wrapper — no CSS transform, safe for Framer Motion */
        .om-center {
          position: fixed; inset: 0; z-index: 61;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          pointer-events: none;
        }

        .om-panel {
          pointer-events: all;
          background: var(--bg-primary);
          border-radius: var(--radius-lg);
          padding: 1.75rem;
          width: min(520px, 100%);
          max-height: calc(100svh - 2rem);
          overflow-y: auto;
          box-shadow: 0 24px 80px rgba(0,0,0,0.2);
        }

        @media (max-width: 540px) {
          .om-center { align-items: flex-end; padding: 0; }
          .om-panel {
            width: 100%;
            border-radius: var(--radius-lg) var(--radius-lg) 0 0;
            max-height: 92svh;
          }
        }

        .om-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .om-head-title {
          font-family: var(--font-heading);
          font-size: 1.1rem; font-weight: 400; color: var(--text-primary);
        }

        .om-close {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px;
          border: 1px solid var(--border); border-radius: var(--radius-md);
          background: transparent; cursor: pointer; color: var(--text-muted);
          transition: all var(--transition-fast);
        }
        .om-close:hover { background: var(--bg-secondary); color: var(--text-primary); }

        .om-work {
          display: flex; align-items: center; gap: 0.875rem;
          padding: 0.875rem; background: var(--bg-secondary);
          border-radius: var(--radius-md); margin-bottom: 1.5rem;
        }

        .om-work-img-wrap {
          position: relative; width: 68px; height: 68px;
          border-radius: var(--radius-md); overflow: hidden; flex-shrink: 0;
          background: var(--bg-tertiary);
        }
        .om-work-img { object-fit: cover; }
        .om-work-info { display: flex; flex-direction: column; gap: 0.2rem; }
        .om-work-code { font-size: 0.68rem; color: var(--text-subtle); letter-spacing: 0.06em; }
        .om-work-title { font-size: 0.9rem; color: var(--text-primary); }

        .om-form { display: flex; flex-direction: column; gap: 1.1rem; }
        .om-field { display: flex; flex-direction: column; gap: 0.4rem; }
        .om-label { font-size: 0.78rem; font-weight: 500; color: var(--text-secondary); }

        .om-input {
          padding: 0.65rem 0.875rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.9rem; font-family: inherit; width: 100%;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }
        .om-input:focus {
          outline: none; border-color: var(--text-secondary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-primary) 8%, transparent);
        }
        .om-input--err { border-color: #ef4444; }
        .om-textarea { resize: vertical; min-height: 80px; }

        .om-sizes { display: flex; flex-direction: column; gap: 0.45rem; }
        .om-size-opt {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.65rem 0.875rem;
          border: 1px solid var(--border); border-radius: var(--radius-md);
          cursor: pointer; transition: all var(--transition-fast);
        }
        .om-size-opt:hover { border-color: var(--text-muted); background: var(--bg-secondary); }
        .om-size-opt--sel { border-color: var(--text-primary); background: var(--bg-secondary); }
        .om-size-label { font-size: 0.875rem; color: var(--text-primary); }
        .om-size-rem   { font-size: 0.75rem;  color: var(--text-muted); }

        .om-err        { font-size: 0.75rem; color: #ef4444; margin-top: 0.15rem; }
        .om-server-err { font-size: 0.8rem;  color: #ef4444; }

        .om-submit {
          width: 100%; padding: 0.875rem;
          background: var(--text-primary); color: var(--bg-primary);
          border: none; border-radius: var(--radius-md);
          font-size: 0.9rem; font-family: inherit;
          cursor: pointer; transition: opacity var(--transition-fast);
          margin-top: 0.25rem;
        }
        .om-submit:hover:not(:disabled) { opacity: 0.85; }
        .om-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .om-success {
          display: flex; flex-direction: column; align-items: center;
          gap: 1.25rem; padding: 2.5rem 1rem; text-align: center;
        }
        .om-success-icon { color: var(--text-primary); }
        .om-success-msg { color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; }

        .sr-only {
          position: absolute; width: 1px; height: 1px;
          padding: 0; margin: -1px; overflow: hidden;
          clip: rect(0,0,0,0); white-space: nowrap; border: 0;
        }
      `}</style>
    </>
  );
}

// ── Work card ─────────────────────────────────────────────────────────────────

function AcquireCard({
  item,
  onDetail,
  onRequest,
}: {
  item: AcquireItem;
  onDetail: () => void;
  onRequest: () => void;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("acquire");
  const [imgLoaded, setImgLoaded] = useState(false);

  const title    = isAr ? item.work.titleAr : item.work.titleEn;
  const location = isAr ? item.work.locationAr : item.work.locationEn;
  const hasStock = item.sizes.some((s) => s.soldEditions < s.totalEditions);
  const imgCount = item.work.images.length + 1;

  return (
    <motion.div
      className="ac-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
    >
      {/* Image — clicking opens detail page */}
      <div className="ac-img-wrap" onClick={onDetail} style={{ cursor: "pointer" }}>
        <div className={`ac-shimmer ${imgLoaded ? "ac-shimmer--done" : ""}`} />
        <Image
          src={item.work.imageUrl}
          alt={title}
          fill
          className={`ac-img ${imgLoaded ? "ac-img--loaded" : ""}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
        />
        {/* Image count badge */}
        {imgCount > 1 && (
          <span className="ac-img-count">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            {imgCount}
          </span>
        )}
      </div>

      <div className="ac-body">
        <div className="ac-meta">
          <span className="ac-code">{item.work.code}</span>
          <h2 className="ac-title">{title}</h2>
          {location && <span className="ac-location">{location}</span>}
        </div>

        <div className="ac-sizes">
          {item.sizes.map((size) => {
            const rem  = size.totalEditions - size.soldEditions;
            const sold = rem <= 0;
            const displayLabel = isAr ? size.label.replace(/\bcm\b/gi, "سم") : size.label;
            return (
              <div key={size.id} className={`ac-size-row ${sold ? "ac-size-row--sold" : ""}`}>
                <span className="ac-size-label">{displayLabel}</span>
                <span className="ac-size-info">
                  {sold ? t("soldOut") : `${rem} / ${size.totalEditions} ${t("editions")}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Two buttons */}
        <div className="ac-actions">
          <button className="ac-btn-info" onClick={onDetail}>
            {t("details")}
          </button>
          <button
            className={`ac-btn-request ${!hasStock ? "ac-btn--sold" : ""}`}
            onClick={() => hasStock && onRequest()}
            disabled={!hasStock}
          >
            {hasStock ? t("requestAcquire") : t("soldOut")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AcquireClient({ items }: Props) {
  const [selectedItem, setSelectedItem] = useState<AcquireItem | null>(null);
  const [detailItem,   setDetailItem]   = useState<AcquireItem | null>(null);

  const openDetail  = useCallback((item: AcquireItem) => { setDetailItem(item); }, []);
  const openRequest = useCallback((item: AcquireItem) => { setSelectedItem(item); }, []);

  return (
    <>
      <div className="ac-grid container">
        {items.map((item) => (
          <AcquireCard
            key={item.id}
            item={item}
            onDetail={() => openDetail(item)}
            onRequest={() => openRequest(item)}
          />
        ))}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {detailItem && (
          <ItemDetailModal
            key={`detail-${detailItem.id}`}
            item={detailItem}
            onClose={() => setDetailItem(null)}
            onRequest={() => { setDetailItem(null); openRequest(detailItem); }}
          />
        )}
      </AnimatePresence>

      {/* Order modal */}
      <AnimatePresence>
        {selectedItem && (
          <OrderModal
            key={selectedItem.id}
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>

      <style>{`
        .ac-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          padding-bottom: 6rem;
        }

        @media (max-width: 1024px) { .ac-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px)  {
          .ac-grid { grid-template-columns: 1fr; }
          .ac-body { align-items: center; }
          .ac-meta { align-items: center; text-align: center; }
          .ac-sizes { width: 100%; }
          .ac-actions { width: 100%; }
        }

        /* Card */
        .ac-card {
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--bg-primary);
          transition: box-shadow var(--transition-base);
        }
        .ac-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.07); }

        .ac-img-wrap {
          position: relative;
          padding-bottom: 72%;
          background: var(--bg-secondary);
          overflow: hidden;
        }

        .ac-shimmer {
          position: absolute; inset: 0; z-index: 1;
          background: linear-gradient(90deg, var(--bg-secondary) 0%, var(--bg-tertiary) 50%, var(--bg-secondary) 100%);
          background-size: 200% 100%;
          animation: ac-shimmer 1.6s infinite;
          transition: opacity 0.4s;
        }
        .ac-shimmer--done { opacity: 0; pointer-events: none; }

        @keyframes ac-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .ac-img {
          object-fit: cover;
          transition: transform 600ms ease, opacity 0.45s;
          opacity: 0;
        }
        .ac-img--loaded { opacity: 1; }
        .ac-card:hover .ac-img { transform: scale(1.03); }

        .ac-img-count {
          position: absolute; bottom: 0.6rem; right: 0.6rem;
          background: rgba(0,0,0,0.55); color: #fff;
          font-size: 0.7rem; padding: 0.2rem 0.5rem;
          border-radius: 999px;
          display: flex; align-items: center; gap: 0.3rem;
        }

        .ac-body {
          padding: 1.25rem;
          display: flex; flex-direction: column; gap: 1rem;
        }

        .ac-meta { display: flex; flex-direction: column; gap: 0.2rem; }
        .ac-code { font-size: 0.68rem; color: var(--text-subtle); letter-spacing: 0.06em; }
        .ac-title { font-family: var(--font-heading); font-size: 1.1rem; font-weight: 400; color: var(--text-primary); }
        .ac-location { font-size: 0.78rem; color: var(--text-muted); }

        .ac-sizes { display: flex; flex-direction: column; }

        .ac-size-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0.45rem 0;
          border-bottom: 1px solid var(--border-subtle);
          font-size: 0.8rem;
        }
        .ac-size-label { color: var(--text-secondary); }
        .ac-size-info  { color: var(--text-muted); font-size: 0.75rem; }
        .ac-size-row--sold .ac-size-label,
        .ac-size-row--sold .ac-size-info {
          color: var(--text-subtle);
          text-decoration: line-through;
          text-decoration-color: var(--border);
        }

        /* Action buttons */
        .ac-actions {
          display: flex; gap: 0.5rem;
        }

        .ac-btn-info {
          flex: 1;
          padding: 0.7rem;
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 0.875rem; font-family: inherit;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .ac-btn-info:hover { background: var(--bg-secondary); color: var(--text-primary); border-color: var(--text-muted); }

        .ac-btn-request {
          flex: 1;
          padding: 0.7rem;
          background: var(--text-primary);
          color: var(--bg-primary);
          border: none; border-radius: var(--radius-md);
          font-size: 0.875rem; font-family: inherit;
          cursor: pointer;
          transition: opacity var(--transition-fast);
        }
        .ac-btn-request:hover:not(.ac-btn--sold) { opacity: 0.82; }
        .ac-btn--sold {
          background: var(--bg-tertiary); color: var(--text-subtle); cursor: not-allowed;
        }
      `}</style>
    </>
  );
}
