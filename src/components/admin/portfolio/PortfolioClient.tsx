"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent, DragOverlay, DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import WorkModal, { type WorkFormData, type Category } from "./WorkModal";
import CategoryManager from "./CategoryManager";
import DisplaySettings from "./DisplaySettings";
import ProjectModal, { type AdminProject as ModalAdminProject } from "./ProjectModal";

// ─── Types ────────────────────────────────────────────────

interface WorkImage {
  id: string;
  url: string;
  order: number;
}

interface Work {
  id: string;
  code: string;
  titleAr: string;
  titleEn: string;
  locationAr: string | null;
  imageUrl: string;
  width: number;
  height: number;
  isPublished: boolean;
  isFeatured: boolean;
  order: number;
  categoryId: string | null;
  category: { id: string; nameAr: string; nameEn: string; slug: string } | null;
  categories?: { id: string; nameAr: string; nameEn: string; slug: string }[];
  images?: WorkImage[];
  // for edit modal
  locationEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  dateTaken?: string | null;
  lat?: number | null;
  lng?: number | null;
  mapsUrl?: string | null;
  keywords?: string | null;
  scheduledAt?: string | null;
}

type GridLayout = "grid" | "masonry" | "scattered";

interface AdminProject {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  coverImage: string;
  isPublished: boolean;
  showInPortfolio: boolean;
  _count: { images: number };
}

interface Props {
  initialWorks: Work[];
  initialCategories: Category[];
  initialProjects: AdminProject[];
  initialDisplaySettings: { availableLayouts: GridLayout[]; defaultLayout: GridLayout };
}

type ActiveTab = "works" | "categories" | "projects" | "display";

// ─── Main component ───────────────────────────────────────

