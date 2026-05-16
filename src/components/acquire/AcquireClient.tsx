"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import LocationSelect from "./LocationSelect";

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
  shippingAvailable: boolean;
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

interface CartItem {
  item: AcquireItem;
  sizeId: string;
  framingOption: "with_frame" | "without_frame";
  quantity: number;
}

interface Props {
  items: AcquireItem[];
}

// ── Direct order schema (single item) ────────────────────────────────────────

function buildOrderSchema(isAr: boolean) {
  return z.object({
    sizeId:        z.string().min(1, isAr ? "اختر مقاساً" : "Select a size"),
    framingOption: z.enum(["with_frame", "without_frame"]),
    quantity:      z.number().int().min(1).max(10),
    customerName:  z.string().min(2,  isAr ? "الاسم مطلوب"            : "Name is required"),
    customerEmail: z.string().email(  isAr ? "بريد إلكتروني غير صحيح" : "Invalid email"),
    customerPhone: z.string().min(9,  isAr ? "رقم الجوال مطلوب"        : "Phone is required"),
    country:  z.string().optional(),
    city:     z.string().optional(),
    message:  z.string().optional(),
  });
}

type OrderFormValues = {
  sizeId:        string;
  framingOption: "with_frame" | "without_frame";
  quantity:      number;
  customerName:  string;
  customerEmail: string;
  customerPhone: string;
  country?:  string;
  city?:     string;
  message?:  string;
};

// ── Contact form schema (cart checkout) ──────────────────────────────────────

function buildContactSchema(isAr: boolean) {
  return z.object({
    customerName:  z.string().min(2,  isAr ? "الاسم مطلوب"               : "Name is required"),
    customerEmail: z.string().email(  isAr ? "بريد إلكتروني غير صحيح"    : "Invalid email"),
    customerPhone: z.string().min(9,  isAr ? "رقم الجوال مطلوب"           : "Phone is required"),
    country:  z.string().optional(),
    city:     z.string().optional(),
    message:  z.string().optional(),
  });
}

type ContactFormValues = {
  customerName:  string;
  customerEmail: string;
  customerPhone: string;
  country?:  string;
  city?:     string;
  message?:  string;
};

