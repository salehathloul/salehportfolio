"use client";

import { useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Category } from "./types";

export type { Category } from "./types";

interface CategoryManagerProps {
  categories: Category[];
  onChange: (categories: Category[]) => void;
}

type EditingState = { id: string; nameAr: string; nameEn: string; slug: string } | null;
type AddingState = { nameAr: string; nameEn: string; slug: string } | null;

export default function CategoryManager({ categories, onChange }: CategoryManagerProps) {
  const [editing, setEditing] = useState<EditingState>(null);
  const [adding, setAdding] = useState<AddingState>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // ── Drag end ───────────────────────────────────────────

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex).map((c, i) => ({ ...c, order: i }));

    onChange(reordered);

    await fetch("/api/portfolio/categories/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered.map((c) => ({ id: c.id, order: c.order })) }),
    });
  }

  // ── Add ────────────────────────────────────────────────

  function startAdding() {
    setAdding({ nameAr: "", nameEn: "", slug: "" });
    setEditing(null);
    setError("");
  }

  async function saveAdd() {
    if (!adding) return;
    if (!adding.nameAr.trim() || !adding.nameEn.trim() || !adding.slug.trim()) {
      setError("جميع الحقول مطلوبة");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(adding.slug)) {
      setError("slug: أحرف إنجليزية صغيرة وأرقام وشرطات فقط");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/portfolio/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adding),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "فشل الحفظ"); return; }
      onChange([...categories, { ...data, order: categories.length }]);
      setAdding(null);
    } catch {
      setError("خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  }

  // ── Edit ───────────────────────────────────────────────

  function startEdit(cat: Category) {
    setEditing({ id: cat.id, nameAr: cat.nameAr, nameEn: cat.nameEn, slug: cat.slug });
    setAdding(null);
    setError("");
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editing.nameAr.trim() || !editing.nameEn.trim() || !editing.slug.trim()) {
      setError("جميع الحقول مطلوبة");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/portfolio/categories/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameAr: editing.nameAr, nameEn: editing.nameEn, slug: editing.slug }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "فشل الحفظ"); return; }
      onChange(categories.map((c) => (c.id === editing.id ? { ...c, ...data } : c)));
      setEditing(null);
    } catch {
      setError("خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────

  async function deleteCategory(id: string) {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    if ((cat._count?.works ?? 0) > 0) {
      setError(`لا يمكن حذف التصنيف — يحتوي على ${cat._count?.works} عمل`);
      return;
    }
    if (!confirm(`حذف تصنيف "${cat.nameAr}"؟`)) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/portfolio/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "فشل الحذف");
        return;
      }
      onChange(categories.filter((c) => c.id !== id));
    } catch {
      setError("خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  }

  // Auto-generate slug from English name
  function slugify(str: string) {
    return str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  return (
    <div className="cat-manager">
      <div className="cat-header">
        <h3 className="cat-title">التصنيفات</h3>
        <button type="button" className="cat-add-btn" onClick={startAdding}>
          + إضافة تصنيف
        </button>
      </div>

      {error && <div className="cat-error">{error}</div>}

      {/* Add form */}
      {adding && (
        <div className="cat-form">
          <div className="cat-form-grid">
            <input
              value={adding.nameAr}
              onChange={(e) => setAdding({ ...adding, nameAr: e.target.value })}
              placeholder="الاسم بالعربية"
              dir="rtl"
              className="cat-inp"
              autoFocus
            />
            <input
              value={adding.nameEn}
              onChange={(e) => {
                const nameEn = e.target.value;
                setAdding({ ...adding, nameEn, slug: slugify(nameEn) });
              }}
              placeholder="Name in English"
              dir="ltr"
              className="cat-inp"
            />
            <input
              value={adding.slug}
              onChange={(e) => setAdding({ ...adding, slug: slugify(e.target.value) })}
              placeholder="slug"
              dir="ltr"
              className="cat-inp cat-inp--mono"
            />
          </div>
          <div className="cat-form-actions">
            <button type="button" className="btn-sm btn-sm--primary" onClick={saveAdd} disabled={saving}>
              {saving ? "..." : "حفظ"}
            </button>
            <button type="button" className="btn-sm btn-sm--ghost" onClick={() => { setAdding(null); setError(""); }}>
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="cat-list">
            {categories.length === 0 && (
              <p className="cat-empty">لا توجد تصنيفات بعد</p>
            )}
            {categories.map((cat) => (
              <SortableCategoryRow
                key={cat.id}
                category={cat}
                editing={editing?.id === cat.id ? editing : null}
                onEdit={() => startEdit(cat)}
                onDelete={() => deleteCategory(cat.id)}
                onEditChange={(field, val) => editing && setEditing({ ...editing, [field]: val })}
                onSaveEdit={saveEdit}
                onCancelEdit={() => { setEditing(null); setError(""); }}
                saving={saving}
                slugify={slugify}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <style>{`
        .cat-manager { display: flex; flex-direction: column; gap: 0.75rem; }

        .cat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .cat-title {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
        }

        .cat-add-btn {
          font-size: 0.8125rem;
          padding: 0.3rem 0.75rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .cat-add-btn:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .cat-error {
          font-size: 0.8125rem;
          color: #e53e3e;
          background: #fff5f5;
          border: 1px solid #fed7d7;
          border-radius: var(--radius-md);
          padding: 0.5rem 0.75rem;
        }

        .dark .cat-error {
          background: #2d1b1b;
          border-color: #742a2a;
        }

        .cat-form {
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          padding: 0.875rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .cat-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 0.6fr;
          gap: 0.625rem;
        }

        @media (max-width: 600px) {
          .cat-form-grid { grid-template-columns: 1fr; }
        }

        .cat-inp {
          padding: 0.4375rem 0.625rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.875rem;
          outline: none;
          font-family: inherit;
        }

        .cat-inp:focus { border-color: var(--text-primary); }
        .cat-inp::placeholder { color: var(--text-subtle); }
        .cat-inp--mono { font-family: monospace; }

        .cat-form-actions { display: flex; gap: 0.5rem; }

        .cat-list { display: flex; flex-direction: column; gap: 2px; }

        .cat-empty {
          font-size: 0.875rem;
          color: var(--text-muted);
          text-align: center;
          padding: 1rem;
        }

        .btn-sm {
          font-size: 0.8125rem;
          padding: 0.3rem 0.75rem;
          border-radius: var(--radius-md);
          cursor: pointer;
          border: 1px solid transparent;
          transition: background var(--transition-fast), opacity var(--transition-fast);
        }

        .btn-sm--primary {
          background: var(--text-primary);
          color: var(--bg-primary);
          border-color: var(--text-primary);
        }

        .btn-sm--primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-sm--primary:hover:not(:disabled) { opacity: 0.85; }

        .btn-sm--ghost {
          background: transparent;
          color: var(--text-secondary);
          border-color: var(--border);
        }

        .btn-sm--ghost:hover { background: var(--bg-secondary); color: var(--text-primary); }
      `}</style>
    </div>
  );
}

// ─── Sortable row ─────────────────────────────────────────

function SortableCategoryRow({
  category, editing, onEdit, onDelete, onEditChange, onSaveEdit, onCancelEdit, saving, slugify,
}: {
  category: Category;
  editing: { id: string; nameAr: string; nameEn: string; slug: string } | null;
  onEdit: () => void;
  onDelete: () => void;
  onEditChange: (field: string, val: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  saving: boolean;
  slugify: (s: string) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`cat-row ${isDragging ? "cat-row--dragging" : ""}`}>
      {/* Drag handle */}
      <span className="cat-drag" {...attributes} {...listeners} title="اسحب لإعادة الترتيب">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="5" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="9" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="9" cy="19" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="15" cy="5" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="15" cy="19" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </span>

      {editing ? (
        // Inline edit
        <div className="cat-row-edit">
          <input
            value={editing.nameAr}
            onChange={(e) => onEditChange("nameAr", e.target.value)}
            dir="rtl"
            className="cat-inp cat-inp--sm"
            autoFocus
          />
          <input
            value={editing.nameEn}
            onChange={(e) => {
              onEditChange("nameEn", e.target.value);
              onEditChange("slug", slugify(e.target.value));
            }}
            dir="ltr"
            className="cat-inp cat-inp--sm"
          />
          <input
            value={editing.slug}
            onChange={(e) => onEditChange("slug", slugify(e.target.value))}
            dir="ltr"
            className="cat-inp cat-inp--sm cat-inp--mono"
          />
          <button type="button" className="btn-sm btn-sm--primary" onClick={onSaveEdit} disabled={saving}>
            {saving ? "..." : "حفظ"}
          </button>
          <button type="button" className="btn-sm btn-sm--ghost" onClick={onCancelEdit}>×</button>
        </div>
      ) : (
        // View mode
        <div className="cat-row-view">
          <span className="cat-name-ar">{category.nameAr}</span>
          <span className="cat-name-en">{category.nameEn}</span>
          <span className="cat-slug">{category.slug}</span>
          <span className="cat-count">{category._count?.works ?? 0} عمل</span>
        </div>
      )}

      {!editing && (
        <div className="cat-row-actions">
          <button type="button" className="cat-action-btn" onClick={onEdit} title="تعديل">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button type="button" className="cat-action-btn cat-action-btn--danger" onClick={onDelete} title="حذف">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </button>
        </div>
      )}

      <style>{`
        .cat-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.625rem;
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          border: 1px solid var(--border-subtle);
          transition: background var(--transition-fast);
        }

        .cat-row:hover { background: var(--bg-secondary); }
        .cat-row--dragging { z-index: 200; }

        .cat-drag {
          color: var(--text-subtle);
          cursor: grab;
          padding: 2px;
          flex-shrink: 0;
          touch-action: none;
        }

        .cat-drag:active { cursor: grabbing; }

        .cat-row-view {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
          min-width: 0;
        }

        .cat-name-ar {
          font-size: 0.875rem;
          color: var(--text-primary);
          font-weight: 500;
        }

        .cat-name-en {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .cat-slug {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: monospace;
          background: var(--bg-tertiary);
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
        }

        .cat-count {
          font-size: 0.75rem;
          color: var(--text-subtle);
          margin-right: auto;
        }

        .cat-row-edit {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          flex-wrap: wrap;
        }

        .cat-inp--sm {
          padding: 0.3rem 0.5rem;
          font-size: 0.8125rem;
          flex: 1;
          min-width: 80px;
        }

        .cat-row-actions {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
        }

        .cat-action-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          color: var(--text-muted);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background var(--transition-fast), color var(--transition-fast);
        }

        .cat-action-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .cat-action-btn--danger:hover {
          color: #e53e3e;
          background: #fff5f5;
        }

        .dark .cat-action-btn--danger:hover {
          background: #2d1b1b;
        }
      `}</style>
    </div>
  );
}