export default function PortfolioClient({
  initialWorks,
  initialCategories,
  initialProjects,
  initialDisplaySettings,
}: Props) {
  const [works, setWorks] = useState<Work[]>(initialWorks);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [projects, setProjects] = useState<AdminProject[]>(initialProjects);
  const [activeTab, setActiveTab] = useState<ActiveTab>("works");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");

  // ── Bulk selection ─────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("");
  const [bulkSaving, setBulkSaving] = useState(false);

  // Modal state — work
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<WorkFormData | null>(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Modal state — project (shortcut from works tab)
  const [quickProjectOpen, setQuickProjectOpen] = useState(false);

  // DnD active item
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // ── Filtered works ───────────────────────────────────────

  const displayed = filterCategoryId === "all"
    ? works
    : works.filter((w) => w.categoryId === filterCategoryId);

  // ── DnD ──────────────────────────────────────────────────

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    // Reorder within the full works array (not just filtered)
    const oldIdx = works.findIndex((w) => w.id === active.id);
    const newIdx = works.findIndex((w) => w.id === over.id);
    const reordered = arrayMove(works, oldIdx, newIdx).map((w, i) => ({ ...w, order: i }));
    setWorks(reordered);

    await fetch("/api/portfolio/works/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: reordered.map((w) => ({ id: w.id, order: w.order })) }),
    });
  }

  // ── Modal ─────────────────────────────────────────────────

  function openAddModal() {
    setEditingWork(null);
    setModalError("");
    setModalOpen(true);
  }

  function openEditModal(work: Work) {
    setEditingWork({
      id: work.id,
      code: work.code,
      titleAr: work.titleAr,
      titleEn: work.titleEn,
      locationAr: work.locationAr,
      locationEn: work.locationEn,
      descriptionAr: work.descriptionAr,
      descriptionEn: work.descriptionEn,
      imageUrl: work.imageUrl,
      width: work.width,
      height: work.height,
      dateTaken: work.dateTaken ?? null,
      categoryId: work.categoryId,
      categoryIds: (work as { categories?: { id: string }[] }).categories?.map((c) => c.id)
        ?? (work.categoryId ? [work.categoryId] : []),
      isPublished: work.isPublished,
      isFeatured: work.isFeatured,
      additionalImages: (work.images ?? []).map((img) => img.url),
      lat: work.lat ?? null,
      lng: work.lng ?? null,
      mapsUrl: (work as { mapsUrl?: string | null }).mapsUrl ?? null,
      keywords: (work as { keywords?: string | null }).keywords ?? null,
      scheduledAt: (work as { scheduledAt?: string | null }).scheduledAt ?? null,
    });
    setModalError("");
    setModalOpen(true);
  }

  const handleSave = useCallback(async (data: WorkFormData & { id?: string; additionalImages: string[] }) => {
    setModalSaving(true);
    setModalError("");

    const isEdit = !!data.id;
    const url = isEdit ? `/api/portfolio/works/${data.id}` : "/api/portfolio/works";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // Try to parse JSON; fall back to raw text so we see the real error
      let result: Record<string, unknown> = {};
      const rawText = await res.text();
      try { result = JSON.parse(rawText); } catch {
        setModalError(`خطأ ${res.status}: ${rawText.slice(0, 200)}`);
        return;
      }

      if (!res.ok) {
        const errMsg = typeof result.error === "string"
          ? result.error
          : JSON.stringify(result).slice(0, 300);
        setModalError(errMsg || "فشل الحفظ");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const saved = result as any;
      if (isEdit) {
        setWorks((prev) => prev.map((w) => (w.id === saved.id ? { ...w, ...saved } : w)));
      } else {
        setWorks((prev) => [...prev, saved]);
      }
      setModalOpen(false);
    } catch (err) {
      setModalError(`خطأ في الاتصال: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setModalSaving(false);
    }
  }, []);

  // ── Toggle published ──────────────────────────────────────

  async function togglePublished(work: Work) {
    const updated = { ...work, isPublished: !work.isPublished };
    setWorks((prev) => prev.map((w) => (w.id === work.id ? updated : w)));

    await fetch(`/api/portfolio/works/${work.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: updated.isPublished }),
    });
  }

  // ── Delete ────────────────────────────────────────────────

  async function deleteWork(id: string) {
    if (!confirm("حذف هذا العمل نهائياً؟")) return;
    const res = await fetch(`/api/portfolio/works/${id}`, { method: "DELETE" });
    if (res.ok) {
      setWorks((prev) => prev.filter((w) => w.id !== id));
      setSelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    } else {
      const data = await res.json();
      alert(data.error ?? "فشل الحذف");
    }
  }

  // ── Display settings save ─────────────────────────────────

  async function saveDisplaySettings(data: { availableLayouts: GridLayout[]; defaultLayout: GridLayout }) {
    const res = await fetch("/api/portfolio/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("فشل الحفظ");
  }

  // ── Bulk selection helpers ────────────────────────────────

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(displayed.map((w) => w.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setBulkCategoryId("");
  }

  // ── Bulk update ───────────────────────────────────────────

  async function applyBulkCategory() {
    if (selectedIds.size === 0) return;
    setBulkSaving(true);
    try {
      const updates: Record<string, unknown> = {
        categoryId: bulkCategoryId === "__none__" ? null : bulkCategoryId || null,
      };
      const res = await fetch("/api/portfolio/works/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selectedIds], updates }),
      });
      if (!res.ok) { alert("فشل تحديث التصنيف"); return; }
      const { updated } = await res.json() as { updated: { id: string; categoryId: string | null }[] };
      setWorks((prev) =>
        prev.map((w) => {
          const upd = updated.find((u) => u.id === w.id);
          if (!upd) return w;
          const cat = categories.find((c) => c.id === upd.categoryId) ?? null;
          return { ...w, categoryId: upd.categoryId, category: cat };
        })
      );
    } finally {
      setBulkSaving(false);
    }
  }

  async function applyBulkFeatured(isFeatured: boolean) {
    if (selectedIds.size === 0) return;
    setBulkSaving(true);
    try {
      const res = await fetch("/api/portfolio/works/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selectedIds], updates: { isFeatured } }),
      });
      if (!res.ok) { alert("فشل تحديث الحالة"); return; }
      setWorks((prev) =>
        prev.map((w) => selectedIds.has(w.id) ? { ...w, isFeatured } : w)
      );
    } finally {
      setBulkSaving(false);
    }
  }

  const activeWork = works.find((w) => w.id === activeId);
  const selectedCount = selectedIds.size;
  const allDisplayedSelected = displayed.length > 0 && displayed.every((w) => selectedIds.has(w.id));

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="pc-root">
      {/* Page header */}
      <div className="pc-header">
        <div>
          <h1 className="pc-title">المعرض</h1>
          <p className="pc-subtitle">{works.length} عمل</p>
        </div>
        <div className="pc-header-actions">
          <button type="button" className="pc-project-btn" onClick={() => setQuickProjectOpen(true)}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="1" width="5.5" height="5.5" rx="1"/><rect x="7.5" y="1" width="5.5" height="5.5" rx="1"/>
              <rect x="1" y="7.5" width="5.5" height="5.5" rx="1"/><rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1"/>
            </svg>
            رفع مشروع فوتوغرافي
          </button>
          <button type="button" className="pc-add-btn" onClick={openAddModal}>
            + إضافة عمل
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="pc-tabs">
        {(["works", "categories", "projects", "display"] as const).map((tab) => {
          const labels = { works: "الأعمال", categories: "التصنيفات", projects: "المشاريع الفوتوغرافية", display: "إعدادات العرض" };
          return (
            <button
              key={tab}
              type="button"
              className={`pc-tab ${activeTab === tab ? "pc-tab--active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ── Tab: Works ── */}
      {activeTab === "works" && (
        <div className="pc-works">
          {/* Category filter */}
          <div className="pc-filters">
            <button
              type="button"
              className={`filter-chip ${filterCategoryId === "all" ? "filter-chip--active" : ""}`}
              onClick={() => setFilterCategoryId("all")}
            >
              الكل ({works.length})
            </button>
            {categories.map((cat) => {
              const count = works.filter((w) => w.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`filter-chip ${filterCategoryId === cat.id ? "filter-chip--active" : ""}`}
                  onClick={() => setFilterCategoryId(cat.id)}
                >
                  {cat.nameAr} ({count})
                </button>
              );
            })}
          </div>

          {/* ── Bulk action bar ── */}
          {selectedCount > 0 && (
            <div className="bulk-bar">
              <div className="bulk-bar-left">
                <button type="button" className="bulk-clear" onClick={clearSelection} title="إلغاء التحديد">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                    <path d="M11 3L3 11M3 3l8 8"/>
                  </svg>
                </button>
                <span className="bulk-count">
                  {selectedCount} {selectedCount === 1 ? "عمل محدد" : "أعمال محددة"}
                </span>
              </div>

              <div className="bulk-bar-right">
                {/* Featured toggle */}
                <button
                  type="button"
                  className="bulk-btn bulk-btn--star"
                  onClick={() => applyBulkFeatured(true)}
                  disabled={bulkSaving}
                  title="إضافة للصفحة الرئيسية"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span>إضافة للرئيسية</span>
                </button>
                <button
                  type="button"
                  className="bulk-btn"
                  onClick={() => applyBulkFeatured(false)}
                  disabled={bulkSaving}
                  title="إزالة من الصفحة الرئيسية"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span>إزالة من الرئيسية</span>
                </button>

                {/* Divider */}
                <div className="bulk-sep" />

                {/* Category change */}
                <select
                  className="bulk-select"
                  value={bulkCategoryId}
                  onChange={(e) => setBulkCategoryId(e.target.value)}
                >
                  <option value="">— اختر التصنيف —</option>
                  <option value="__none__">بدون تصنيف</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nameAr}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="bulk-btn bulk-btn--primary"
                  onClick={applyBulkCategory}
                  disabled={bulkSaving || !bulkCategoryId}
                >
                  {bulkSaving ? "جارٍ..." : "تطبيق التصنيف"}
                </button>
              </div>
            </div>
          )}

          {/* Select all row */}
          {displayed.length > 0 && (
            <div className="pc-select-row">
              <label className="pc-select-all">
                <input
                  type="checkbox"
                  checked={allDisplayedSelected}
                  onChange={allDisplayedSelected ? clearSelection : selectAll}
                  className="pc-cb"
                />
                <span>{allDisplayedSelected ? "إلغاء تحديد الكل" : `تحديد الكل (${displayed.length})`}</span>
              </label>
            </div>
          )}

          {/* Grid */}
          {displayed.length === 0 ? (
            <div className="pc-empty">
              <p>لا توجد أعمال بعد</p>
              <button type="button" className="pc-add-btn" onClick={openAddModal}>
                أضف أول عمل
              </button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={displayed.map((w) => w.id)} strategy={rectSortingStrategy}>
                <div className="works-grid">
                  {displayed.map((work) => (
                    <SortableWorkCard
                      key={work.id}
                      work={work}
                      isSelected={selectedIds.has(work.id)}
                      onToggleSelect={() => toggleSelect(work.id)}
                      onEdit={() => openEditModal(work)}
                      onDelete={() => deleteWork(work.id)}
                      onTogglePublished={() => togglePublished(work)}
                    />
                  ))}
                </div>
              </SortableContext>

              {/* Drag preview */}
              <DragOverlay>
                {activeWork && (
                  <div className="work-card work-card--overlay">
                    <div className="work-card-img-wrap">
                      <Image
                        src={activeWork.imageUrl}
                        alt={activeWork.titleAr}
                        fill
                        className="work-card-img"
                        sizes="200px"
                        unoptimized
                      />
                    </div>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      )}

      {/* ── Tab: Projects ── */}
      {activeTab === "projects" && (
        <ProjectsTab projects={projects} onUpdate={setProjects} />
      )}

      {/* ── Tab: Categories ── */}
      {activeTab === "categories" && (
        <CategoryManager categories={categories} onChange={setCategories} />
      )}

      {/* ── Tab: Display ── */}
      {activeTab === "display" && (
        <DisplaySettings
          availableLayouts={initialDisplaySettings.availableLayouts}
          defaultLayout={initialDisplaySettings.defaultLayout}
          onSave={saveDisplaySettings}
        />
      )}

      {/* Modal — Work */}
      <WorkModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editingWork}
        categories={categories}
        saving={modalSaving}
        error={modalError}
      />

      {/* Modal — Quick project (from works header) */}
      {quickProjectOpen && (
        <ProjectModal
          onClose={() => setQuickProjectOpen(false)}
          onSaved={(saved: AdminProject) => {
            setProjects((prev) => {
              const exists = prev.find((p) => p.id === saved.id);
              return exists
                ? prev.map((p) => p.id === saved.id ? saved : p)
                : [saved, ...prev];
            });
            setQuickProjectOpen(false);
          }}
        />
      )}

      <PortfolioStyles />
    </div>
  );
}

// ─── Projects Tab ────────────────────────────────────────

function ProjectsTab({
  projects,
  onUpdate,
}: {
  projects: AdminProject[];
  onUpdate: (p: AdminProject[]) => void;
}) {
  const [modalOpen, setModalOpen]     = useState(false);
  const [editingProj, setEditingProj] = useState<AdminProject | null>(null);
  const [saving, setSaving]           = useState<string | null>(null);
  const [deleting, setDeleting]       = useState<string | null>(null);

  async function togglePortfolio(proj: AdminProject) {
    setSaving(proj.id);
    const updated = { ...proj, showInPortfolio: !proj.showInPortfolio };
    try {
      const res = await fetch(`/api/admin/projects/${proj.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showInPortfolio: updated.showInPortfolio }),
      });
      if (res.ok) onUpdate(projects.map((p) => (p.id === proj.id ? updated : p)));
    } finally { setSaving(null); }
  }

  async function deleteProject(proj: AdminProject) {
    if (!confirm(`حذف "${proj.titleAr}"؟ لا يمكن التراجع.`)) return;
    setDeleting(proj.id);
    try {
      const res = await fetch(`/api/admin/projects/${proj.id}`, { method: "DELETE" });
      if (res.ok) onUpdate(projects.filter((p) => p.id !== proj.id));
    } finally { setDeleting(null); }
  }

  function openNew()              { setEditingProj(null); setModalOpen(true); }
  function openEdit(p: AdminProject) { setEditingProj(p); setModalOpen(true); }

  function handleSaved(saved: ModalAdminProject) {
    const already = projects.find((p) => p.id === saved.id);
    if (already) {
      onUpdate(projects.map((p) => (p.id === saved.id ? saved : p)));
    } else {
      onUpdate([...projects, saved]);
    }
  }

  return (
    <div className="pj-root">
      {/* Toolbar */}
      <div className="pj-toolbar">
        <p className="pj-hint">
          المشاريع المُفعَّلة تظهر في المعرض تحت تصنيف «مشاريع فوتوغرافية».
        </p>
        <button className="pj-new-btn" onClick={openNew}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M6.5 1v11M1 6.5h11"/>
          </svg>
          مشروع جديد
        </button>
      </div>

      {/* List */}
      {projects.length === 0 ? (
        <div className="pj-empty">
          لا توجد مشاريع بعد — ابدأ بإنشاء مشروع جديد
        </div>
      ) : (
        <div className="pj-list">
          {projects.map((proj) => (
            <div key={proj.id} className="pj-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={proj.coverImage} alt="" className="pj-cover" />
              <div className="pj-info">
                <span className="pj-title">{proj.titleAr}</span>
                <span className="pj-meta">{proj.titleEn} · {proj._count.images} صورة</span>
              </div>
              <span className={`pj-badge ${proj.showInPortfolio ? "pj-badge--on" : "pj-badge--off"}`}>
                {proj.showInPortfolio ? "في المعرض" : "مخفي"}
              </span>

              {/* Actions */}
              <button className="pj-action-btn" onClick={() => openEdit(proj)} title="تعديل">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                className={`pj-action-btn ${proj.showInPortfolio ? "pj-action-btn--warn" : "pj-action-btn--ok"}`}
                disabled={saving === proj.id}
                onClick={() => togglePortfolio(proj)}
                title={proj.showInPortfolio ? "إخفاء من المعرض" : "إظهار في المعرض"}
              >
                {saving === proj.id ? "..." : proj.showInPortfolio
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
              <button
                className="pj-action-btn pj-action-btn--del"
                disabled={deleting === proj.id}
                onClick={() => deleteProject(proj)}
                title="حذف"
              >
                {deleting === proj.id ? "..." : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <ProjectModal
          project={editingProj ?? undefined}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      <style>{`
        .pj-root { display: flex; flex-direction: column; gap: 1rem; }
        .pj-toolbar {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 1rem; flex-wrap: wrap;
        }
        .pj-hint {
          font-size: 0.78rem; color: var(--text-muted);
          flex: 1; margin: 0; padding-top: 0.15rem;
        }
        .pj-new-btn {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.5rem 1rem; flex-shrink: 0;
          background: var(--text-primary); color: var(--bg-primary);
          border: none; border-radius: var(--radius-md);
          font-size: 0.82rem; font-family: inherit; cursor: pointer;
          transition: opacity var(--transition-fast);
        }
        .pj-new-btn:hover { opacity: 0.85; }
        .pj-empty {
          padding: 3rem; text-align: center;
          color: var(--text-muted); font-size: 0.875rem;
          border: 1.5px dashed var(--border); border-radius: var(--radius-lg);
        }
        .pj-list { display: flex; flex-direction: column; }
        .pj-row {
          display: flex; align-items: center; gap: 0.875rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border-subtle);
        }
        .pj-row:last-child { border-bottom: none; }
        .pj-cover {
          width: 52px; height: 52px; object-fit: cover;
          border-radius: var(--radius-sm); flex-shrink: 0;
          background: var(--bg-secondary);
        }
        .pj-info { flex: 1; display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
        .pj-title { font-size: 0.875rem; font-weight: 500; color: var(--text-primary); }
        .pj-meta { font-size: 0.72rem; color: var(--text-muted); }
        .pj-badge {
          font-size: 0.68rem; padding: 0.15rem 0.5rem;
          border-radius: 999px; white-space: nowrap; flex-shrink: 0;
        }
        .pj-badge--on  { background: #dcfce7; color: #166534; }
        .pj-badge--off { background: var(--bg-tertiary); color: var(--text-muted); }

        .pj-action-btn {
          width: 30px; height: 30px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--border); border-radius: var(--radius-md);
          background: transparent; cursor: pointer;
          color: var(--text-muted); font-family: inherit; font-size: 0.72rem;
          transition: all var(--transition-fast);
        }
        .pj-action-btn:hover:not(:disabled) { border-color: var(--text-secondary); color: var(--text-primary); }
        .pj-action-btn--ok:hover:not(:disabled) { border-color: #16a34a; color: #16a34a; }
        .pj-action-btn--warn:hover:not(:disabled) { border-color: #d97706; color: #d97706; }
        .pj-action-btn--del:hover:not(:disabled) { border-color: #ef4444; color: #ef4444; }
        .pj-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

// ─── Sortable Work Card ───────────────────────────────────

function SortableWorkCard({
  work, isSelected, onToggleSelect, onEdit, onDelete, onTogglePublished,
}: {
  work: Work;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublished: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: work.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`work-card ${isSelected ? "work-card--selected" : ""}`}
    >
      {/* Checkbox — top left */}
      <button
        type="button"
        className={`work-cb ${isSelected ? "work-cb--checked" : ""}`}
        onClick={onToggleSelect}
        aria-label={isSelected ? "إلغاء التحديد" : "تحديد"}
      >
        {isSelected && (
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1.5 5l3 3 4-5"/>
          </svg>
        )}
      </button>

      {/* Drag handle */}
      <div className="work-drag" {...attributes} {...listeners} title="اسحب لإعادة الترتيب">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/>
          <circle cx="15" cy="5" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
        </svg>
      </div>

      {/* Image */}
      <div className="work-card-img-wrap">
        <Image
          src={work.imageUrl}
          alt={work.titleAr}
          fill
          className="work-card-img"
          sizes="(max-width: 768px) 50vw, 200px"
          unoptimized
        />
        {(work as { scheduledAt?: string | null }).scheduledAt && (
          <div className="work-badge work-badge--scheduled">
            🕐 {new Date((work as { scheduledAt: string }).scheduledAt).toLocaleDateString("ar-SA")}
          </div>
        )}
        {!work.isPublished && !(work as { scheduledAt?: string | null }).scheduledAt && (
          <div className="work-badge work-badge--hidden">مخفي</div>
        )}
        {work.isFeatured && <div className="work-badge work-badge--featured">★</div>}
      </div>

      {/* Info */}
      <div className="work-card-info">
        <span className="work-code">{work.code}</span>
        <span className="work-title">{work.titleAr}</span>
        {work.locationAr && <span className="work-loc">{work.locationAr}</span>}
        {work.category && <span className="work-cat">{work.category.nameAr}</span>}
      </div>

      {/* Actions */}
      <div className="work-card-actions">
        <button type="button" className="work-action" onClick={onTogglePublished}
          title={work.isPublished ? "إخفاء" : "نشر"}>
          {work.isPublished ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          )}
        </button>
        <button type="button" className="work-action" onClick={onEdit} title="تعديل">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button type="button" className="work-action work-action--danger" onClick={onDelete} title="حذف">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────

function PortfolioStyles() {
  return (
    <style>{`
      .pc-root { display: flex; flex-direction: column; gap: 1.5rem; max-width: 1200px; }

      .pc-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
      }

      .pc-title { font-size: 1.375rem; font-weight: 500; color: var(--text-primary); }
      .pc-subtitle { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.2rem; }

      .pc-add-btn {
        padding: 0.5rem 1.25rem;
        background: var(--text-primary);
        color: var(--bg-primary);
        border: none;
        border-radius: var(--radius-md);
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
        transition: opacity var(--transition-fast);
      }

      .pc-add-btn:hover { opacity: 0.85; }

      .pc-header-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
      }

      .pc-project-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.5rem 1rem;
        background: transparent;
        color: var(--text-secondary);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        cursor: pointer;
        white-space: nowrap;
        transition: border-color var(--transition-fast), color var(--transition-fast), background var(--transition-fast);
      }
      .pc-project-btn:hover {
        border-color: var(--text-primary);
        color: var(--text-primary);
        background: var(--bg-secondary);
      }

      /* Tabs */
      .pc-tabs {
        display: flex;
        gap: 2px;
        background: var(--bg-tertiary);
        padding: 4px;
        border-radius: var(--radius-md);
        width: fit-content;
      }

      .pc-tab {
        padding: 0.375rem 0.875rem;
        border: none;
        background: transparent;
        color: var(--text-muted);
        font-size: 0.875rem;
        border-radius: calc(var(--radius-md) - 2px);
        cursor: pointer;
        transition: background var(--transition-fast), color var(--transition-fast);
        white-space: nowrap;
      }

      .pc-tab--active {
        background: var(--bg-primary);
        color: var(--text-primary);
        font-weight: 500;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }

      /* Filters */
      .pc-filters {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .filter-chip {
        padding: 0.3rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: 999px;
        background: transparent;
        color: var(--text-muted);
        font-size: 0.8125rem;
        cursor: pointer;
        transition: all var(--transition-fast);
        white-space: nowrap;
      }

      .filter-chip:hover { border-color: var(--text-muted); color: var(--text-secondary); }

      .filter-chip--active {
        background: var(--text-primary);
        color: var(--bg-primary);
        border-color: var(--text-primary);
      }

      /* ── Bulk bar ── */
      .bulk-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.75rem;
        padding: 0.625rem 1rem;
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        animation: bulk-bar-in 0.18s ease;
      }

      @keyframes bulk-bar-in {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .bulk-bar-left {
        display: flex;
        align-items: center;
        gap: 0.625rem;
      }

      .bulk-bar-right {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .bulk-count {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      .bulk-clear {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px; height: 26px;
        border: 1px solid var(--border);
        border-radius: 50%;
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .bulk-clear:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
      }

      .bulk-sep {
        width: 1px;
        height: 20px;
        background: var(--border);
        flex-shrink: 0;
      }

      .bulk-btn {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.375rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: transparent;
        color: var(--text-secondary);
        font-size: 0.8125rem;
        cursor: pointer;
        white-space: nowrap;
        transition: all var(--transition-fast);
      }

      .bulk-btn:hover:not(:disabled) {
        background: var(--bg-tertiary);
        color: var(--text-primary);
        border-color: var(--text-muted);
      }

      .bulk-btn--star:hover:not(:disabled) {
        color: #d97706;
        border-color: #d97706;
      }

      .bulk-btn--primary {
        background: var(--text-primary);
        color: var(--bg-primary);
        border-color: var(--text-primary);
      }

      .bulk-btn--primary:hover:not(:disabled) {
        opacity: 0.85;
        background: var(--text-primary);
        color: var(--bg-primary);
      }

      .bulk-btn:disabled { opacity: 0.5; cursor: not-allowed; }

      .bulk-select {
        padding: 0.375rem 0.625rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: 0.8125rem;
        cursor: pointer;
        min-width: 140px;
      }

      /* Select all row */
      .pc-select-row {
        display: flex;
        align-items: center;
      }

      .pc-select-all {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
        color: var(--text-muted);
        cursor: pointer;
        user-select: none;
      }

      .pc-select-all:hover { color: var(--text-secondary); }

      .pc-cb {
        width: 15px; height: 15px;
        border: 1.5px solid var(--border);
        border-radius: 3px;
        cursor: pointer;
        accent-color: var(--text-primary);
      }

      /* Works grid */
      .works-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 0.875rem;
      }

      @media (max-width: 640px) {
        .works-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.625rem; }
      }

      /* Work card */
      .work-card {
        position: relative;
        background: var(--bg-primary);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
      }

      .work-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
      .work-card--overlay { box-shadow: 0 8px 32px rgba(0,0,0,0.25); cursor: grabbing; }
      .work-card--selected {
        border-color: var(--text-primary);
        box-shadow: 0 0 0 2px var(--text-primary);
      }

      /* Checkbox button */
      .work-cb {
        position: absolute;
        top: 6px;
        left: 6px;
        z-index: 10;
        width: 20px; height: 20px;
        border-radius: 4px;
        border: 1.5px solid rgba(255,255,255,0.7);
        background: rgba(0,0,0,0.35);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
        backdrop-filter: blur(2px);
      }

      .work-card:hover .work-cb,
      .work-cb--checked { opacity: 1; }

      .work-cb--checked {
        background: var(--text-primary);
        border-color: var(--text-primary);
      }

      .work-drag {
        position: absolute;
        top: 6px;
        right: 6px;
        z-index: 10;
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,0.4);
        color: white;
        border-radius: 4px;
        cursor: grab;
        touch-action: none;
        opacity: 0;
        transition: opacity var(--transition-fast);
      }

      .work-card:hover .work-drag { opacity: 1; }
      .work-drag:active { cursor: grabbing; }

      .work-card-img-wrap {
        position: relative;
        width: 100%;
        aspect-ratio: 3/2;
        background: var(--bg-tertiary);
        overflow: hidden;
      }

      .work-card-img { object-fit: cover; }

      .work-badge {
        position: absolute;
        bottom: 6px;
        right: 6px;
        font-size: 0.6875rem;
        font-weight: 600;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
      }

      .work-badge--hidden {
        background: rgba(0,0,0,0.6);
        color: #fff;
      }

      .work-badge--scheduled {
        background: rgba(99,102,241,0.85);
        color: #fff;
      }

      .work-badge--featured {
        background: rgba(255,200,0,0.9);
        color: #000;
        left: 6px;
        right: auto;
      }

      .work-card-info {
        padding: 0.5rem 0.625rem;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        flex: 1;
      }

      .work-code {
        font-size: 0.6875rem;
        font-weight: 600;
        color: var(--text-muted);
        font-family: monospace;
        letter-spacing: 0.04em;
      }

      .work-title {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .work-loc {
        font-size: 0.75rem;
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .work-cat {
        font-size: 0.6875rem;
        color: var(--text-subtle);
        background: var(--bg-tertiary);
        padding: 0.1rem 0.4rem;
        border-radius: 4px;
        width: fit-content;
        margin-top: 0.1rem;
      }

      .work-card-actions {
        display: flex;
        border-top: 1px solid var(--border-subtle);
      }

      .work-action {
        flex: 1;
        padding: 0.4rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        transition: background var(--transition-fast), color var(--transition-fast);
        border-left: 1px solid var(--border-subtle);
      }

      .work-action:first-child { border-left: none; }
      .work-action:hover { background: var(--bg-secondary); color: var(--text-primary); }
      .work-action--danger:hover { color: #e53e3e; background: #fff5f5; }
      .dark .work-action--danger:hover { background: #2d1b1b; }

      /* Empty state */
      .pc-empty {
        text-align: center;
        padding: 4rem 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        color: var(--text-muted);
      }

      .pc-works { display: flex; flex-direction: column; gap: 1rem; }
    `}</style>
  );
}
