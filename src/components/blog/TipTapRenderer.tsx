"use client";

import { useState, useCallback, useEffect, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

type Mark = {
  type: string;
  attrs?: Record<string, unknown>;
};

type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  marks?: Mark[];
  content?: TipTapNode[];
  text?: string;
};

export type GalleryImageEntry = string | { src: string; alt?: string };

function resolveGallerySrc(entry: GalleryImageEntry): { src: string; alt: string } {
  if (typeof entry === "string") return { src: entry, alt: "" };
  return { src: entry.src ?? "", alt: entry.alt ?? "" };
}

// ── Lightbox context ──────────────────────────────────────────────────────────

interface LightboxCtx {
  open: (images: { src: string; alt: string }[], startIndex: number) => void;
}

const LightboxContext = createContext<LightboxCtx>({ open: () => {} });

// ── Mark renderer ─────────────────────────────────────────────────────────────

function applyMarks(text: string, marks?: Mark[]): React.ReactNode {
  if (!marks?.length) return text;
  return marks.reduce<React.ReactNode>((node, mark) => {
    switch (mark.type) {
      case "bold":        return <strong>{node}</strong>;
      case "italic":      return <em>{node}</em>;
      case "underline":   return <u>{node}</u>;
      case "strike":      return <s>{node}</s>;
      case "code":        return <code className="ttr-inline-code">{node}</code>;
      case "link":        return (
        <a href={(mark.attrs?.href as string) ?? "#"} target={(mark.attrs?.target as string) ?? "_blank"} rel="noopener noreferrer" className="ttr-link">{node}</a>
      );
      case "textStyle": {
        const style: React.CSSProperties = {};
        if (mark.attrs?.color) style.color = mark.attrs.color as string;
        if (mark.attrs?.fontSize) style.fontSize = mark.attrs.fontSize as string;
        return Object.keys(style).length ? <span style={style}>{node}</span> : node;
      }
      default: return node;
    }
  }, text as React.ReactNode);
}

// ── Gallery image card ────────────────────────────────────────────────────────

function GalleryImageCard({ entry, onOpen, fullWidth }: { entry: GalleryImageEntry; onOpen: () => void; fullWidth?: boolean }) {
  const { src, alt } = resolveGallerySrc(entry);
  if (!src) return null;
  return (
    <div className={`ttr-gallery-item${fullWidth ? " ttr-gallery-item--full" : ""}`} onClick={onOpen} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && onOpen()}>
      <div className="ttr-gallery-img-box">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="ttr-gallery-img" loading="lazy" />
      </div>
    </div>
  );
}

// ── Single clickable image ────────────────────────────────────────────────────

function SingleImage({ src, alt }: { src: string; alt: string }) {
  const lb = useContext(LightboxContext);
  return (
    <figure className="ttr-figure" onClick={() => lb.open([{ src, alt }], 0)} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && lb.open([{ src, alt }], 0)}>
      <div className="ttr-figure-img-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="ttr-figure-img" loading="lazy" />
      </div>
      {alt && <figcaption className="ttr-caption">{alt}</figcaption>}
    </figure>
  );
}

// ── Gallery block ────────────────────────────────────────────────────────────

function GalleryBlock({ images, cols }: { images: GalleryImageEntry[]; cols: number }) {
  const lb = useContext(LightboxContext);
  const resolved = images.map(resolveGallerySrc);
  const count = resolved.length;
  // Smart layout: if last row has exactly 1 lonely image, make it full-width
  const lastIsFull = count > cols && count % cols === 1;
  return (
    <div className="ttr-gallery" style={{ "--gallery-cols": cols } as React.CSSProperties}>
      {resolved.map((img, i) => (
        <GalleryImageCard
          key={i}
          entry={img}
          onOpen={() => lb.open(resolved, i)}
          fullWidth={lastIsFull && i === count - 1}
        />
      ))}
    </div>
  );
}

// ── Slideshow block ──────────────────────────────────────────────────────────

