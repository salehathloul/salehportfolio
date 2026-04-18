"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import TipTapRenderer from "@/components/blog/TipTapRenderer";

// Load editor client-only (TipTap requires browser APIs)
const BlogEditor = dynamic(() => import("@/components/admin/BlogEditor"), {
  ssr: false,
  loading: () => <div className="editor-page-loading">جاري تحميل المحرر...</div>,
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface Tag {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
}

interface Post {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  coverImage: string | null;
  contentAr: object;
  contentEn: object | null;
  status: string;
  publishedAt: string | null;
  signatureDisabled: boolean;
  tags: Tag[];
}

type SaveStatus = "idle" | "saving" | "saved" | "error";
type ActiveLang = "ar" | "en";

// ── Helper: auto-generate slug ────────────────────────────────────────────────

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u0600-\u06FF\s]+/g, "-") // Arabic chars → dash
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || `post-${Date.now()}`;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BlogEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [activeLang, setActiveLang] = useState<ActiveLang>("ar");
  const [showPreview, setShowPreview] = useState(false);

  // Form fields
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [slug, setSlug] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState("draft");
  const [signatureDisabled, setSignatureDisabled] = useState(false);
  const [contentAr, setContentAr] = useState<object>({});
  const [contentEn, setContentEn] = useState<object>({});

  // Tags
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const slugEdited = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverUploading, setCoverUploading] = useState(false);

  // ── Load post ──────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const [postRes, tagsRes] = await Promise.all([
        fetch(`/api/blog/${id}`),
        fetch("/api/admin/blog-tags"),
      ]);
      if (!postRes.ok) { router.push("/admin/blog"); return; }
      const data: Post = await postRes.json();
      const tags: Tag[] = tagsRes.ok ? await tagsRes.json() : [];
      setPost(data);
      setTitleAr(data.titleAr);
      setTitleEn(data.titleEn ?? "");
      setSlug(data.slug);
      setCoverImage(data.coverImage ?? "");
      setStatus(data.status);
      setContentAr(data.contentAr ?? {});
      setContentEn(data.contentEn ?? {});
      setSignatureDisabled(data.signatureDisabled ?? false);
      setAllTags(tags);
      setSelectedTagIds((data.tags ?? []).map((t: Tag) => t.id));
      setLoading(false);
    }
    load();
  }, [id, router]);

  // ── Auto-slug from title ───────────────────────────────────────────────────

  function handleTitleArChange(v: string) {
    setTitleAr(v);
    if (!slugEdited.current) setSlug(toSlug(v));
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  const save = useCallback(
    async (overrideStatus?: string) => {
      setSaveStatus("saving");
      const body = {
        titleAr,
        titleEn,
        slug,
        coverImage: coverImage || null,
        contentAr,
        contentEn,
        status: overrideStatus ?? status,
        signatureDisabled,
        tagIds: selectedTagIds,
      };
      const res = await fetch(`/api/blog/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated: Post = await res.json();
        setStatus(updated.status);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } else {
        const err = await res.json();
        setSaveStatus("error");
        alert(err.error ?? "فشل الحفظ");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    },
    [titleAr, titleEn, slug, coverImage, contentAr, contentEn, status, signatureDisabled, selectedTagIds, id]
  );

  // Auto-save on content change (debounce 3s)
  function scheduleAutoSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(), 3000);
  }

  async function handleCoverUpload(file: File) {
    setCoverUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "blog");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setCoverImage(data.url);
      scheduleAutoSave();
    } else {
      alert(data.error ?? "فشل رفع صورة الغلاف");
    }
    setCoverUploading(false);
  }

  if (loading) {
    return <div className="editor-page-loading">جاري التحميل...</div>;
  }
  if (!post) return null;

  const saveLabel =
    saveStatus === "saving"
      ? "جاري الحفظ..."
      : saveStatus === "saved"
      ? "✓ تم الحفظ"
      : saveStatus === "error"
      ? "! خطأ"
      : "حفظ";

  return (
    <div className="editor-page">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="editor-page-header">
        <div className="editor-page-nav">
          <Link href="/admin/blog" className="editor-back-link">
            ← المدونة
          </Link>
          <span className="editor-page-status-badge" data-status={status}>
            {status === "published" ? "منشور" : status === "hidden" ? "مخفي" : "مسودة"}
          </span>
        </div>

        <div className="editor-page-actions">
          <button
            className="btn-outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? "إخفاء المعاينة" : "معاينة"}
          </button>

          {status !== "published" && (
            <button
              className="btn-outline"
              onClick={() => save("published")}
              disabled={saveStatus === "saving"}
            >
              نشر
            </button>
          )}
          {status === "published" && (
            <button
              className="btn-outline"
              onClick={() => save("hidden")}
              disabled={saveStatus === "saving"}
            >
              إخفاء
            </button>
          )}

          <button
            className="btn-primary"
            onClick={() => save()}
            disabled={saveStatus === "saving"}
          >
            {saveLabel}
          </button>
        </div>
      </div>

      {/* ── Meta fields ─────────────────────────────────────────────────── */}
      <div className="editor-meta-section">
        <div className="editor-meta-row">
          <div className="editor-meta-field">
            <label>العنوان (عربي)</label>
            <input
              type="text"
              value={titleAr}
              onChange={(e) => { handleTitleArChange(e.target.value); scheduleAutoSave(); }}
              placeholder="عنوان التدوينة"
              dir="rtl"
              className="editor-meta-input large"
            />
          </div>
          <div className="editor-meta-field">
            <label>العنوان (إنجليزي)</label>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => { setTitleEn(e.target.value); scheduleAutoSave(); }}
              placeholder="Post title"
              dir="ltr"
              className="editor-meta-input large"
            />
          </div>
        </div>

        <div className="editor-meta-row">
          <div className="editor-meta-field">
            <label>الرابط (slug)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => { slugEdited.current = true; setSlug(e.target.value); scheduleAutoSave(); }}
              dir="ltr"
              className="editor-meta-input"
            />
          </div>
          <div className="editor-meta-field">
            <label>صورة الغلاف</label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }}
            />
            <div className="cover-upload-row">
              {coverImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImage} alt="" className="cover-thumb" />
                  <button type="button" className="cover-change-btn" onClick={() => coverInputRef.current?.click()} disabled={coverUploading}>
                    {coverUploading ? "جاري الرفع..." : "تغيير"}
                  </button>
                  <button type="button" className="cover-remove-btn" onClick={() => { setCoverImage(""); scheduleAutoSave(); }}>×</button>
                </>
              ) : (
                <button type="button" className="cover-upload-btn" onClick={() => coverInputRef.current?.click()} disabled={coverUploading}>
                  {coverUploading ? "جاري الرفع..." : "+ رفع صورة غلاف"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Signature toggle ────────────────────────────────────────────── */}
      <div className="editor-sig-row">
        <label className="editor-sig-label">
          <span className="editor-sig-icon">✍</span>
          توقيع التدوينة
        </label>
        <label className="toggle-switch" style={{ transform: "scale(0.85)" }}>
          <input
            type="checkbox"
            checked={!signatureDisabled}
            onChange={(e) => { setSignatureDisabled(!e.target.checked); scheduleAutoSave(); }}
            className="toggle-input"
          />
          <span className="toggle-track"><span className="toggle-thumb" /></span>
        </label>
        <span className="editor-sig-status">
          {signatureDisabled ? "التوقيع مطفأ لهذه التدوينة" : "التوقيع مفعّل"}
        </span>
      </div>

      {/* ── Tags ────────────────────────────────────────────────────────── */}
      {allTags.length > 0 && (
        <div className="editor-tags-row">
          <span className="editor-tags-label">التصنيفات</span>
          <div className="editor-tags-list">
            {allTags.map((tag) => {
              const selected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  className={`editor-tag-pill${selected ? " selected" : ""}`}
                  onClick={() => {
                    setSelectedTagIds((prev) =>
                      selected ? prev.filter((tid) => tid !== tag.id) : [...prev, tag.id]
                    );
                    scheduleAutoSave();
                  }}
                >
                  {tag.nameAr}
                </button>
              );
            })}
            <a href="/admin/blog/tags" className="editor-tags-manage">+ إدارة التصنيفات</a>
          </div>
        </div>
      )}

      {/* ── Language Tabs ────────────────────────────────────────────────── */}
      <div className="editor-lang-tabs">
        <button
          className={`editor-lang-tab ${activeLang === "ar" ? "active" : ""}`}
          onClick={() => setActiveLang("ar")}
        >
          عربي
        </button>
        <button
          className={`editor-lang-tab ${activeLang === "en" ? "active" : ""}`}
          onClick={() => setActiveLang("en")}
        >
          English
        </button>
      </div>

      {/* ── Editor ──────────────────────────────────────────────────────── */}
      <div style={{ display: activeLang === "ar" ? "block" : "none" }}>
        <BlogEditor
          content={contentAr}
          onChange={(json) => { setContentAr(json); scheduleAutoSave(); }}
          placeholder="ابدأ الكتابة بالعربية..."
          dir="rtl"
        />
      </div>
      <div style={{ display: activeLang === "en" ? "block" : "none" }}>
        <BlogEditor
          content={contentEn ?? {}}
          onChange={(json) => { setContentEn(json); scheduleAutoSave(); }}
          placeholder="Start writing in English..."
          dir="ltr"
        />
      </div>

      {/* ── Preview Modal ─────────────────────────────────────────────── */}
      {showPreview && (
        <div className="preview-backdrop" onClick={() => setShowPreview(false)}>
          <div className="preview-modal" onClick={e => e.stopPropagation()}>
            <div className="preview-modal-header">
              <span className="preview-modal-label">معاينة</span>
              <button className="preview-modal-close" onClick={() => setShowPreview(false)} aria-label="إغلاق">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M12.5 3.5l-9 9M3.5 3.5l9 9"/>
                </svg>
              </button>
            </div>
            <div className="preview-modal-body" dir={activeLang === "ar" ? "rtl" : "ltr"}>
              <h1 className="preview-title">{activeLang === "ar" ? titleAr : titleEn}</h1>
              <div className="preview-divider" />
              <TipTapRenderer
                content={(activeLang === "ar" ? contentAr : contentEn) as object}
                dir={activeLang === "ar" ? "rtl" : "ltr"}
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .editor-page { max-width: 960px; margin: 0 auto; padding-bottom: 4rem; }

        .editor-page-loading {
          display: flex; align-items: center; justify-content: center;
          min-height: 300px; color: var(--text-muted); font-size: 0.9375rem;
        }

        .editor-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .editor-page-nav { display: flex; align-items: center; gap: 0.75rem; }
        .editor-back-link { font-size: 0.875rem; color: var(--text-muted); text-decoration: none; }
        .editor-back-link:hover { color: var(--text-primary); }
        .editor-page-status-badge {
          font-size: 0.75rem; font-weight: 500; padding: 0.2rem 0.625rem;
          border-radius: 999px; background: var(--bg-secondary);
          color: var(--text-muted); border: 1px solid var(--border);
        }
        .editor-page-status-badge[data-status="published"] { color: #10b981; border-color: #10b981; }
        .editor-page-status-badge[data-status="hidden"] { color: #6b7280; }

        .editor-page-actions { display: flex; gap: 0.5rem; align-items: center; }

        /* Preview modal */
        .preview-backdrop {
          position: fixed; inset: 0; z-index: 300;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(3px);
          display: flex; align-items: flex-start; justify-content: center;
          padding: 2rem 1rem;
          overflow-y: auto;
        }
        .preview-modal {
          width: 100%; max-width: 780px;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(0,0,0,0.35);
          min-height: 60vh;
        }
        .preview-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid var(--border);
          background: var(--bg-secondary);
          position: sticky; top: 0; z-index: 1;
        }
        .preview-modal-label {
          font-size: 0.75rem; font-weight: 500; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--text-muted);
        }
        .preview-modal-close {
          width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
          border: none; background: transparent; color: var(--text-muted); cursor: pointer;
          border-radius: var(--radius-sm); transition: color var(--transition-fast), background var(--transition-fast);
        }
        .preview-modal-close:hover { color: var(--text-primary); background: var(--bg-tertiary); }
        .preview-modal-body {
          padding: 2.5rem 3rem 4rem;
          max-width: 700px;
          margin: 0 auto;
        }
        .preview-title {
          font-family: var(--font-heading);
          font-size: clamp(1.6rem, 3.5vw, 2.4rem);
          font-weight: 300;
          letter-spacing: -0.02em;
          line-height: 1.25;
          color: var(--text-primary);
          margin: 0 0 1.25rem;
        }
        .preview-divider {
          height: 1px; background: var(--border-subtle);
          margin-bottom: 2rem;
        }

        .btn-primary {
          padding: 0.5rem 1.25rem;
          background: var(--text-primary); color: var(--bg-primary);
          border: none; border-radius: var(--radius-md);
          font-size: 0.875rem; font-weight: 500; cursor: pointer;
          transition: opacity var(--transition-fast);
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.85; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-outline {
          padding: 0.5rem 1rem;
          background: transparent; color: var(--text-secondary);
          border: 1px solid var(--border); border-radius: var(--radius-md);
          font-size: 0.875rem; cursor: pointer;
          transition: border-color var(--transition-fast), color var(--transition-fast);
        }
        .btn-outline:hover:not(:disabled) { border-color: var(--text-secondary); color: var(--text-primary); }
        .btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }

        .editor-meta-section {
          background: var(--bg-primary); border: 1px solid var(--border);
          border-radius: var(--radius-md); padding: 1.25rem;
          margin-bottom: 1.25rem;
        }
        .editor-meta-row { display: flex; gap: 1rem; margin-bottom: 1rem; }
        .editor-meta-row:last-child { margin-bottom: 0; }
        .editor-meta-field { flex: 1; display: flex; flex-direction: column; gap: 0.375rem; }
        .editor-meta-field label { font-size: 0.8125rem; color: var(--text-secondary); font-weight: 500; }
        .editor-meta-input {
          width: 100%; height: 36px; padding: 0 0.75rem;
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          background: var(--bg-secondary); color: var(--text-primary);
          font-size: 0.9rem; outline: none;
          transition: border-color var(--transition-fast);
        }
        .editor-meta-input:focus { border-color: var(--text-primary); }
        .editor-meta-input.large { font-size: 1rem; height: 42px; }

        .cover-upload-row { display: flex; align-items: center; gap: 0.5rem; }
        .cover-upload-btn {
          height: 36px; padding: 0 1rem; border: 1px dashed var(--border);
          border-radius: var(--radius-sm); background: transparent;
          color: var(--text-muted); font-size: 0.8125rem; cursor: pointer;
          transition: border-color var(--transition-fast), color var(--transition-fast);
        }
        .cover-upload-btn:hover:not(:disabled) { border-color: var(--text-primary); color: var(--text-primary); }
        .cover-upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cover-thumb { width: 80px; height: 52px; object-fit: cover; border-radius: var(--radius-sm); }
        .cover-change-btn {
          height: 30px; padding: 0 0.75rem; font-size: 0.75rem;
          background: var(--bg-secondary); color: var(--text-secondary);
          border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer;
        }
        .cover-change-btn:hover:not(:disabled) { border-color: var(--text-primary); }
        .cover-remove-btn {
          width: 28px; height: 28px; background: transparent; border: none;
          color: var(--text-muted); font-size: 1.1rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
        }
        .cover-remove-btn:hover { background: #fee2e2; color: #e53e3e; }

        @media (max-width: 640px) {
          .editor-meta-row { flex-direction: column; }
        }

        .editor-sig-row {
          display: flex; align-items: center; gap: 0.625rem;
          background: var(--bg-primary); border: 1px solid var(--border);
          border-radius: var(--radius-md); padding: 0.75rem 1rem;
          margin-bottom: 1rem;
        }
        .editor-sig-label {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary);
          margin-inline-end: 0.25rem;
        }
        .editor-sig-icon { font-size: 1rem; line-height: 1; }
        .editor-sig-status {
          font-size: 0.8rem; color: var(--text-muted);
        }
        /* toggle-switch reuse from settings */
        .toggle-switch { position: relative; display: inline-block; width: 36px; height: 20px; flex-shrink: 0; }
        .toggle-input { opacity: 0; width: 0; height: 0; position: absolute; }
        .toggle-track {
          position: absolute; inset: 0; border-radius: 999px;
          background: var(--border); cursor: pointer;
          transition: background var(--transition-fast);
        }
        .toggle-input:checked + .toggle-track { background: var(--text-primary); }
        .toggle-thumb {
          position: absolute; top: 3px; left: 3px;
          width: 14px; height: 14px; border-radius: 50%;
          background: #fff; transition: transform var(--transition-fast);
        }
        .toggle-input:checked + .toggle-track .toggle-thumb { transform: translateX(16px); }

        .editor-tags-row {
          display: flex; align-items: flex-start; gap: 0.75rem;
          background: var(--bg-primary); border: 1px solid var(--border);
          border-radius: var(--radius-md); padding: 0.75rem 1rem;
          margin-bottom: 1rem; flex-wrap: wrap;
        }
        .editor-tags-label {
          font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary);
          white-space: nowrap; padding-top: 0.15rem;
        }
        .editor-tags-list { display: flex; flex-wrap: wrap; gap: 0.4rem; flex: 1; }
        .editor-tag-pill {
          font-size: 0.775rem; padding: 0.2rem 0.65rem;
          border: 1px solid var(--border); border-radius: 999px;
          background: transparent; color: var(--text-muted); cursor: pointer;
          transition: border-color var(--transition-fast), color var(--transition-fast), background var(--transition-fast);
        }
        .editor-tag-pill:hover { border-color: var(--text-secondary); color: var(--text-primary); }
        .editor-tag-pill.selected {
          background: var(--text-primary); color: var(--bg-primary);
          border-color: var(--text-primary);
        }
        .editor-tags-manage {
          font-size: 0.75rem; color: var(--text-muted); text-decoration: none;
          padding: 0.2rem 0; align-self: center;
          transition: color var(--transition-fast);
        }
        .editor-tags-manage:hover { color: var(--text-primary); }

        .editor-lang-tabs {
          display: flex; gap: 0; margin-bottom: 0.75rem;
          border-bottom: 1px solid var(--border);
        }
        .editor-lang-tab {
          padding: 0.5rem 1.5rem; border: none; background: transparent;
          color: var(--text-muted); font-size: 0.875rem; cursor: pointer;
          border-bottom: 2px solid transparent; margin-bottom: -1px;
          transition: color var(--transition-fast), border-color var(--transition-fast);
        }
        .editor-lang-tab.active { color: var(--text-primary); border-bottom-color: var(--text-primary); font-weight: 500; }

        .editor-preview {
          margin-top: 2rem;
          padding: 1.5rem;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }
        .editor-preview-heading {
          font-size: 0.875rem; font-weight: 500; color: var(--text-muted);
          margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .editor-preview-body h1 { font-size: 1.75rem; font-weight: 600; margin-bottom: 1rem; }
      `}</style>
    </div>
  );
}
