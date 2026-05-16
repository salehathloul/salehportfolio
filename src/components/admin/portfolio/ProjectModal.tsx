"use client";

/**
 * ProjectModal.tsx
 * Modal لإنشاء أو تعديل مشروع فوتوغرافي.
 * - رفع صور متعددة دفعة واحدة مع شريط تقدم لكل صورة
 * - سحب وإفلات لإعادة الترتيب (dnd-kit)
 * - أول صورة = غلاف المشروع (قابلة للتغيير بالنقر)
 * - حقل showInPortfolio للتحكم في ظهوره في المعرض
 */

import { useState, useCallback, useRef } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, rectSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";

// ── Types ─────────────────────────────────────────────────

export interface AdminProject {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  coverImage: string;
  isPublished: boolean;
  showInPortfolio: boolean;
  _count: { images: number };
}

interface UploadedImage {
  tempId: string;
  url: string;
  width: number;
  height: number;
  status: "uploading" | "done" | "error";
  errorMsg?: string;
  name: string;          // original filename (for display)
  captionAr: string;
  captionEn: string;
}

interface Props {
  project?: AdminProject;          // undefined = create new
  onClose: () => void;
  onSaved: (p: AdminProject) => void;
}

// ── Slug helper ───────────────────────────────────────────

function toSlug(str: string): string {
  const s = str
    .toLowerCase()
    .replace(/[؀-ۿ\s]+/g, "-")    // Arabic chars → dash
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
  // Fallback for Arabic-only titles that produce empty slug
  return s || `project-${Date.now()}`;
}

// ── Upload a single file to /api/upload ───────────────────

async function uploadFile(file: File, folder: string): Promise<{ url: string; width: number; height: number }> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "فشل رفع الصورة");
  }
  const data = await res.json();
  return { url: data.url, width: data.width ?? 0, height: data.height ?? 0 };
}

// ── Sortable image thumbnail ──────────────────────────────