// ── Lightbox ──────────────────────────────────────────────────────────────────

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
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft")  setCurrent((c) => (c > 0 ? c - 1 : images.length - 1));
      if (e.key === "ArrowRight") setCurrent((c) => (c < images.length - 1 ? c + 1 : 0));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, images.length]);

  return (
    <>
      <motion.div
        className="lb-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
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
        .lb-overlay { position: fixed; inset: 0; z-index: 70; background: rgba(0,0,0,0.93); backdrop-filter: blur(4px); }
        .lb-stage   { position: fixed; inset: 0; z-index: 71; pointer-events: none; }
        .lb-close {
          position: absolute; top: 1.25rem; right: 1.25rem;
          width: 40px; height: 40px;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          border-radius: 50%; cursor: pointer; color: #fff;
          display: flex; align-items: center; justify-content: center;
          pointer-events: all; transition: background 150ms;
        }
        .lb-close:hover { background: rgba(255,255,255,0.2); }
        .lb-img-wrap { position: absolute; inset: 3.5rem; pointer-events: all; }
        .lb-img      { object-fit: contain; }
        .lb-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 44px; height: 44px;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          border-radius: 50%; cursor: pointer; color: #fff;
          display: flex; align-items: center; justify-content: center;
          pointer-events: all; transition: background 150ms;
        }
        .lb-nav:hover   { background: rgba(255,255,255,0.22); }
        .lb-nav--prev   { left: 1rem; }
        .lb-nav--next   { right: 1rem; }
        .lb-dots {
          position: absolute; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
          display: flex; gap: 0.5rem; pointer-events: all;
        }
        .lb-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.35); border: none; cursor: pointer; transition: background 150ms, transform 150ms; }
        .lb-dot--active { background: #fff; transform: scale(1.3); }
      `}</style>
    </>
  );
}

// ── Item Detail Modal ─────────────────────────────────────────────────────────

function ItemDetailModal({
  item,
  inCart,
  onClose,
  onDirect,
  onAddToCart,
}: {
  item: AcquireItem;
  inCart: boolean;
  onClose: () => void;
  onDirect: () => void;
  onAddToCart: () => void;
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

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft")  setCurrent((c) => (c > 0 ? c - 1 : allImages.length - 1));
      if (e.key === "ArrowRight") setCurrent((c) => (c < allImages.length - 1 ? c + 1 : 0));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, allImages.length]);

  return (
    <>
      <motion.div className="dm-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <button className="dm-close" onClick={onClose} aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M13 3L3 13M3 3l10 10" />
        </svg>
      </button>

      <div className="dm-center">
        <motion.div
          className="dm-panel"
          role="dialog" aria-modal="true" dir={dir}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="dm-layout">
            {/* Gallery */}
            <div className="dm-gallery">
              <div className="dm-main-img-wrap" onClick={() => setLightboxOpen(true)} style={{ cursor: "zoom-in" }}>
                <AnimatePresence mode="wait">
                  <motion.div key={current} className="dm-main-img-inner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                    <Image src={allImages[current]} alt={title} fill className="dm-main-img" sizes="(max-width: 768px) 100vw, 55vw" priority />
                  </motion.div>
                </AnimatePresence>
                {allImages.length > 1 && (
                  <>
                    <button className="dm-img-nav dm-img-nav--prev" onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c > 0 ? c - 1 : allImages.length - 1)); }} aria-label="Previous">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 4l-6 6 6 6" /></svg>
                    </button>
                    <button className="dm-img-nav dm-img-nav--next" onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c < allImages.length - 1 ? c + 1 : 0)); }} aria-label="Next">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 4l6 6-6 6" /></svg>
                    </button>
                  </>
                )}
                {allImages.length > 1 && <div className="dm-img-counter">{current + 1} / {allImages.length}</div>}
              </div>
              {allImages.length > 1 && (
                <div className="dm-thumbs">
                  {allImages.map((url, i) => (
                    <button key={i} className={`dm-thumb ${i === current ? "dm-thumb--active" : ""}`} onClick={() => setCurrent(i)}>
                      <Image src={url} alt="" fill className="dm-thumb-img" sizes="72px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="dm-info">
              <div className="dm-info-top">
                <span className="dm-code">{item.work.code}</span>
                <h2 className="dm-title">{title}</h2>
                {location && <p className="dm-location">{location}</p>}
                {description && <p className="dm-description">{description}</p>}
              </div>

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

              <div className="dm-sizes">
                <p className="dm-sizes-label">{t("availableSizes")}</p>
                {item.sizes.map((size) => {
                  const rem  = size.totalEditions - size.soldEditions;
                  const sold = rem <= 0;
                  const displayLabel = isAr ? size.label.replace(/\bcm\b/gi, "سم") : size.label;
                  return (
                    <div key={size.id} className={`dm-size-row ${sold ? "dm-size-row--sold" : ""}`}>
                      <span className="dm-size-name">{displayLabel}</span>
                      <span className="dm-size-rem">
                        {sold ? t("soldOut") : `${rem} / ${size.totalEditions} ${t("editions")}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {!hasStock ? (
                <button className="dm-cta dm-cta--sold" disabled>{t("soldOut")}</button>
              ) : (
                <div className="dm-cta-group">
                  <button className="dm-cta-direct" onClick={() => { onClose(); onDirect(); }}>
                    {isAr ? "اقتناء مباشر" : "Acquire Now"}
                  </button>
                  <button
                    className={`dm-cta-cart ${inCart ? "dm-cta-cart--in-cart" : ""}`}
                    onClick={onAddToCart}
                  >
                    {inCart
                      ? (isAr ? "✓ في السلة" : "✓ In Cart")
                      : (isAr ? "إضافة للسلة" : "Add to Cart")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox images={allImages} startIndex={current} onClose={() => setLightboxOpen(false)} />
        )}
      </AnimatePresence>

      <style>{`
        .dm-overlay { position: fixed; inset: 0; z-index: 55; background: rgba(0,0,0,0.6); backdrop-filter: blur(3px); }
        .dm-center  { position: fixed; inset: 0; z-index: 56; display: flex; align-items: center; justify-content: center; padding: 1rem; pointer-events: none; }
        .dm-panel   { pointer-events: all; position: relative; background: var(--bg-primary); border-radius: var(--radius-lg); width: 100%; max-width: 900px; max-height: calc(100svh - 2rem); overflow-y: auto; box-shadow: 0 32px 80px rgba(0,0,0,0.25); }
        .dm-close   { position: fixed; top: 1rem; right: 1rem; width: 40px; height: 40px; border: 1px solid rgba(255,255,255,0.18); border-radius: var(--radius-md); background: rgba(20,20,20,0.75); backdrop-filter: blur(8px); cursor: pointer; color: #fff; display: flex; align-items: center; justify-content: center; transition: all var(--transition-fast); z-index: 70; flex-shrink: 0; }
        .dm-close:hover { background: rgba(40,40,40,0.9); border-color: rgba(255,255,255,0.3); }
        .dm-layout  { display: grid; grid-template-columns: 55fr 45fr; min-height: 400px; }
        @media (max-width: 640px) { .dm-layout { grid-template-columns: 1fr; } }
        .dm-gallery { display: flex; flex-direction: column; gap: 0.75rem; padding: 1.25rem; }
        .dm-main-img-wrap { position: relative; aspect-ratio: 4/3; background: var(--bg-secondary); border-radius: var(--radius-md); overflow: hidden; }
        .dm-main-img-inner { position: absolute; inset: 0; }
        .dm-main-img { object-fit: cover; }
        .dm-img-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; background: rgba(0,0,0,0.45); border: none; border-radius: 50%; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 150ms; z-index: 2; }
        .dm-img-nav:hover { background: rgba(0,0,0,0.65); }
        .dm-img-nav--prev { left: 0.6rem; }
        .dm-img-nav--next { right: 0.6rem; }
        .dm-img-counter { position: absolute; bottom: 0.6rem; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.5); color: #fff; font-size: 0.72rem; padding: 0.2rem 0.55rem; border-radius: 999px; letter-spacing: 0.04em; }
        .dm-thumbs { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .dm-thumb  { position: relative; width: 60px; height: 60px; border-radius: var(--radius-sm); overflow: hidden; border: 2px solid transparent; cursor: pointer; background: var(--bg-secondary); padding: 0; transition: border-color var(--transition-fast); flex-shrink: 0; }
        .dm-thumb--active { border-color: var(--text-primary); }
        .dm-thumb-img { object-fit: cover; }
        .dm-info { display: flex; flex-direction: column; gap: 1.25rem; padding: 2rem 1.5rem 1.5rem; border-inline-start: 1px solid var(--border-subtle); }
        @media (max-width: 640px) { .dm-info { border-inline-start: none; border-top: 1px solid var(--border-subtle); padding: 1.25rem; } }
        .dm-info-top { display: flex; flex-direction: column; gap: 0.35rem; }
        .dm-code  { font-size: 0.68rem; color: var(--text-subtle); letter-spacing: 0.08em; }
        .dm-title { font-family: var(--font-heading); font-size: 1.4rem; font-weight: 400; color: var(--text-primary); line-height: 1.25; }
        .dm-location { font-size: 0.78rem; color: var(--text-muted); }
        .dm-description { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.65; margin-top: 0.25rem; }
        .dm-specs { display: flex; flex-direction: column; gap: 0.35rem; }
        .dm-specs-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 0.1rem; }
        .dm-specs-list  { display: flex; flex-direction: column; }
        .dm-spec-row    { display: flex; justify-content: space-between; align-items: baseline; padding: 0.35rem 0; border-bottom: 1px solid var(--border-subtle); gap: 1rem; }
        .dm-spec-key { font-size: 0.78rem; color: var(--text-muted); }
        .dm-spec-val { font-size: 0.8rem; color: var(--text-primary); font-weight: 500; text-align: end; }
        .dm-sizes { display: flex; flex-direction: column; gap: 0.1rem; }
        .dm-sizes-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 0.35rem; }
        .dm-size-row    { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border-subtle); font-size: 0.82rem; }
        .dm-size-name { color: var(--text-secondary); }
        .dm-size-rem  { color: var(--text-muted); font-size: 0.75rem; }
        .dm-size-row--sold .dm-size-name,
        .dm-size-row--sold .dm-size-rem { color: var(--text-subtle); text-decoration: line-through; text-decoration-color: var(--border); }
        .dm-cta { width: 100%; padding: 0.875rem; background: var(--text-primary); color: var(--bg-primary); border: none; border-radius: var(--radius-md); font-size: 0.9rem; font-family: inherit; cursor: pointer; transition: opacity var(--transition-fast); margin-top: auto; }
        .dm-cta--sold { background: var(--bg-tertiary); color: var(--text-subtle); cursor: not-allowed; }
        /* Two-button group */
        .dm-cta-group { display: flex; flex-direction: column; gap: 0.5rem; margin-top: auto; }
        .dm-cta-direct {
          width: 100%; padding: 0.875rem;
          background: var(--text-primary); color: var(--bg-primary);
          border: none; border-radius: var(--radius-md);
          font-size: 0.875rem; font-family: inherit; cursor: pointer;
          transition: opacity var(--transition-fast);
        }
        .dm-cta-direct:hover { opacity: 0.85; }
        .dm-cta-cart {
          width: 100%; padding: 0.75rem;
          background: transparent; color: var(--text-primary);
          border: 1.5px solid var(--border); border-radius: var(--radius-md);
          font-size: 0.875rem; font-family: inherit; cursor: pointer;
          transition: all var(--transition-fast);
        }
        .dm-cta-cart:hover { border-color: var(--text-primary); background: var(--bg-secondary); }
        .dm-cta-cart--in-cart { border-color: var(--text-primary); background: var(--bg-secondary); }
      `}</style>
    </>
  );
}

