"use client";

import {
  Node,
  mergeAttributes,
  NodeViewProps,
} from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useRef, useState } from "react";

// ── Resolve image entry (string or {src,alt} object) ─────────────────────────

type ImageEntry = string | { src: string; alt?: string };

function resolveEntry(entry: ImageEntry): { src: string; alt: string } {
  if (typeof entry === "string") return { src: entry, alt: "" };
  return { src: entry.src ?? "", alt: entry.alt ?? "" };
}

// ── Grid Gallery View ─────────────────────────────────────────────────────────

function GalleryView({ node, updateAttributes, selected }: NodeViewProps) {
  const rawImages: ImageEntry[] = node.attrs.images ?? [];
  const columns: number = node.attrs.columns ?? 2;
  const count = rawImages.length;

  const [hoveredIdx, setHoveredIdx]   = useState<number | null>(null);
  const [dragIdx,    setDragIdx]      = useState<number | null>(null);
  const [overIdx,    setOverIdx]      = useState<number | null>(null);
  const dragNode = useRef<number | null>(null);

  const lastIsFull = count > columns && count % columns === 1;

  function removeImage(idx: number) {
    updateAttributes({ images: rawImages.filter((_, i) => i !== idx) });
  }

  function handleDragStart(e: React.DragEvent, idx: number) {
    dragNode.current = idx;
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    const ghost = document.createElement("div");
    ghost.style.cssText = "position:absolute;top:-9999px;width:1px;height:1px;";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }

  function handleDragEnter(idx: number) {
    if (dragNode.current === null || dragNode.current === idx) return;
    setOverIdx(idx);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, idx: number) {
    e.preventDefault();
    const from = dragNode.current;
    if (from === null || from === idx) return;
    const next = [...rawImages];
    const [moved] = next.splice(from, 1);
    next.splice(idx, 0, moved);
    updateAttributes({ images: next });
    setDragIdx(null); setOverIdx(null); dragNode.current = null;
  }

  function handleDragEnd() {
    setDragIdx(null); setOverIdx(null); dragNode.current = null;
  }

  return (
    <NodeViewWrapper
      contentEditable={false}
      data-type="gallery"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: "4px",
        margin: "2.5rem 0",
        width: "100%",
        outline: selected ? "2px solid var(--text-primary)" : "none",
        outlineOffset: "2px",
        borderRadius: selected ? "var(--radius-sm)" : "0",
      }}
    >
      {rawImages.map((entry, i) => {
        const { src, alt } = resolveEntry(entry);
        const isFull    = lastIsFull && i === count - 1;
        const isDragging = dragIdx === i;
        const isOver    = overIdx === i && dragIdx !== i;

        return (
          <div
            key={i}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragEnter={() => handleDragEnter(i)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              position: "relative",
              overflow: "hidden",
              background: "var(--bg-secondary)",
              aspectRatio: isFull ? "16/9" : "1",
              gridColumn: isFull ? "1 / -1" : undefined,
              cursor: "grab",
              opacity: isDragging ? 0.35 : 1,
              outline: isOver ? "2px solid var(--text-primary)" : "none",
              outlineOffset: "-2px",
              transition: "opacity 200ms, outline 100ms",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} loading="lazy" draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
                transition: "transform 300ms ease", userSelect: "none", pointerEvents: "none",
                transform: hoveredIdx === i && !dragIdx ? "scale(1.04)" : "scale(1)" }} />
            {hoveredIdx === i && !dragIdx && (
              <div style={{ position: "absolute", bottom: "0.375rem", left: "50%",
                transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", borderRadius: "4px",
                padding: "3px 6px", display: "flex", gap: "2px", pointerEvents: "none" }}>
                {[0,1,2].map((col) => (
                  <div key={col} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {[0,1].map((row) => (
                      <div key={row} style={{ width: "3px", height: "3px", borderRadius: "50%", background: "rgba(255,255,255,0.8)" }} />
                    ))}
                  </div>
                ))}
              </div>
            )}
            {hoveredIdx === i && !dragIdx && (
              <button onClick={() => removeImage(i)} title="حذف الصورة"
                style={{ position: "absolute", top: "0.375rem", right: "0.375rem",
                  background: "rgba(0,0,0,0.7)", color: "#fff", border: "none",
                  borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer",
                  fontSize: "0.875rem", display: "flex", alignItems: "center",
                  justifyContent: "center", lineHeight: 1 }}>×</button>
            )}
          </div>
        );
      })}
    </NodeViewWrapper>
  );
}