function SlideshowBlock({ images }: { images: GalleryImageEntry[] }) {
  const lb = useContext(LightboxContext);
  const resolved = images.map(resolveGallerySrc);
  const count = resolved.length;
  const [current, setCurrent] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  if (!count) return null;
  const img = resolved[current];

  function prev() { setCurrent((c) => (c > 0 ? c - 1 : count - 1)); }
  function next() { setCurrent((c) => (c < count - 1 ? c + 1 : 0)); }

  function onTouchStart(e: React.TouchEvent) {
    setTouchStartX(e.touches[0].clientX);
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX === null) return;
    const delta = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) {
      if (delta > 0) next(); else prev();
    }
    setTouchStartX(null);
  }

  return (
    <div className="ttr-slideshow">
      {/* Main image */}
      <div
        className="ttr-ss-stage"
        onClick={() => lb.open(resolved, current)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === "Enter" && lb.open(resolved, current)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={current} src={img.src} alt={img.alt} className="ttr-ss-img" loading="lazy" />

        {count > 1 && (
          <button className="ttr-ss-arrow ttr-ss-prev" onClick={e => { e.stopPropagation(); prev(); }} aria-label="السابق">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 4l-6 4 6 4" /></svg>
          </button>
        )}
        {count > 1 && (
          <button className="ttr-ss-arrow ttr-ss-next" onClick={e => { e.stopPropagation(); next(); }} aria-label="التالي">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 4l6 4-6 4" /></svg>
          </button>
        )}

        {count > 1 && (
          <div className="ttr-ss-counter" dir="ltr">{current + 1} / {count}</div>
        )}
      </div>

      {/* Dots */}
      {count > 1 && (
        <div className="ttr-ss-dots">
          {resolved.map((_, i) => (
            <button key={i} className={`ttr-ss-dot${i === current ? " active" : ""}`} onClick={() => setCurrent(i)} aria-label={`صورة ${i + 1}`} />
          ))}
        </div>
      )}

      <style>{`@keyframes ttr-ss-fade { from { opacity: 0.4; } to { opacity: 1; } }`}</style>
    </div>
  );
}

// ── Node renderer ─────────────────────────────────────────────────────────────

function renderNode(node: TipTapNode, index: number): React.ReactNode {
  switch (node.type) {
    case "doc":
      return (
        <div key={index} className="ttr-doc">
          {node.content?.map((c, i) => renderNode(c, i))}
        </div>
      );
    case "paragraph": {
      const children = node.content?.map((c, i) => renderNode(c, i));
      const align = node.attrs?.textAlign as string | undefined;
      return <p key={index} className="ttr-p" style={align ? { textAlign: align as React.CSSProperties["textAlign"] } : undefined}>{children?.length ? children : <br />}</p>;
    }
    case "text":
      return <span key={index}>{applyMarks(node.text ?? "", node.marks)}</span>;
    case "hardBreak":
      return <br key={index} />;
    case "heading": {
      const lvl = (node.attrs?.level as number) ?? 2;
      const children = node.content?.map((c, i) => renderNode(c, i));
      const align = node.attrs?.textAlign as string | undefined;
      const style = align ? { textAlign: align as React.CSSProperties["textAlign"] } : undefined;
      if (lvl === 1) return <h1 key={index} className="ttr-h ttr-h1" style={style}>{children}</h1>;
      if (lvl === 3) return <h3 key={index} className="ttr-h ttr-h3" style={style}>{children}</h3>;
      if (lvl === 4) return <h4 key={index} className="ttr-h ttr-h4" style={style}>{children}</h4>;
      return <h2 key={index} className="ttr-h ttr-h2" style={style}>{children}</h2>;
    }
    case "bulletList":
      return <ul key={index} className="ttr-ul">{node.content?.map((c, i) => renderNode(c, i))}</ul>;
    case "orderedList":
      return <ol key={index} className="ttr-ol">{node.content?.map((c, i) => renderNode(c, i))}</ol>;
    case "listItem":
      return <li key={index} className="ttr-li">{node.content?.map((c, i) => renderNode(c, i))}</li>;
    case "blockquote":
      return <blockquote key={index} className="ttr-quote">{node.content?.map((c, i) => renderNode(c, i))}</blockquote>;
    case "horizontalRule":
      return <hr key={index} className="ttr-hr" />;
    case "codeBlock":
      return (
        <pre key={index} className="ttr-codeblock">
          <code>{node.content?.map((c) => c.text ?? "").join("")}</code>
        </pre>
      );
    case "image": {
      const src = node.attrs?.src as string;
      const alt = (node.attrs?.alt as string) ?? "";
      if (!src) return null;
      return <SingleImage key={index} src={src} alt={alt} />;
    }
    case "gallery": {
      const rawImages = (node.attrs?.images as GalleryImageEntry[]) ?? [];
      const cols = (node.attrs?.columns as number) ?? 2;
      const display = (node.attrs?.display as string) ?? "grid";
      if (!rawImages.length) return null;
      if (display === "slideshow") return <SlideshowBlock key={index} images={rawImages} />;
      return <GalleryBlock key={index} images={rawImages} cols={cols} />;
    }
    case "youtube": {
      const src = node.attrs?.src as string;
      if (!src) return null;
      const embed = src.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/").split("&")[0];
      return (
        <div key={index} className="ttr-video-wrap">
          <iframe src={embed} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" title="Video" className="ttr-video" />
        </div>
      );
    }
    default:
      if (node.content) return <div key={index}>{node.content.map((c, i) => renderNode(c, i))}</div>;
      return null;
  }
}