// ── Order Modal — direct single-item acquisition ─────────────────────────────

function OrderModal({ item, onClose }: { item: AcquireItem; onClose: () => void }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("acquire");
  const tForm = useTranslations("acquire.form");
  const dir = isAr ? "rtl" as const : "ltr" as const;

  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const schema = buildOrderSchema(isAr);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<OrderFormValues>({
      resolver: zodResolver(schema),
      defaultValues: { sizeId: "", framingOption: "without_frame", quantity: 1, customerName: "", customerEmail: "", customerPhone: "", country: "", city: "", message: "" },
    });

  const selectedSize    = watch("sizeId");
  const selectedFraming = watch("framingOption");
  const selectedQty     = watch("quantity");

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
  const title = isAr ? item.work.titleAr : item.work.titleEn;

  const onSubmit = async (data: OrderFormValues) => {
    setServerError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ acquireItemId: item.id, sizeId: data.sizeId, framingOption: data.framingOption, quantity: data.quantity }],
          customerName: data.customerName, customerEmail: data.customerEmail,
          customerPhone: data.customerPhone, country: data.country,
          city: data.city, message: data.message,
        }),
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

  return (
    <>
      <motion.div className="om-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <div className="om-center">
        <motion.div
          className="om-panel" role="dialog" aria-modal="true" dir={dir}
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="om-head">
            <h2 className="om-head-title">{t("requestAcquire")}</h2>
            <button className="om-close" onClick={onClose} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M13 3L3 13M3 3l10 10" /></svg>
            </button>
          </div>

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
            <motion.div className="om-success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
              <div className="om-success-icon">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="18" cy="18" r="15" /><path d="M11 18l5 5 9-9" />
                </svg>
              </div>
              <p className="om-success-msg">{tForm("success")}</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="om-form" noValidate>
              {/* Size */}
              <div className="om-field">
                <label className="om-label">{t("selectSize")}</label>
                <div className="om-sizes">
                  {availableSizes.map((size) => {
                    const rem = size.totalEditions - size.soldEditions;
                    return (
                      <label key={size.id} className={`om-size-opt ${selectedSize === size.id ? "om-size-opt--sel" : ""}`}>
                        <input type="radio" value={size.id} {...register("sizeId")} onChange={() => setValue("sizeId", size.id, { shouldValidate: true })} className="sr-only" />
                        <span className="om-size-label">{isAr ? size.label.replace(/\bcm\b/gi, "سم") : size.label}</span>
                        <span className="om-size-rem">{rem} {t("remaining")}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.sizeId && <p className="om-err">{errors.sizeId.message}</p>}
              </div>

              {/* Quantity */}
              <div className="om-field">
                <label className="om-label">{isAr ? "عدد النسخ" : "Quantity"}</label>
                <div className="om-qty-row">
                  <button type="button" className="om-qty-btn" onClick={() => setValue("quantity", Math.max(1, (selectedQty || 1) - 1), { shouldValidate: true })} disabled={(selectedQty || 1) <= 1}>−</button>
                  <span className="om-qty-val">{selectedQty || 1}</span>
                  <button type="button" className="om-qty-btn" onClick={() => setValue("quantity", Math.min(10, (selectedQty || 1) + 1), { shouldValidate: true })} disabled={(selectedQty || 1) >= 10}>+</button>
                  <span className="om-qty-note">{isAr ? "الحد الأقصى ١٠ نسخ" : "Max 10 prints"}</span>
                </div>
              </div>

              {/* Framing */}
              <div className="om-field">
                <label className="om-label">{isAr ? "التأطير" : "Framing"}</label>
                <div className="om-framing">
                  {(["without_frame", "with_frame"] as const).map((opt) => (
                    <label key={opt} className={`om-frame-opt ${selectedFraming === opt ? "om-frame-opt--sel" : ""}`}>
                      <input type="radio" value={opt} {...register("framingOption")} onChange={() => setValue("framingOption", opt, { shouldValidate: true })} className="sr-only" />
                      <span className="om-frame-icon">
                        {opt === "without_frame"
                          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                          : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="2"/><rect x="6" y="6" width="12" height="12" rx="1"/></svg>}
                      </span>
                      <span className="om-frame-label">{opt === "without_frame" ? (isAr ? "بدون إطار" : "Without Frame") : (isAr ? "مع إطار" : "With Frame")}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div className="om-field">
                <label className="om-label" htmlFor="om-name">{tForm("name")}</label>
                <input id="om-name" type="text" placeholder={tForm("namePlaceholder")} className={`om-input ${errors.customerName ? "om-input--err" : ""}`} {...register("customerName")} />
                {errors.customerName && <p className="om-err">{errors.customerName.message}</p>}
              </div>
              <div className="om-field">
                <label className="om-label" htmlFor="om-email">{tForm("email")}</label>
                <input id="om-email" type="email" placeholder={tForm("emailPlaceholder")} className={`om-input ${errors.customerEmail ? "om-input--err" : ""}`} {...register("customerEmail")} />
                {errors.customerEmail && <p className="om-err">{errors.customerEmail.message}</p>}
              </div>
              <div className="om-field">
                <label className="om-label" htmlFor="om-phone">{tForm("phone")}</label>
                <input id="om-phone" type="tel" placeholder={tForm("phonePlaceholder")} className={`om-input ${errors.customerPhone ? "om-input--err" : ""}`} {...register("customerPhone")} />
                {errors.customerPhone && <p className="om-err">{errors.customerPhone.message}</p>}
              </div>

              <LocationSelect
                locale={isAr ? "ar" : "en"}
                country={watch("country") ?? ""}
                city={watch("city") ?? ""}
                onCountryChange={(v) => setValue("country", v, { shouldValidate: true })}
                onCityChange={(v) => setValue("city", v, { shouldValidate: true })}
              />

              <div className="om-field">
                <label className="om-label" htmlFor="om-msg">{tForm("message")}</label>
                <textarea id="om-msg" rows={3} placeholder={tForm("messagePlaceholder")} className="om-input om-textarea" {...register("message")} />
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
        .om-overlay { position:fixed; inset:0; z-index:60; background:var(--overlay); }
        .om-center  { position:fixed; inset:0; z-index:61; display:flex; align-items:center; justify-content:center; padding:1rem; pointer-events:none; }
        .om-panel   { pointer-events:all; background:var(--bg-primary); border-radius:var(--radius-lg); padding:1.75rem; width:min(520px,100%); max-height:calc(100svh - 2rem); overflow-y:auto; box-shadow:0 24px 80px rgba(0,0,0,0.2); }
        @media(max-width:540px){.om-center{align-items:flex-end;padding:0}.om-panel{width:100%;border-radius:var(--radius-lg) var(--radius-lg) 0 0;max-height:92svh}}
        .om-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem; }
        .om-head-title { font-family:var(--font-heading); font-size:1.1rem; font-weight:400; color:var(--text-primary); }
        .om-close { display:flex; align-items:center; justify-content:center; width:32px; height:32px; border:1px solid var(--border); border-radius:var(--radius-md); background:transparent; cursor:pointer; color:var(--text-muted); transition:all var(--transition-fast); }
        .om-close:hover { background:var(--bg-secondary); color:var(--text-primary); }
        .om-work { display:flex; align-items:center; gap:0.875rem; padding:0.875rem; background:var(--bg-secondary); border-radius:var(--radius-md); margin-bottom:1.5rem; }
        .om-work-img-wrap { position:relative; width:68px; height:68px; border-radius:var(--radius-md); overflow:hidden; flex-shrink:0; background:var(--bg-tertiary); }
        .om-work-img { object-fit:cover; }
        .om-work-info { display:flex; flex-direction:column; gap:0.2rem; }
        .om-work-code { font-size:0.68rem; color:var(--text-subtle); letter-spacing:0.06em; }
        .om-work-title { font-size:0.9rem; color:var(--text-primary); }
        .om-form { display:flex; flex-direction:column; gap:1.1rem; }
        .om-field { display:flex; flex-direction:column; gap:0.4rem; }
        .om-label { font-size:0.78rem; font-weight:500; color:var(--text-secondary); }
        .om-qty-row { display:flex; align-items:center; gap:0.75rem; }
        .om-qty-btn { width:34px; height:34px; border-radius:50%; border:1px solid var(--border); background:var(--bg-secondary); color:var(--text-primary); font-size:1.1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:border-color var(--transition-fast),opacity var(--transition-fast); }
        .om-qty-btn:disabled { opacity:0.35; cursor:not-allowed; }
        .om-qty-btn:not(:disabled):hover { border-color:var(--text-secondary); }
        .om-qty-val { font-size:1.1rem; font-weight:500; color:var(--text-primary); min-width:1.5rem; text-align:center; }
        .om-qty-note { font-size:0.72rem; color:var(--text-subtle); }
        .om-input { padding:0.65rem 0.875rem; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--bg-secondary); color:var(--text-primary); font-size:0.9rem; font-family:inherit; width:100%; transition:border-color var(--transition-fast),box-shadow var(--transition-fast); }
        .om-input:focus { outline:none; border-color:var(--text-secondary); box-shadow:0 0 0 3px color-mix(in srgb,var(--text-primary) 8%,transparent); }
        .om-input--err { border-color:#ef4444; }
        .om-textarea { resize:vertical; min-height:80px; }
        .om-framing { display:flex; gap:0.65rem; }
        .om-frame-opt { flex:1; display:flex; flex-direction:column; align-items:center; gap:0.45rem; padding:0.75rem 0.5rem; border:1px solid var(--border); border-radius:var(--radius-md); cursor:pointer; transition:all var(--transition-fast); text-align:center; }
        .om-frame-opt:hover { border-color:var(--text-muted); background:var(--bg-secondary); }
        .om-frame-opt--sel { border-color:var(--text-primary); background:var(--bg-secondary); }
        .om-frame-icon { color:var(--text-secondary); line-height:0; }
        .om-frame-opt--sel .om-frame-icon { color:var(--text-primary); }
        .om-frame-label { font-size:0.8rem; color:var(--text-secondary); }
        .om-frame-opt--sel .om-frame-label { color:var(--text-primary); font-weight:500; }
        .om-sizes { display:flex; flex-direction:column; gap:0.45rem; }
        .om-size-opt { display:flex; align-items:center; justify-content:space-between; padding:0.65rem 0.875rem; border:1px solid var(--border); border-radius:var(--radius-md); cursor:pointer; transition:all var(--transition-fast); }
        .om-size-opt:hover { border-color:var(--text-muted); background:var(--bg-secondary); }
        .om-size-opt--sel { border-color:var(--text-primary); background:var(--bg-secondary); }
        .om-size-label { font-size:0.875rem; color:var(--text-primary); }
        .om-size-rem   { font-size:0.75rem; color:var(--text-muted); }
        .om-err        { font-size:0.75rem; color:#ef4444; margin-top:0.15rem; }
        .om-server-err { font-size:0.8rem; color:#ef4444; }
        .om-submit { width:100%; padding:0.875rem; background:var(--text-primary); color:var(--bg-primary); border:none; border-radius:var(--radius-md); font-size:0.9rem; font-family:inherit; cursor:pointer; transition:opacity var(--transition-fast); margin-top:0.25rem; }
        .om-submit:hover:not(:disabled) { opacity:0.85; }
        .om-submit:disabled { opacity:0.5; cursor:not-allowed; }
        .om-success { display:flex; flex-direction:column; align-items:center; gap:1.25rem; padding:2.5rem 1rem; text-align:center; }
        .om-success-icon { color:var(--text-primary); }
        .om-success-msg { color:var(--text-secondary); font-size:0.95rem; line-height:1.6; }
      `}</style>
    </>
  );
}

// ── Cart Drawer ───────────────────────────────────────────────────────────────

function CartDrawer({
  cart,
  isOpen,
  onClose,
  isAr,
  onSizeChange,
  onFramingChange,
  onQtyChange,
  onRemove,
  onSubmitSuccess,
}: {
  cart: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  isAr: boolean;
  onSizeChange:   (itemId: string, sizeId: string) => void;
  onFramingChange:(itemId: string, opt: "with_frame" | "without_frame") => void;
  onQtyChange:    (itemId: string, qty: number) => void;
  onRemove:       (itemId: string) => void;
  onSubmitSuccess:() => void;
}) {
  const dir = isAr ? "rtl" as const : "ltr" as const;
  const [submitted, setSubmitted]       = useState(false);
  const [sizeErrors, setSizeErrors]     = useState<Set<string>>(new Set());
  const [serverError, setServerError]   = useState("");

  const schema = buildContactSchema(isAr);
  const {
    register, handleSubmit, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { customerName: "", customerEmail: "", customerPhone: "", country: "", city: "", message: "" },
  });

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false);
      setSizeErrors(new Set());
      setServerError("");
    }
  }, [isOpen]);

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  // Keyboard close
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  const onSubmit = async (data: ContactFormValues) => {
    // Validate every cart item has a size selected
    const missing = new Set(cart.filter((ci) => !ci.sizeId).map((ci) => ci.item.id));
    if (missing.size > 0) {
      setSizeErrors(missing);
      return;
    }
    setSizeErrors(new Set());
    setServerError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((ci) => ({
            acquireItemId: ci.item.id,
            sizeId:        ci.sizeId,
            framingOption: ci.framingOption,
            quantity:      ci.quantity,
          })),
          ...data,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setServerError((err as { error?: string }).error || (isAr ? "حدث خطأ، يرجى المحاولة لاحقاً" : "Something went wrong"));
        return;
      }

      setSubmitted(true);
      onSubmitSuccess();
    } catch {
      setServerError(isAr ? "فشل الاتصال بالخادم" : "Connection failed");
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="cd-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={onClose}
            />

            {/* Drawer panel */}
            <motion.div
              className="cd-drawer"
              dir={dir}
              role="dialog"
              aria-modal="true"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Header */}
              <div className="cd-head">
                <div className="cd-head-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 01-8 0"/>
                  </svg>
                  <span className="cd-head-title">{isAr ? "سلة الاقتناء" : "Acquisition Cart"}</span>
                  {cart.length > 0 && (
                    <span className="cd-head-count">{cart.length}</span>
                  )}
                </div>
                <button className="cd-close" onClick={onClose} aria-label="Close">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M13 3L3 13M3 3l10 10" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="cd-body">
                {submitted ? (
                  <motion.div
                    className="cd-success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="cd-success-icon">
                      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <circle cx="22" cy="22" r="19" />
                        <path d="M13 22l6 6 12-12" />
                      </svg>
                    </div>
                    <p className="cd-success-title">
                      {isAr ? "تم إرسال الطلب" : "Request Sent"}
                    </p>
                    <p className="cd-success-msg">
                      {isAr
                        ? "شكراً لاهتمامك — سيتم التواصل معك قريباً بالتفاصيل."
                        : "Thank you for your interest — we'll be in touch with details shortly."}
                    </p>
                  </motion.div>
                ) : cart.length === 0 ? (
                  <div className="cd-empty">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.25 }}>
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                      <path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                    <p>{isAr ? "السلة فارغة" : "Your cart is empty"}</p>
                  </div>
                ) : (
                  <>
                    {/* ── Cart items ── */}
                    <div className="cd-items">
                      {cart.map((ci) => {
                        const title = isAr ? ci.item.work.titleAr : ci.item.work.titleEn;
                        const availSizes = ci.item.sizes.filter((s) => s.soldEditions < s.totalEditions);
                        const hasSizeErr = sizeErrors.has(ci.item.id);

                        return (
                          <div key={ci.item.id} className="cd-item">
                            {/* Item header */}
                            <div className="cd-item-header">
                              <div className="cd-item-img-wrap">
                                <Image src={ci.item.work.imageUrl} alt={title} fill className="cd-item-img" sizes="56px" />
                              </div>
                              <div className="cd-item-meta">
                                <span className="cd-item-code">{ci.item.work.code}</span>
                                <span className="cd-item-title">{title}</span>
                              </div>
                              <button
                                className="cd-item-remove"
                                onClick={() => onRemove(ci.item.id)}
                                aria-label={isAr ? "إزالة" : "Remove"}
                              >
                                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                  <path d="M13 3L3 13M3 3l10 10" />
                                </svg>
                              </button>
                            </div>

                            {/* Size selection */}
                            <div className={`cd-field ${hasSizeErr ? "cd-field--err" : ""}`}>
                              <label className="cd-label">{isAr ? "المقاس" : "Size"}</label>
                              <div className="cd-sizes">
                                {availSizes.map((size) => {
                                  const displayLabel = isAr ? size.label.replace(/\bcm\b/gi, "سم") : size.label;
                                  const rem = size.totalEditions - size.soldEditions;
                                  return (
                                    <label
                                      key={size.id}
                                      className={`cd-size-opt ${ci.sizeId === size.id ? "cd-size-opt--sel" : ""}`}
                                    >
                                      <input
                                        type="radio"
                                        className="sr-only"
                                        checked={ci.sizeId === size.id}
                                        onChange={() => {
                                          onSizeChange(ci.item.id, size.id);
                                          setSizeErrors((prev) => {
                                            const next = new Set(prev);
                                            next.delete(ci.item.id);
                                            return next;
                                          });
                                        }}
                                      />
                                      <span className="cd-size-label">{displayLabel}</span>
                                      <span className="cd-size-rem">{rem}</span>
                                    </label>
                                  );
                                })}
                              </div>
                              {hasSizeErr && (
                                <p className="cd-err">{isAr ? "يرجى اختيار مقاس" : "Please select a size"}</p>
                              )}
                            </div>

                            {/* Framing + Qty row */}
                            <div className="cd-framing-qty-row">
                              {/* Framing */}
                              <div className="cd-field cd-field--half">
                                <label className="cd-label">{isAr ? "التأطير" : "Framing"}</label>
                                <div className="cd-framing">
                                  {(["without_frame", "with_frame"] as const).map((opt) => (
                                    <label
                                      key={opt}
                                      className={`cd-frame-opt ${ci.framingOption === opt ? "cd-frame-opt--sel" : ""}`}
                                    >
                                      <input
                                        type="radio"
                                        className="sr-only"
                                        checked={ci.framingOption === opt}
                                        onChange={() => onFramingChange(ci.item.id, opt)}
                                      />
                                      <span className="cd-frame-icon">
                                        {opt === "without_frame" ? (
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                                        ) : (
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="2"/><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
                                        )}
                                      </span>
                                      <span className="cd-frame-text">
                                        {opt === "without_frame"
                                          ? (isAr ? "بدون" : "None")
                                          : (isAr ? "مع إطار" : "Framed")}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {/* Quantity */}
                              <div className="cd-field cd-field--half">
                                <label className="cd-label">{isAr ? "الكمية" : "Qty"}</label>
                                <div className="cd-qty-row">
                                  <button
                                    type="button"
                                    className="cd-qty-btn"
                                    onClick={() => onQtyChange(ci.item.id, Math.max(1, ci.quantity - 1))}
                                    disabled={ci.quantity <= 1}
                                  >−</button>
                                  <span className="cd-qty-val">{ci.quantity}</span>
                                  <button
                                    type="button"
                                    className="cd-qty-btn"
                                    onClick={() => onQtyChange(ci.item.id, Math.min(10, ci.quantity + 1))}
                                    disabled={ci.quantity >= 10}
                                  >+</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* ── Contact form ── */}
                    <div className="cd-form-section">
                      <p className="cd-section-title">
                        {isAr ? "معلومات التواصل" : "Contact Information"}
                      </p>
                      <form onSubmit={handleSubmit(onSubmit)} className="cd-form" noValidate>
                        <div className="cd-field">
                          <label className="cd-label" htmlFor="cd-name">{isAr ? "الاسم" : "Name"}</label>
                          <input
                            id="cd-name" type="text"
                            placeholder={isAr ? "اسمك الكامل" : "Your full name"}
                            className={`cd-input ${errors.customerName ? "cd-input--err" : ""}`}
                            {...register("customerName")}
                          />
                          {errors.customerName && <p className="cd-err">{errors.customerName.message}</p>}
                        </div>

                        <div className="cd-field">
                          <label className="cd-label" htmlFor="cd-email">{isAr ? "البريد الإلكتروني" : "Email"}</label>
                          <input
                            id="cd-email" type="email"
                            placeholder={isAr ? "بريدك الإلكتروني" : "your@email.com"}
                            className={`cd-input ${errors.customerEmail ? "cd-input--err" : ""}`}
                            {...register("customerEmail")}
                          />
                          {errors.customerEmail && <p className="cd-err">{errors.customerEmail.message}</p>}
                        </div>

                        <div className="cd-field">
                          <label className="cd-label" htmlFor="cd-phone">{isAr ? "رقم الجوال" : "Phone"}</label>
                          <input
                            id="cd-phone" type="tel"
                            placeholder={isAr ? "+966 5X XXX XXXX" : "+1 XXX XXX XXXX"}
                            className={`cd-input ${errors.customerPhone ? "cd-input--err" : ""}`}
                            {...register("customerPhone")}
                          />
                          {errors.customerPhone && <p className="cd-err">{errors.customerPhone.message}</p>}
                        </div>

                        <LocationSelect
                          locale={isAr ? "ar" : "en"}
                          country={watch("country") ?? ""}
                          city={watch("city") ?? ""}
                          onCountryChange={(v) => setValue("country", v, { shouldValidate: true })}
                          onCityChange={(v) => setValue("city", v, { shouldValidate: true })}
                        />

                        <div className="cd-field">
                          <label className="cd-label" htmlFor="cd-msg">{isAr ? "رسالة (اختياري)" : "Message (optional)"}</label>
                          <textarea
                            id="cd-msg" rows={3}
                            placeholder={isAr ? "أي تفاصيل إضافية تودّ مشاركتها..." : "Any additional details..."}
                            className="cd-input cd-textarea"
                            {...register("message")}
                          />
                        </div>

                        {serverError && <p className="cd-server-err">{serverError}</p>}

                        <button type="submit" disabled={isSubmitting} className="cd-submit">
                          {isSubmitting
                            ? (isAr ? "جارٍ الإرسال..." : "Sending...")
                            : (isAr ? "أرسل طلب الاقتناء" : "Send Acquisition Request")}
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .cd-overlay {
          position: fixed; inset: 0; z-index: 60;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(2px);
        }

        .cd-drawer {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: min(480px, 100vw);
          z-index: 61;
          background: var(--bg-primary);
          border-inline-start: 1px solid var(--border);
          display: flex; flex-direction: column;
          box-shadow: -12px 0 40px rgba(0,0,0,0.15);
          overflow: hidden;
        }

        .cd-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .cd-head-left { display: flex; align-items: center; gap: 0.6rem; color: var(--text-primary); }
        .cd-head-title { font-size: 1rem; font-weight: 500; }
        .cd-head-count {
          background: var(--text-primary); color: var(--bg-primary);
          width: 20px; height: 20px; border-radius: 50%;
          font-size: 0.72rem; font-weight: 600;
          display: flex; align-items: center; justify-content: center;
        }

        .cd-close {
          width: 32px; height: 32px;
          border: 1px solid var(--border); border-radius: var(--radius-md);
          background: transparent; cursor: pointer; color: var(--text-muted);
          display: flex; align-items: center; justify-content: center;
          transition: all var(--transition-fast);
        }
        .cd-close:hover { background: var(--bg-secondary); color: var(--text-primary); }

        .cd-body {
          flex: 1; overflow-y: auto;
          display: flex; flex-direction: column;
        }

        .cd-empty {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 0.75rem; color: var(--text-subtle);
          font-size: 0.9rem; padding: 3rem 1.5rem;
        }

        .cd-success {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 1rem; padding: 3rem 2rem; text-align: center;
        }
        .cd-success-icon { color: var(--text-primary); }
        .cd-success-title { font-size: 1.1rem; font-weight: 500; color: var(--text-primary); }
        .cd-success-msg   { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.7; }

        /* Items list */
        .cd-items { padding: 0.5rem 0; border-bottom: 1px solid var(--border-subtle); }

        .cd-item {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-subtle);
          display: flex; flex-direction: column; gap: 1rem;
        }
        .cd-item:last-child { border-bottom: none; }

        .cd-item-header {
          display: flex; align-items: flex-start; gap: 0.75rem;
        }
        .cd-item-img-wrap {
          position: relative; width: 52px; height: 52px;
          border-radius: var(--radius-sm); overflow: hidden;
          flex-shrink: 0; background: var(--bg-secondary);
        }
        .cd-item-img { object-fit: cover; }
        .cd-item-meta { flex: 1; display: flex; flex-direction: column; gap: 0.15rem; }
        .cd-item-code  { font-size: 0.65rem; color: var(--text-subtle); letter-spacing: 0.06em; }
        .cd-item-title { font-size: 0.875rem; color: var(--text-primary); line-height: 1.3; }
        .cd-item-remove {
          width: 26px; height: 26px; flex-shrink: 0;
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          background: transparent; cursor: pointer; color: var(--text-subtle);
          display: flex; align-items: center; justify-content: center;
          transition: all var(--transition-fast); margin-top: 0.1rem;
        }
        .cd-item-remove:hover { border-color: #ef4444; color: #ef4444; background: #fee2e2; }

        /* Field layouts */
        .cd-field { display: flex; flex-direction: column; gap: 0.4rem; }
        .cd-field--err .cd-label { color: #ef4444; }
        .cd-framing-qty-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .cd-field--half {}

        .cd-label { font-size: 0.72rem; font-weight: 500; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }

        /* Sizes */
        .cd-sizes { display: flex; flex-direction: column; gap: 0.35rem; }
        .cd-size-opt {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border); border-radius: var(--radius-md);
          cursor: pointer; transition: all var(--transition-fast); font-size: 0.825rem;
        }
        .cd-size-opt:hover { border-color: var(--text-muted); background: var(--bg-secondary); }
        .cd-size-opt--sel  { border-color: var(--text-primary); background: var(--bg-secondary); }
        .cd-size-label { color: var(--text-primary); }
        .cd-size-rem   { font-size: 0.7rem; color: var(--text-muted); }

        /* Framing */
        .cd-framing { display: flex; flex-direction: column; gap: 0.3rem; }
        .cd-frame-opt {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.45rem 0.65rem;
          border: 1px solid var(--border); border-radius: var(--radius-md);
          cursor: pointer; transition: all var(--transition-fast); font-size: 0.8rem;
        }
        .cd-frame-opt:hover { border-color: var(--text-muted); background: var(--bg-secondary); }
        .cd-frame-opt--sel  { border-color: var(--text-primary); background: var(--bg-secondary); }
        .cd-frame-icon { color: var(--text-secondary); line-height: 0; flex-shrink: 0; }
        .cd-frame-opt--sel .cd-frame-icon { color: var(--text-primary); }
        .cd-frame-text { color: var(--text-secondary); font-size: 0.78rem; }
        .cd-frame-opt--sel .cd-frame-text { color: var(--text-primary); font-weight: 500; }

        /* Qty */
        .cd-qty-row { display: flex; align-items: center; gap: 0.5rem; }
        .cd-qty-btn {
          width: 30px; height: 30px; border-radius: 50%;
          border: 1px solid var(--border); background: var(--bg-secondary);
          color: var(--text-primary); font-size: 1rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: border-color var(--transition-fast);
        }
        .cd-qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .cd-qty-btn:not(:disabled):hover { border-color: var(--text-secondary); }
        .cd-qty-val { font-size: 1rem; font-weight: 500; color: var(--text-primary); min-width: 1.25rem; text-align: center; }

        /* Contact form section */
        .cd-form-section { padding: 1.5rem; }
        .cd-section-title {
          font-size: 0.72rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--text-muted); margin-bottom: 1.1rem;
        }
        .cd-form { display: flex; flex-direction: column; gap: 0.875rem; }
        .cd-input {
          padding: 0.65rem 0.875rem;
          border: 1px solid var(--border); border-radius: var(--radius-md);
          background: var(--bg-secondary); color: var(--text-primary);
          font-size: 0.875rem; font-family: inherit; width: 100%;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }
        .cd-input:focus { outline: none; border-color: var(--text-secondary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--text-primary) 8%, transparent); }
        .cd-input--err { border-color: #ef4444; }
        .cd-textarea  { resize: vertical; min-height: 80px; }

        .cd-err        { font-size: 0.72rem; color: #ef4444; }
        .cd-server-err { font-size: 0.8rem;  color: #ef4444; }

        .cd-submit {
          width: 100%; padding: 0.875rem;
          background: var(--text-primary); color: var(--bg-primary);
          border: none; border-radius: var(--radius-md);
          font-size: 0.9rem; font-family: inherit;
          cursor: pointer; transition: opacity var(--transition-fast);
        }
        .cd-submit:hover:not(:disabled) { opacity: 0.85; }
        .cd-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </>
  );
}

// ── Work card ─────────────────────────────────────────────────────────────────

function AcquireCard({
  item,
  inCart,
  onDetail,
  onDirect,
  onAddToCart,
}: {
  item: AcquireItem;
  inCart: boolean;
  onDetail:    () => void;
  onDirect:    () => void;
  onAddToCart: () => void;
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
      {/* Image */}
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
        {imgCount > 1 && (
          <span className="ac-img-count">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            {imgCount}
          </span>
        )}
        {inCart && (
          <span className="ac-in-cart-badge">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 8l4 4 6-7"/></svg>
            {isAr ? "في السلة" : "In Cart"}
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

        <div className="ac-actions">
          {!hasStock ? (
            <button className="ac-btn-sold" disabled>{t("soldOut")}</button>
          ) : (
            <>
              <button className="ac-btn-direct" onClick={onDirect}>
                {isAr ? "اقتناء مباشر" : "Acquire Now"}
              </button>
              <button
                className={`ac-btn-cart ${inCart ? "ac-btn-cart--in-cart" : ""}`}
                onClick={onAddToCart}
                title={isAr ? "أضف للسلة" : "Add to Cart"}
              >
                {inCart ? (
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 8l4 4 6-7"/></svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 01-8 0"/>
                  </svg>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AcquireClient({ items }: Props) {
  const locale = useLocale();
  const isAr   = locale === "ar";
  const dir    = isAr ? "rtl" as const : "ltr" as const;

  const [cart,        setCart]       = useState<CartItem[]>([]);
  const [cartOpen,    setCartOpen]   = useState(false);
  const [detailItem,  setDetailItem] = useState<AcquireItem | null>(null);
  const [directItem,  setDirectItem] = useState<AcquireItem | null>(null);

  const addToCart = useCallback((item: AcquireItem) => {
    setCart((prev) => {
      if (prev.find((ci) => ci.item.id === item.id)) {
        // Already in cart — just open the drawer
        setCartOpen(true);
        return prev;
      }
      const firstAvail = item.sizes.find((s) => s.soldEditions < s.totalEditions);
      return [
        ...prev,
        {
          item,
          sizeId:        firstAvail?.id ?? "",
          framingOption: "without_frame",
          quantity:      1,
        },
      ];
    });
    setCartOpen(true);
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.item.id !== itemId));
  }, []);

  const updateSize = useCallback((itemId: string, sizeId: string) => {
    setCart((prev) => prev.map((ci) => ci.item.id === itemId ? { ...ci, sizeId } : ci));
  }, []);

  const updateFraming = useCallback((itemId: string, opt: "with_frame" | "without_frame") => {
    setCart((prev) => prev.map((ci) => ci.item.id === itemId ? { ...ci, framingOption: opt } : ci));
  }, []);

  const updateQty = useCallback((itemId: string, qty: number) => {
    setCart((prev) => prev.map((ci) => ci.item.id === itemId ? { ...ci, quantity: qty } : ci));
  }, []);

  const handleSubmitSuccess = useCallback(() => {
    // Clear cart after a short delay (let success screen show)
    setTimeout(() => {
      setCart([]);
      setCartOpen(false);
    }, 3500);
  }, []);

  return (
    <>
      <div className="ac-grid container" dir={dir}>
        {items.map((item) => (
          <AcquireCard
            key={item.id}
            item={item}
            inCart={cart.some((ci) => ci.item.id === item.id)}
            onDetail={() => setDetailItem(item)}
            onDirect={() => setDirectItem(item)}
            onAddToCart={() => addToCart(item)}
          />
        ))}
      </div>

      {/* Floating cart FAB */}
      <AnimatePresence>
        {cart.length > 0 && !cartOpen && (
          <motion.button
            className="ac-cart-fab"
            dir={dir}
            initial={{ scale: 0.7, opacity: 0, y: 20 }}
            animate={{ scale: 1,   opacity: 1, y: 0  }}
            exit={{    scale: 0.7, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setCartOpen(true)}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span className="ac-cart-fab-label">{isAr ? "السلة" : "Cart"}</span>
            <span className="ac-cart-fab-badge">{cart.length}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {detailItem && (
          <ItemDetailModal
            key={`detail-${detailItem.id}`}
            item={detailItem}
            inCart={cart.some((ci) => ci.item.id === detailItem.id)}
            onClose={() => setDetailItem(null)}
            onDirect={() => { setDetailItem(null); setDirectItem(detailItem); }}
            onAddToCart={() => { setDetailItem(null); addToCart(detailItem); }}
          />
        )}
      </AnimatePresence>

      {/* Direct order modal */}
      <AnimatePresence>
        {directItem && (
          <OrderModal
            key={`direct-${directItem.id}`}
            item={directItem}
            onClose={() => setDirectItem(null)}
          />
        )}
      </AnimatePresence>

      {/* Cart drawer */}
      <CartDrawer
        cart={cart}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        isAr={isAr}
        onSizeChange={updateSize}
        onFramingChange={updateFraming}
        onQtyChange={updateQty}
        onRemove={removeFromCart}
        onSubmitSuccess={handleSubmitSuccess}
      />

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

        .ac-card {
          border: 1px solid var(--border); border-radius: var(--radius-lg);
          overflow: hidden; background: var(--bg-primary);
          transition: box-shadow var(--transition-base);
        }
        .ac-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.07); }

        .ac-img-wrap {
          position: relative; padding-bottom: 72%;
          background: var(--bg-secondary); overflow: hidden;
        }

        .ac-shimmer {
          position: absolute; inset: 0; z-index: 1;
          background: linear-gradient(90deg, var(--bg-secondary) 0%, var(--bg-tertiary) 50%, var(--bg-secondary) 100%);
          background-size: 200% 100%;
          animation: ac-shimmer 1.6s infinite;
          transition: opacity 0.4s;
        }
        .ac-shimmer--done { opacity: 0; pointer-events: none; }
        @keyframes ac-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .ac-img { object-fit: cover; transition: transform 600ms ease, opacity 0.45s; opacity: 0; }
        .ac-img--loaded { opacity: 1; }
        .ac-card:hover .ac-img { transform: scale(1.03); }

        .ac-img-count {
          position: absolute; bottom: 0.6rem; right: 0.6rem;
          background: rgba(0,0,0,0.55); color: #fff;
          font-size: 0.7rem; padding: 0.2rem 0.5rem;
          border-radius: 999px;
          display: flex; align-items: center; gap: 0.3rem;
          z-index: 2;
        }

        .ac-in-cart-badge {
          position: absolute; top: 0.6rem; left: 0.6rem;
          background: rgba(0,0,0,0.65); color: #fff;
          font-size: 0.68rem; padding: 0.2rem 0.55rem;
          border-radius: 999px;
          display: flex; align-items: center; gap: 0.3rem;
          z-index: 2; backdrop-filter: blur(4px);
        }

        .ac-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
        .ac-meta { display: flex; flex-direction: column; gap: 0.2rem; }
        .ac-code { font-size: 0.68rem; color: var(--text-subtle); letter-spacing: 0.06em; }
        .ac-title { font-family: var(--font-heading); font-size: 1.1rem; font-weight: 400; color: var(--text-primary); }
        .ac-location { font-size: 0.78rem; color: var(--text-muted); }
        .ac-sizes { display: flex; flex-direction: column; }
        .ac-size-row { display: flex; justify-content: space-between; align-items: center; padding: 0.45rem 0; border-bottom: 1px solid var(--border-subtle); font-size: 0.8rem; }
        .ac-size-label { color: var(--text-secondary); }
        .ac-size-info  { color: var(--text-muted); font-size: 0.75rem; }
        .ac-size-row--sold .ac-size-label,
        .ac-size-row--sold .ac-size-info { color: var(--text-subtle); text-decoration: line-through; text-decoration-color: var(--border); }

        .ac-actions { display: flex; gap: 0.5rem; width: 100%; }

        /* "اقتناء مباشر" — primary, text */
        .ac-btn-direct {
          flex: 1;
          padding: 0.7rem 0.5rem;
          background: var(--text-primary); color: var(--bg-primary);
          border: none; border-radius: var(--radius-md);
          font-size: 0.82rem; font-family: inherit;
          white-space: nowrap; cursor: pointer;
          transition: opacity var(--transition-fast);
          overflow: hidden; text-overflow: ellipsis;
        }
        .ac-btn-direct:hover { opacity: 0.82; }

        /* "إضافة للسلة" — icon-only square button */
        .ac-btn-cart {
          width: 40px; height: 40px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-secondary); color: var(--text-primary);
          border: 1.5px solid var(--border); border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .ac-btn-cart:hover { border-color: var(--text-primary); }
        .ac-btn-cart--in-cart { border-color: var(--text-primary); background: var(--bg-primary); }

        /* Sold out full-width */
        .ac-btn-sold {
          width: 100%; padding: 0.7rem;
          background: var(--bg-tertiary); color: var(--text-subtle);
          border: none; border-radius: var(--radius-md);
          font-size: 0.875rem; font-family: inherit; cursor: not-allowed;
        }

        /* Floating cart button */
        .ac-cart-fab {
          position: fixed; bottom: 2rem; inset-inline-end: 2rem; z-index: 50;
          display: flex; align-items: center; gap: 0.55rem;
          padding: 0.8rem 1.25rem;
          background: var(--text-primary); color: var(--bg-primary);
          border: none; border-radius: 999px;
          font-size: 0.875rem; font-family: inherit; font-weight: 500;
          cursor: pointer;
          box-shadow: 0 8px 32px rgba(0,0,0,0.22);
          transition: transform 150ms, box-shadow 150ms;
        }
        .ac-cart-fab:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.28); }
        .ac-cart-fab-label {}
        .ac-cart-fab-badge {
          background: var(--bg-primary); color: var(--text-primary);
          width: 22px; height: 22px; border-radius: 50%;
          font-size: 0.72rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
      `}</style>
    </>
  );
}