function SortableThumb({
  img,
  index,
  isCover,
  onSetCover,
  onRemove,
  onCaptionChange,
}: {
  img: UploadedImage;
  index: number;
  isCover: boolean;
  onSetCover: () => void;
  onRemove: () => void;
  onCaptionChange: (field: "captionAr" | "captionEn", value: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: img.tempId,
    disabled: img.status !== "done",
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`pm-card ${isCover ? "pm-card--cover" : ""} ${img.status === "uploading" ? "pm-card--uploading" : ""}`}>

      {/* ── Thumbnail ── */}
      <div className="pm-card-thumb">
        {/* Drag handle */}
        {img.status === "done" && (
          <div className="pm-thumb-drag" {...attributes} {...listeners} title="اسحب لإعادة الترتيب">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
              <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
              <circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>
            </svg>
          </div>
        )}

        {/* Image */}
        <div className="pm-thumb-img-wrap">
          {img.status === "done" ? (
            <Image src={img.url} alt="" fill className="pm-thumb-img" sizes="160px" />
          ) : img.status === "uploading" ? (
            <div className="pm-thumb-spinner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
          ) : (
            <div className="pm-thumb-error">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>
              </svg>
            </div>
          )}
        </div>

        {/* Overlays */}
        {isCover && img.status === "done" && (
          <span className="pm-thumb-cover-badge">غلاف</span>
        )}
        <span className="pm-thumb-num">{index + 1}</span>

        {/* Actions */}
        {img.status === "done" && (
          <div className="pm-thumb-actions">
            {!isCover && (
              <button className="pm-thumb-btn pm-thumb-btn--cover" onClick={onSetCover} title="اجعلها الغلاف">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </button>
            )}
            <button className="pm-thumb-btn pm-thumb-btn--del" onClick={onRemove} title="حذف">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 1l10 10M11 1L1 11"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* ── Captions ── */}
      {img.status === "done" && (
        <div className="pm-card-captions">
          <input
            className="pm-caption-input"
            value={img.captionAr}
            onChange={(e) => onCaptionChange("captionAr", e.target.value)}
            placeholder="كابشن عربي"
            dir="rtl"
          />
          <input
            className="pm-caption-input"
            value={img.captionEn}
            onChange={(e) => onCaptionChange("captionEn", e.target.value)}
            placeholder="English caption"
            dir="ltr"
          />
        </div>
      )}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────

export default function ProjectModal({ project, onClose, onSaved }: Props) {
  const isEdit = !!project;

  const [titleAr, setTitleAr]         = useState(project?.titleAr ?? "");
  const [titleEn, setTitleEn]         = useState(project?.titleEn ?? "");
  const [slug, setSlug]               = useState(project?.slug ?? "");
  const [descAr, setDescAr]           = useState("");
  const [descEn, setDescEn]           = useState("");
  const [showInPortfolio, setShowInPortfolio] = useState(project?.showInPortfolio ?? true);
  const [coverIndex, setCoverIndex]   = useState(0);
  const [images, setImages]           = useState<UploadedImage[]>(() => {
    // For edit mode, we start with no pre-loaded images (user can re-upload)
    // In a more advanced version we'd load existing images from the project
    return [];
  });
  const [isDragOver, setIsDragOver]   = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState("");
  const [slugManual, setSlugManual]   = useState(isEdit);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // ── Auto-slug from English title ──────────────────────

  function handleTitleEnChange(val: string) {
    setTitleEn(val);
    if (!slugManual) setSlug(toSlug(val) || toSlug(titleAr));
  }

  function handleTitleArChange(val: string) {
    setTitleAr(val);
    if (!slugManual && !titleEn) setSlug(toSlug(val));
  }

  // ── Upload files ──────────────────────────────────────

  const uploadFiles = useCallback(async (files: File[]) => {
    const newItems: UploadedImage[] = files.map((f) => ({
      tempId: `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url: "",
      width: 0,
      height: 0,
      status: "uploading",
      name: f.name,
      captionAr: "",
      captionEn: "",
    }));

    setImages((prev) => [...prev, ...newItems]);

    // Upload concurrently (max 3 at a time)
    const CONCURRENCY = 3;
    for (let i = 0; i < newItems.length; i += CONCURRENCY) {
      const batch = newItems.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (item, bi) => {
          const file = files[i + bi];
          try {
            const result = await uploadFile(file, "projects");
            setImages((prev) =>
              prev.map((p) =>
                p.tempId === item.tempId
                  ? { ...p, url: result.url, width: result.width, height: result.height, status: "done" }
                  : p
              )
            );
          } catch (err) {
            setImages((prev) =>
              prev.map((p) =>
                p.tempId === item.tempId
                  ? { ...p, status: "error", errorMsg: err instanceof Error ? err.message : "خطأ" }
                  : p
              )
            );
          }
        })
      );
    }
  }, []);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) uploadFiles(files);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type)
    );
    if (files.length > 0) uploadFiles(files);
  }

  // ── DnD reorder ───────────────────────────────────────

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = images.findIndex((i) => i.tempId === active.id);
    const newIdx = images.findIndex((i) => i.tempId === over.id);
    const reordered = arrayMove(images, oldIdx, newIdx);
    setImages(reordered);
    // If we moved the cover image, update coverIndex
    setCoverIndex((ci) => {
      if (ci === oldIdx) return newIdx;
      if (oldIdx < ci && newIdx >= ci) return ci - 1;
      if (oldIdx > ci && newIdx <= ci) return ci + 1;
      return ci;
    });
  }

  function updateCaption(tempId: string, field: "captionAr" | "captionEn", value: string) {
    setImages((prev) =>
      prev.map((img) => img.tempId === tempId ? { ...img, [field]: value } : img)
    );
  }

  function removeImage(tempId: string) {
    const idx = images.findIndex((i) => i.tempId === tempId);
    setImages((prev) => prev.filter((i) => i.tempId !== tempId));
    setCoverIndex((ci) => {
      if (idx === ci) return 0;
      if (idx < ci) return ci - 1;
      return ci;
    });
  }

  // ── Save ──────────────────────────────────────────────

  async function handleSave() {
    if (!titleAr.trim()) { setSaveError("العنوان العربي مطلوب"); return; }
    if (!slug.trim())    { setSaveError("الـ Slug مطلوب"); return; }

    const doneImages = images.filter((i) => i.status === "done");
    if (!isEdit && doneImages.length === 0) { setSaveError("ارفع صورة واحدة على الأقل"); return; }

    const coverUrl = doneImages[Math.min(coverIndex, doneImages.length - 1)]?.url ?? project?.coverImage ?? "";

    const payload = {
      titleAr: titleAr.trim(),
      titleEn: titleEn.trim() || titleAr.trim(),
      descriptionAr: descAr.trim() || null,
      descriptionEn: descEn.trim() || null,
      slug: slug.trim(),
      isPublished: true,
      showInPortfolio,
      coverImage: coverUrl,
      images: doneImages.map((img) => ({
        url: img.url,
        width: img.width,
        height: img.height,
        captionAr: img.captionAr.trim() || null,
        captionEn: img.captionEn.trim() || null,
      })),
    };

    setSaving(true);
    setSaveError("");

    try {
      let res: Response;
      if (isEdit) {
        res = await fetch(`/api/admin/projects/${project!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError((err as { error?: string }).error ?? "فشل الحفظ");
        return;
      }

      const saved = await res.json();
      onSaved({
        id: saved.id,
        slug: saved.slug,
        titleAr: saved.titleAr,
        titleEn: saved.titleEn,
        coverImage: saved.coverImage,
        isPublished: saved.isPublished,
        showInPortfolio: saved.showInPortfolio,
        _count: { images: doneImages.length },
      });
      onClose();
    } catch {
      setSaveError("تعذّر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  const doneCount      = images.filter((i) => i.status === "done").length;
  const uploadingCount = images.filter((i) => i.status === "uploading").length;
  const hasImages      = images.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div className="pm-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="pm-panel" role="dialog" aria-modal="true" dir="rtl">

        {/* Header */}
        <div className="pm-header">
          <h2 className="pm-title">{isEdit ? "تعديل المشروع" : "مشروع فوتوغرافي جديد"}</h2>
          <button className="pm-close" onClick={onClose} aria-label="إغلاق">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="pm-body">

          {/* ── Metadata ── */}
          <section className="pm-section">
            <h3 className="pm-section-title">معلومات المشروع</h3>

            <div className="pm-grid-2">
              <div className="pm-field">
                <label className="pm-label">العنوان بالعربية *</label>
                <input
                  className="pm-input"
                  value={titleAr}
                  onChange={(e) => handleTitleArChange(e.target.value)}
                  placeholder="السّوق — بريدة"
                  dir="rtl"
                />
              </div>
              <div className="pm-field">
                <label className="pm-label">العنوان بالإنجليزية</label>
                <input
                  className="pm-input"
                  value={titleEn}
                  onChange={(e) => handleTitleEnChange(e.target.value)}
                  placeholder="The Market — Buraydah"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="pm-field">
              <label className="pm-label">
                Slug (رابط المشروع) *
                <span className="pm-label-hint"> — حروف إنجليزية وأرقام وشرطات فقط</span>
              </label>
              <input
                className="pm-input pm-input--mono"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                placeholder="the-market-buraydah"
                dir="ltr"
              />
            </div>

            <div className="pm-grid-2">
              <div className="pm-field">
                <label className="pm-label">وصف بالعربية</label>
                <textarea className="pm-input pm-textarea" value={descAr} onChange={(e) => setDescAr(e.target.value)} rows={3} dir="rtl" placeholder="وصف اختياري للمشروع..." />
              </div>
              <div className="pm-field">
                <label className="pm-label">وصف بالإنجليزية</label>
                <textarea className="pm-input pm-textarea" value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={3} dir="ltr" placeholder="Optional project description..." />
              </div>
            </div>

            {/* showInPortfolio toggle */}
            <label className="pm-toggle-row">
              <div className={`pm-toggle ${showInPortfolio ? "pm-toggle--on" : ""}`} onClick={() => setShowInPortfolio((v) => !v)}>
                <span className="pm-toggle-knob" />
              </div>
              <span className="pm-toggle-label">
                {showInPortfolio
                  ? "يظهر في المعرض ضمن «مشاريع فوتوغرافية»"
                  : "مخفي من المعرض"}
              </span>
            </label>
          </section>

          {/* ── Upload Zone ── */}
          <section className="pm-section">
            <div className="pm-section-head">
              <h3 className="pm-section-title">الصور</h3>
              {hasImages && (
                <span className="pm-count-badge">
                  {uploadingCount > 0 ? `جاري رفع ${uploadingCount}...` : `${doneCount} صورة`}
                </span>
              )}
            </div>

            {/* Drop zone */}
            <div
              className={`pm-dropzone ${isDragOver ? "pm-dropzone--over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p className="pm-dropzone-text">
                اسحب الصور هنا أو <span className="pm-dropzone-link">اختر من جهازك</span>
              </p>
              <p className="pm-dropzone-hint">JPG, PNG, WebP — يمكن اختيار عدة صور دفعة واحدة</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleFileInput}
              />
            </div>

            {/* Thumbnails grid */}
            {hasImages && (
              <>
                <p className="pm-reorder-hint">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></svg>
                  اسحب الصور لإعادة الترتيب · انقر ⭐ لتعيين الغلاف
                </p>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={images.map((i) => i.tempId)} strategy={rectSortingStrategy}>
                    <div className="pm-thumbs-grid">
                      {images.map((img, idx) => (
                        <SortableThumb
                          key={img.tempId}
                          img={img}
                          index={idx}
                          isCover={idx === coverIndex}
                          onSetCover={() => setCoverIndex(idx)}
                          onRemove={() => removeImage(img.tempId)}
                          onCaptionChange={(field, val) => updateCaption(img.tempId, field, val)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="pm-footer">
          {saveError && <p className="pm-error">{saveError}</p>}
          <div className="pm-footer-actions">
            <button className="pm-btn-cancel" onClick={onClose}>إلغاء</button>
            <button
              className="pm-btn-save"
              onClick={handleSave}
              disabled={saving || uploadingCount > 0}
            >
              {saving ? "جاري الحفظ..." : uploadingCount > 0 ? `جاري الرفع (${uploadingCount})...` : isEdit ? "حفظ التعديلات" : "إنشاء المشروع"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        /* Backdrop */
        .pm-backdrop {
          position: fixed; inset: 0; z-index: 60;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(3px);
        }

        /* Panel */
        .pm-panel {
          position: fixed; inset: 0; z-index: 61;
          display: flex; flex-direction: column;
          width: min(680px, 100vw);
          max-height: 100svh;
          margin-inline-start: auto;
          background: var(--bg-primary);
          box-shadow: -24px 0 64px rgba(0,0,0,0.15);
          overflow: hidden;
        }

        @media (max-width: 700px) {
          .pm-panel { width: 100vw; }
        }

        .pm-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .pm-title {
          font-size: 1rem; font-weight: 600; color: var(--text-primary);
        }
        .pm-close {
          width: 30px; height: 30px;
          border: 1px solid var(--border); border-radius: var(--radius-md);
          background: transparent; cursor: pointer; color: var(--text-muted);
          display: flex; align-items: center; justify-content: center;
          transition: all var(--transition-fast);
        }
        .pm-close:hover { background: var(--bg-secondary); color: var(--text-primary); }

        /* Body */
        .pm-body {
          flex: 1; overflow-y: auto;
          display: flex; flex-direction: column; gap: 0;
          padding: 0;
        }

        .pm-section {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-subtle);
          display: flex; flex-direction: column; gap: 0.875rem;
        }

        .pm-section-head {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
        }

        .pm-section-title {
          font-size: 0.78rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--text-muted);
        }

        .pm-count-badge {
          font-size: 0.73rem; padding: 0.15rem 0.55rem;
          background: var(--bg-tertiary); color: var(--text-muted);
          border-radius: 999px;
        }

        .pm-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        @media (max-width: 480px) { .pm-grid-2 { grid-template-columns: 1fr; } }

        .pm-field { display: flex; flex-direction: column; gap: 0.35rem; }
        .pm-label {
          font-size: 0.775rem; font-weight: 500;
          color: var(--text-secondary);
        }
        .pm-label-hint { font-weight: 400; color: var(--text-subtle); }

        .pm-input {
          padding: 0.6rem 0.75rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.875rem; font-family: inherit; width: 100%;
          transition: border-color var(--transition-fast);
        }
        .pm-input:focus { outline: none; border-color: var(--text-secondary); }
        .pm-input--mono { font-family: ui-monospace, monospace; font-size: 0.82rem; }
        .pm-textarea { resize: vertical; min-height: 72px; }

        /* Toggle */
        .pm-toggle-row {
          display: flex; align-items: center; gap: 0.75rem;
          cursor: pointer; user-select: none; padding: 0.25rem 0;
        }
        .pm-toggle {
          width: 40px; height: 22px; border-radius: 999px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          position: relative; transition: background var(--transition-fast);
          flex-shrink: 0; cursor: pointer;
        }
        .pm-toggle--on { background: var(--text-primary); border-color: var(--text-primary); }
        .pm-toggle-knob {
          position: absolute; top: 2px; inset-inline-end: 2px;
          width: 16px; height: 16px; border-radius: 50%;
          background: var(--text-subtle);
          transition: all var(--transition-fast);
        }
        .pm-toggle--on .pm-toggle-knob {
          inset-inline-end: unset; inset-inline-start: 2px;
          background: var(--bg-primary);
        }
        .pm-toggle-label { font-size: 0.82rem; color: var(--text-secondary); }

        /* Drop zone */
        .pm-dropzone {
          border: 1.5px dashed var(--border);
          border-radius: var(--radius-lg);
          padding: 2rem 1.5rem;
          display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
          cursor: pointer; transition: all var(--transition-fast);
          color: var(--text-muted);
          text-align: center;
        }
        .pm-dropzone:hover, .pm-dropzone--over {
          border-color: var(--text-secondary);
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
        .pm-dropzone-text { font-size: 0.875rem; color: var(--text-secondary); }
        .pm-dropzone-link { color: var(--text-primary); font-weight: 500; text-decoration: underline; }
        .pm-dropzone-hint { font-size: 0.73rem; color: var(--text-subtle); }

        /* Reorder hint */
        .pm-reorder-hint {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.73rem; color: var(--text-subtle); margin: 0;
        }

        /* Thumbnails */
        .pm-thumbs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 0.75rem;
        }

        /* Image card = thumbnail + captions */
        .pm-card {
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          border: 2px solid transparent;
          transition: border-color var(--transition-fast);
          overflow: hidden;
        }
        .pm-card--cover { border-color: var(--text-primary); }
        .pm-card--uploading { opacity: 0.7; }

        /* Thumbnail area */
        .pm-card-thumb {
          position: relative;
          aspect-ratio: 4/3;
          background: var(--bg-tertiary);
        }

        .pm-thumb-drag {
          position: absolute; top: 4px; inset-inline-start: 4px;
          z-index: 4; padding: 3px;
          background: rgba(0,0,0,0.45);
          border-radius: 4px; color: rgba(255,255,255,0.8);
          cursor: grab; display: flex; line-height: 0;
        }
        .pm-thumb-drag:active { cursor: grabbing; }

        .pm-thumb-img-wrap {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .pm-thumb-img { object-fit: cover; }

        .pm-thumb-spinner {
          animation: pm-spin 1s linear infinite;
          color: var(--text-muted);
        }
        @keyframes pm-spin { to { transform: rotate(360deg); } }

        .pm-thumb-error { color: #ef4444; }

        .pm-thumb-cover-badge {
          position: absolute; bottom: 4px; inset-inline-start: 4px;
          font-size: 0.58rem; font-weight: 600;
          background: var(--text-primary); color: var(--bg-primary);
          padding: 1px 5px; border-radius: 3px;
          letter-spacing: 0.04em; z-index: 4;
        }

        .pm-thumb-num {
          position: absolute; bottom: 4px; inset-inline-end: 4px;
          font-size: 0.6rem; color: rgba(255,255,255,0.75);
          background: rgba(0,0,0,0.45);
          padding: 1px 4px; border-radius: 3px; z-index: 4;
          font-variant-numeric: tabular-nums;
        }

        .pm-thumb-actions {
          position: absolute; top: 4px; inset-inline-end: 4px;
          z-index: 5; display: flex; flex-direction: column; gap: 3px;
          opacity: 0; transition: opacity var(--transition-fast);
        }
        .pm-card:hover .pm-thumb-actions { opacity: 1; }

        .pm-thumb-btn {
          width: 22px; height: 22px;
          border: none; border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; line-height: 0;
          transition: opacity var(--transition-fast);
        }
        .pm-thumb-btn--cover { background: rgba(255,200,0,0.85); color: #000; }
        .pm-thumb-btn--del   { background: rgba(239,68,68,0.85); color: #fff; }
        .pm-thumb-btn:hover  { opacity: 0.85; }

        /* Caption inputs below thumbnail */
        .pm-card-captions {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          padding: 0.45rem 0.5rem;
          border-top: 1px solid var(--border-subtle);
        }
        .pm-caption-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid transparent;
          color: var(--text-secondary);
          font-size: 0.72rem;
          font-family: inherit;
          padding: 0.15rem 0.1rem;
          outline: none;
          transition: border-color var(--transition-fast);
        }
        .pm-caption-input:focus { border-bottom-color: var(--border); }
        .pm-caption-input::placeholder { color: var(--text-subtle); }

        /* Footer */
        .pm-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 0.5rem;
          flex-shrink: 0;
          background: var(--bg-primary);
        }
        .pm-footer-actions {
          display: flex; gap: 0.625rem; justify-content: flex-end;
        }
        .pm-error { font-size: 0.78rem; color: #ef4444; text-align: end; }

        .pm-btn-cancel {
          padding: 0.6rem 1.25rem;
          border: 1px solid var(--border); border-radius: var(--radius-md);
          background: transparent; color: var(--text-secondary);
          font-size: 0.875rem; font-family: inherit; cursor: pointer;
          transition: all var(--transition-fast);
        }
        .pm-btn-cancel:hover { background: var(--bg-secondary); color: var(--text-primary); }

        .pm-btn-save {
          padding: 0.6rem 1.5rem;
          background: var(--text-primary); color: var(--bg-primary);
          border: none; border-radius: var(--radius-md);
          font-size: 0.875rem; font-family: inherit; cursor: pointer;
          transition: opacity var(--transition-fast);
        }
        .pm-btn-save:hover:not(:disabled) { opacity: 0.85; }
        .pm-btn-save:disabled { opacity: 0.45; cursor: not-allowed; }

        .sr-only {
          position: absolute; width: 1px; height: 1px;
          padding: 0; margin: -1px; overflow: hidden;
          clip: rect(0,0,0,0); white-space: nowrap; border: 0;
        }
      `}</style>
    </>
  );
}
