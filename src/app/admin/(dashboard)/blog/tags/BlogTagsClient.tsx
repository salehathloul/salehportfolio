"use client";

import { useState } from "react";
import Link from "next/link";

interface Tag {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  _count: { posts: number };
}

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[\u0600-\u06FF\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function BlogTagsClient({ initialTags }: { initialTags: Tag[] }) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  function handleNameArChange(v: string) {
    setNameAr(v);
    if (!slugEdited) setSlug(toSlug(v));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!nameAr.trim() || !slug.trim()) { setError("الاسم عربي والـ slug مطلوبان"); return; }
    setCreating(true);
    setError("");
    const res = await fetch("/api/admin/blog-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameAr: nameAr.trim(), nameEn: nameEn.trim(), slug: slug.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "فشل الإنشاء"); setCreating(false); return; }
    setTags((prev) => [...prev, { ...data, _count: { posts: 0 } }].sort((a, b) => a.nameAr.localeCompare(b.nameAr)));
    setNameAr(""); setNameEn(""); setSlug(""); setSlugEdited(false);
    setCreating(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف هذا التصنيف؟")) return;
    const res = await fetch(`/api/admin/blog-tags/${id}`, { method: "DELETE" });
    if (res.ok) setTags((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="tags-page">
      <div className="tags-header">
        <Link href="/admin/blog" className="tags-back">← المدونة</Link>
        <h1 className="tags-title">تصنيفات المدونة</h1>
      </div>

      {/* Create form */}
      <form onSubmit={handleCreate} className="tags-form">
        <h2 className="tags-form-heading">إضافة تصنيف جديد</h2>
        {error && <p className="tags-error">{error}</p>}
        <div className="tags-form-row">
          <div className="tags-field">
            <label>الاسم (عربي) *</label>
            <input
              type="text"
              value={nameAr}
              onChange={(e) => handleNameArChange(e.target.value)}
              placeholder="مثال: طبيعة"
              dir="rtl"
              className="tags-input"
            />
          </div>
          <div className="tags-field">
            <label>الاسم (إنجليزي)</label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Nature"
              dir="ltr"
              className="tags-input"
            />
          </div>
          <div className="tags-field">
            <label>Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlugEdited(true); setSlug(e.target.value); }}
              placeholder="nature"
              dir="ltr"
              className="tags-input"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? "جاري الإنشاء..." : "إضافة"}
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="tags-table-wrap">
        {tags.length === 0 ? (
          <p className="tags-empty">لا توجد تصنيفات بعد.</p>
        ) : (
          <table className="tags-table">
            <thead>
              <tr>
                <th>الاسم (عربي)</th>
                <th>الاسم (إنجليزي)</th>
                <th>Slug</th>
                <th>عدد التدوينات</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td dir="rtl">{tag.nameAr}</td>
                  <td dir="ltr">{tag.nameEn || "—"}</td>
                  <td dir="ltr" className="tags-slug">{tag.slug}</td>
                  <td className="tags-count">{tag._count.posts}</td>
                  <td>
                    <button
                      className="tags-delete-btn"
                      onClick={() => handleDelete(tag.id)}
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .tags-page { max-width: 860px; margin: 0 auto; padding-bottom: 4rem; }
        .tags-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
        .tags-back { font-size: 0.875rem; color: var(--text-muted); text-decoration: none; }
        .tags-back:hover { color: var(--text-primary); }
        .tags-title { font-size: 1.25rem; font-weight: 600; color: var(--text-primary); margin: 0; }

        .tags-form {
          background: var(--bg-primary); border: 1px solid var(--border);
          border-radius: var(--radius-md); padding: 1.25rem;
          margin-bottom: 1.75rem;
        }
        .tags-form-heading { font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); margin: 0 0 1rem; }
        .tags-error { font-size: 0.8125rem; color: #e53e3e; margin-bottom: 0.75rem; }
        .tags-form-row { display: flex; gap: 0.75rem; align-items: flex-end; flex-wrap: wrap; }
        .tags-field { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; min-width: 140px; }
        .tags-field label { font-size: 0.8rem; color: var(--text-secondary); font-weight: 500; }
        .tags-input {
          height: 36px; padding: 0 0.75rem;
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          background: var(--bg-secondary); color: var(--text-primary);
          font-size: 0.875rem; outline: none;
          transition: border-color var(--transition-fast);
        }
        .tags-input:focus { border-color: var(--text-primary); }

        .btn-primary {
          height: 36px; padding: 0 1.25rem;
          background: var(--text-primary); color: var(--bg-primary);
          border: none; border-radius: var(--radius-md);
          font-size: 0.875rem; font-weight: 500; cursor: pointer;
          transition: opacity var(--transition-fast); white-space: nowrap;
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.85; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .tags-table-wrap {
          background: var(--bg-primary); border: 1px solid var(--border);
          border-radius: var(--radius-md); overflow: hidden;
        }
        .tags-empty { padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.875rem; margin: 0; }
        .tags-table { width: 100%; border-collapse: collapse; }
        .tags-table th {
          font-size: 0.75rem; font-weight: 600; color: var(--text-muted);
          text-align: right; padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border);
          background: var(--bg-secondary); letter-spacing: 0.04em;
        }
        .tags-table td {
          font-size: 0.875rem; color: var(--text-primary);
          padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-subtle);
        }
        .tags-table tr:last-child td { border-bottom: none; }
        .tags-slug { color: var(--text-muted); font-family: monospace; font-size: 0.8rem; }
        .tags-count { color: var(--text-muted); text-align: center; }
        .tags-delete-btn {
          font-size: 0.75rem; color: #e53e3e; background: transparent;
          border: 1px solid transparent; border-radius: var(--radius-sm);
          padding: 0.25rem 0.5rem; cursor: pointer;
          transition: border-color var(--transition-fast), background var(--transition-fast);
        }
        .tags-delete-btn:hover { border-color: #e53e3e; background: #fee2e2; }
      `}</style>
    </div>
  );
}