// ── Lightbox component ────────────────────────────────────────────────────────

interface LbState {
  images: { src: string; alt: string }[];
  index: number;
}

function Lightbox({ state, onClose }: { state: LbState; onClose: () => void }) {
  const [current, setCurrent] = useState(state.index);
  const [dir, setDir] = useState(0);
  const img = state.images[current];

  const prev = useCallback(() => {
    if (current > 0) { setDir(-1); setCurrent(c => c - 1); }
  }, [current]);

  const next = useCallback(() => {
    if (current < state.images.length - 1) { setDir(1); setCurrent(c => c + 1); }
  }, [current, state.images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <motion.div
      className="ttr-lb"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      {/* Close */}
      <button className="ttr-lb-close" onClick={onClose} aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M14.5 3.5l-11 11M3.5 3.5l11 11"/>
        </svg>
      </button>

      {/* Counter */}
      {state.images.length > 1 && (
        <div className="ttr-lb-counter">{current + 1} / {state.images.length}</div>
      )}

      {/* Prev/Next */}
      {current > 0 && (
        <button className="ttr-lb-arrow ttr-lb-prev" onClick={e => { e.stopPropagation(); prev(); }} aria-label="Previous">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12.5 4l-5.5 6 5.5 6"/></svg>
        </button>
      )}
      {current < state.images.length - 1 && (
        <button className="ttr-lb-arrow ttr-lb-next" onClick={e => { e.stopPropagation(); next(); }} aria-label="Next">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7.5 4l5.5 6-5.5 6"/></svg>
        </button>
      )}

      {/* Image */}
      <div className="ttr-lb-stage" onClick={e => e.stopPropagation()}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={current}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="ttr-lb-img-wrap"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img?.src ?? ""} alt={img?.alt ?? ""} className="ttr-lb-img" />
          </motion.div>
        </AnimatePresence>
        {img?.alt && <div className="ttr-lb-caption">{img.alt}</div>}
      </div>
    </motion.div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

interface Props {
  content: object;
  dir?: "rtl" | "ltr";
}

export default function TipTapRenderer({ content, dir = "ltr" }: Props) {
  const [lbState, setLbState] = useState<LbState | null>(null);

  const openLightbox = useCallback((images: { src: string; alt: string }[], startIndex: number) => {
    setLbState({ images, index: startIndex });
  }, []);

  return (
    <LightboxContext.Provider value={{ open: openLightbox }}>
      <div className="ttr-root" dir={dir}>
        {renderNode(content as TipTapNode, 0)}
      </div>

      <AnimatePresence>
        {lbState && (
          <Lightbox state={lbState} onClose={() => setLbState(null)} />
        )}
      </AnimatePresence>

      <style>{`
        /* ── Root ── */
        .ttr-root {
          font-size: clamp(1rem, 1.5vw, 1.125rem);
          line-height: 1.85;
          color: var(--text-secondary);
          font-feature-settings: "kern" 1, "liga" 1;
        }

        /* ── Paragraph ── */
        .ttr-p { margin: 0 0 1.6rem; }
        .ttr-p:last-child { margin-bottom: 0; }

        /* ── Headings ── */
        .ttr-h {
          font-family: var(--font-heading);
          font-weight: 400;
          color: var(--text-primary);
          line-height: 1.25;
          letter-spacing: -0.01em;
        }
        .ttr-h1 { font-size: clamp(1.75rem, 4vw, 2.5rem); margin: 3rem 0 1.25rem; }
        .ttr-h2 { font-size: clamp(1.35rem, 2.5vw, 1.75rem); margin: 2.5rem 0 1rem; }
        .ttr-h3 { font-size: clamp(1.15rem, 2vw, 1.35rem); margin: 2rem 0 0.75rem; }
        .ttr-h4 { font-size: 1.1rem; margin: 1.75rem 0 0.6rem; }
        .ttr-h:first-child { margin-top: 0; }

        /* ── Lists ── */
        .ttr-ul, .ttr-ol { padding-inline-start: 1.6rem; margin: 0 0 1.6rem; }
        .ttr-li { margin-bottom: 0.45rem; }
        .ttr-li > .ttr-p { margin-bottom: 0; }

        /* ── Blockquote ── */
        .ttr-quote {
          border-inline-start: 3px solid var(--border);
          margin: 2rem 0;
          padding: 0.25rem 0 0.25rem 1.5rem;
          color: var(--text-muted);
          font-style: italic;
        }
        .ttr-quote .ttr-p:last-child { margin-bottom: 0; }

        /* ── HR ── */
        .ttr-hr { border: none; border-top: 1px solid var(--border); margin: 3rem 0; }

        /* ── Inline code ── */
        .ttr-inline-code {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          padding: 0.1em 0.45em;
          border-radius: 4px;
          font-size: 0.875em;
          font-family: "Menlo", "Monaco", "Fira Code", monospace;
        }

        /* ── Code block ── */
        .ttr-codeblock {
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 1.4rem 1.5rem;
          overflow-x: auto;
          margin: 2rem 0;
          font-family: "Menlo", "Monaco", "Fira Code", monospace;
          font-size: 0.875rem;
          line-height: 1.7;
          color: var(--text-secondary);
        }

        /* ── Link ── */
        .ttr-link {
          color: var(--text-primary);
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-color: var(--border);
          transition: text-decoration-color var(--transition-fast);
        }
        .ttr-link:hover { text-decoration-color: var(--text-primary); }

        /* ── Figure / single image ── */
        .ttr-figure {
          margin: 2.5rem 0;
          cursor: pointer;
        }

        .ttr-figure-img-wrap {
          width: 100%;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--bg-secondary);
        }

        .ttr-figure-img {
          width: 100%;
          height: auto;
          display: block;
          transition: transform 500ms ease, opacity 0.4s;
        }

        .ttr-figure:hover .ttr-figure-img { transform: scale(1.01); opacity: 0.95; }

        .ttr-caption {
          margin-top: 0.6rem;
          text-align: center;
          font-size: 0.8rem;
          color: var(--text-subtle);
          font-style: italic;
        }

        /* ── Gallery ── */
        .ttr-gallery {
          display: grid;
          grid-template-columns: repeat(var(--gallery-cols, 2), 1fr);
          gap: 4px;
          margin: 2.5rem 0;
          width: 100%;
        }

        @media (max-width: 480px) {
          .ttr-gallery { grid-template-columns: repeat(2, 1fr); }
        }

        .ttr-gallery-item {
          overflow: hidden;
          cursor: pointer;
          background: var(--bg-secondary);
        }

        /* Full-width lonely last item */
        .ttr-gallery-item--full {
          grid-column: 1 / -1;
        }

        /* Padding-bottom trick for reliable fixed aspect ratio */
        .ttr-gallery-img-box {
          position: relative;
          width: 100%;
          padding-bottom: 100%; /* 1:1 square */
          overflow: hidden;
        }

        .ttr-gallery-item--full .ttr-gallery-img-box {
          padding-bottom: 50%; /* 2:1 wide */
        }

        .ttr-gallery-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 500ms ease;
        }

        .ttr-gallery-item:hover .ttr-gallery-img { transform: scale(1.04); }

        /* ── Slideshow ── */
        .ttr-slideshow {
          margin: 2.5rem 0;
        }

        .ttr-ss-stage {
          position: relative;
          aspect-ratio: 16/9;
          overflow: hidden;
          cursor: pointer;
          border-radius: var(--radius-md);
        }

        .ttr-ss-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          animation: ttr-ss-fade 0.35s ease;
        }

        .ttr-ss-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0,0,0,0.28);
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          color: rgba(255,255,255,0.9);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          transition: background 150ms;
          backdrop-filter: blur(4px);
        }
        .ttr-ss-arrow:hover { background: rgba(0,0,0,0.55); }
        .ttr-ss-prev { left: 0.625rem; }
        .ttr-ss-next { right: 0.625rem; }

        .ttr-ss-counter {
          position: absolute;
          bottom: 0.6rem;
          right: 0.75rem;
          color: rgba(255,255,255,0.75);
          font-size: 0.62rem;
          letter-spacing: 0.06em;
          z-index: 2;
          white-space: nowrap;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
        }

        .ttr-ss-dots {
          display: flex;
          justify-content: center;
          gap: 5px;
          padding: 0.6rem 0 0.1rem;
        }

        .ttr-ss-dot {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          background: var(--border);
          padding: 0;
          transition: all 0.25s ease;
        }
        .ttr-ss-dot.active {
          width: 14px;
          background: var(--text-secondary);
        }

        /* ── Video ── */
        .ttr-video-wrap {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          overflow: hidden;
          margin: 2.5rem 0;
          border-radius: var(--radius-md);
          background: var(--bg-tertiary);
        }
        .ttr-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
          border-radius: var(--radius-md);
        }

        /* ── Doc wrapper ── */
        .ttr-doc > *:first-child { margin-top: 0 !important; }
        .ttr-doc > *:last-child  { margin-bottom: 0 !important; }

        /* ── Lightbox ── */
        .ttr-lb {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0,0,0,0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .ttr-lb-close {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          z-index: 2;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: var(--radius-md);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.75);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .ttr-lb-close:hover { background: rgba(255,255,255,0.12); color: #fff; }

        .ttr-lb-counter {
          position: absolute;
          top: 1.5rem;
          left: 1.5rem;
          font-size: 0.72rem;
          color: rgba(255,255,255,0.38);
          letter-spacing: 0.06em;
        }

        .ttr-lb-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: var(--radius-md);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .ttr-lb-arrow:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .ttr-lb-prev { left: 1.25rem; }
        .ttr-lb-next { right: 1.25rem; }

        @media (max-width: 640px) {
          .ttr-lb-arrow { display: none; }
        }

        .ttr-lb-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: min(90vw, 1100px);
          max-height: 90svh;
          width: 100%;
        }

        .ttr-lb-img-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          max-height: 85svh;
          width: 100%;
        }

        .ttr-lb-img {
          max-width: 100%;
          max-height: 85svh;
          width: auto;
          height: auto;
          object-fit: contain;
          border-radius: var(--radius-sm);
          display: block;
        }

        .ttr-lb-caption {
          margin-top: 0.75rem;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.45);
          font-style: italic;
          text-align: center;
        }
      `}</style>
    </LightboxContext.Provider>
  );
}