// ── Slideshow View ────────────────────────────────────────────────────────────

function SlideshowView({ node, updateAttributes, selected }: NodeViewProps) {
  const rawImages: ImageEntry[] = node.attrs.images ?? [];
  const count = rawImages.length;
  const [current, setCurrent] = useState(0);

  if (!count) return <NodeViewWrapper contentEditable={false} data-type="gallery" />;

  const { src, alt } = resolveEntry(rawImages[current]);

  function prev() { setCurrent((c) => (c > 0 ? c - 1 : count - 1)); }
  function next() { setCurrent((c) => (c < count - 1 ? c + 1 : 0)); }
  function removeImage() {
    const next = rawImages.filter((_, i) => i !== current);
    updateAttributes({ images: next });
    setCurrent((c) => Math.min(c, next.length - 1));
  }

  return (
    <NodeViewWrapper
      contentEditable={false}
      data-type="gallery"
      style={{
        margin: "2.5rem 0",
        outline: selected ? "2px solid var(--text-primary)" : "none",
        outlineOffset: "2px",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        background: "var(--bg-secondary)",
      }}
    >
      {/* Main image */}
      <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={current} src={src} alt={alt} loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
            animation: "ss-fade 0.35s ease" }} />

        {/* Prev */}
        {count > 1 && (
          <button onClick={prev}
            style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%",
              width: "36px", height: "36px", color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M10 4l-6 4 6 4" />
            </svg>
          </button>
        )}
        {/* Next */}
        {count > 1 && (
          <button onClick={next}
            style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
              background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%",
              width: "36px", height: "36px", color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 4l6 4-6 4" />
            </svg>
          </button>
        )}
        {/* Delete */}
        <button onClick={removeImage} title="حذف الصورة الحالية"
          style={{ position: "absolute", top: "0.5rem", right: "0.5rem",
            background: "rgba(0,0,0,0.7)", color: "#fff", border: "none",
            borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer",
            fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 2 }}>×</button>
        {/* Counter */}
        <div dir="ltr" style={{ position: "absolute", bottom: "0.6rem", left: "50%",
          transform: "translateX(-50%)", background: "rgba(0,0,0,0.5)",
          color: "#fff", fontSize: "0.72rem", padding: "2px 8px",
          borderRadius: "999px", zIndex: 2, whiteSpace: "nowrap" }}>
          {current + 1} / {count}
        </div>
      </div>

      {/* Dots */}
      {count > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "6px", padding: "0.6rem 0" }}>
          {rawImages.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              style={{ width: i === current ? "18px" : "6px", height: "6px",
                borderRadius: "999px", border: "none", cursor: "pointer",
                background: i === current ? "var(--text-primary)" : "var(--border)",
                padding: 0, transition: "all 0.25s ease" }} />
          ))}
        </div>
      )}

      <style>{`@keyframes ss-fade { from { opacity: 0.4; } to { opacity: 1; } }`}</style>
    </NodeViewWrapper>
  );
}

// ── TipTap Node Definition ────────────────────────────────────────────────────

export const GalleryExtension = Node.create({
  name: "gallery",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      images:  { default: [] },
      columns: { default: 2 },
      display: { default: "grid" },   // "grid" | "slideshow"
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="gallery"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "gallery" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer((props: NodeViewProps) =>
      props.node.attrs.display === "slideshow"
        ? <SlideshowView {...props} />
        : <GalleryView {...props} />
    );
  },
});
