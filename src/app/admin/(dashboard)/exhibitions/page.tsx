"use client";

import { useEffect, useState, useCallback } from "react";

interface Exhibition {
  id: string;
  titleAr: string;
  titleEn: string;
  locationAr: string | null;
  locationEn: string | null;
  year: number;
  month: number | null;
  type: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  order: number;
}

const TYPES = [
  { value: "solo",        labelAr: "معرض فردي",      labelEn: "Solo Exhibition" },
  { value: "group",       labelAr: "معرض جماعي",     labelEn: "Group Exhibition" },
  { value: "award",       labelAr: "جائزة / تكريم",  labelEn: "Award / Recognition" },
  { value: "publication", labelAr: "نشر / إعلام",    labelEn: "Publication / Press" },
];

const EMPTY: Omit<Exhibition, "id"> = {
  titleAr: "", titleEn: "",
  locationAr: null, locationEn: null,
  year: new Date().getFullYear(), month: null,
  type: "solo",
  descriptionAr: null, descriptionEn: null,
  order: 0,
};

export default function AdminExhibitionsPage() {
  const [items, setItems] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Omit<Exhibition, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/exhibitions");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() { setForm(EMPTY); setEditId("new"); }
  function openEdit(item: Exhibition) {
    const { id, ...rest } = item;
    setForm(rest);
    setEditId(id);
  }
  function closeForm() { setEditId(null); }

  async function save() {
    setSaving(true);
    try {
      if (editId === "new") {
        const res = await fetch("/api/admin/exhibitions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) { const item = await res.json(); setItems((p) => [item, ...p]); closeForm(); }
      } else if (editId) {
        const res = await fetch(`/api/admin/exhibitions/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const updated = await res.json();
          setItems((p) => p.map((i) => i.id === editId ? updated : i));
          closeForm();
        }
      }
    } finally { setSaving(false); }
  }

  async function del(id: string, name: string) {
    if (!confirm(`حذف "${name}"؟`)) return;
    const res = await fetch(`/api/admin/exhibitions/${id}`, { method: "DELETE" });
    if (res.ok) setItems((p) => p.filter((i) => i.id !== id));
  }

  const f = (key: keyof typeof form, val: string | number | null) =>
    setForm((p) => ({ ...p, [key]: val }));

  return (
    <div className="ex-admin" dir="rtl">
      <div className="ex-admin-header">
        <div>
          <h1 className="ex-admin-title">المعارض والجوائز</h1>
          <p className="ex-admin-sub">{items.length} إدخال</p>
        </div>
        <button onClick={openNew} className="ex-add-btn">+ إضافة</button>
      </div>

      {/* Form modal */}
      {editId !== null && (
        <div className="ex-modal-backdrop" onClick={closeForm}>
          <div className="ex-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ex-modal-header">
              <h2 className="ex-modal-title">{editId === "new" ? "إضافة إدخال جديد" : "تعديل"}</h2>
              <button onClick={closeForm} className="ex-modal-close">✕</button>
            </div>

            <div className="ex-form-grid">
              <div className="ex-field">
                <label>العنوان — عربي *</label>
                <input value={form.titleAr} onChange={(e) => f("titleAr", e.target.value)} className="ex-input" dir="rtl" />
              </div>
              <div className="ex-field">
                <label>Title — English</label>
                <input value={form.titleEn} onChange={(e) => f("titleEn", e.target.value)} className="ex-input" dir="ltr" />
              </div>
              <div className="ex-field">
                <label>الموقع — عربي</label>
                <input value={form.locationAr ?? ""} onChange={(e) => f("locationAr", e.target.value || null)} className="ex-input" dir="rtl" />
              </div>
              <div className="ex-field">
                <label>Location — English</label>
                <input value={form.locationEn ?? ""} onChange={(e) => f("locationEn", e.target.value || null)} className="ex-input" dir="ltr" />
              </div>
              <div className="ex-field">
                <label>السنة *</label>
                <input type="number" value={form.year} onChange={(e) => f("year", Number(e.target.value))} className="ex-input" dir="ltr" />
              </div>
              <div className="ex-field">
                <label>الشهر (اختياري)</label>
                <input type="number" min="1" max="12" value={form.month ?? ""} onChange={(e) => f("month", e.target.value ? Number(e.target.value) : null)} className="ex-input" dir="ltr" placeholder="1-12" />
              </div>
              <div className="ex-field ex-field--full">
                <label>النوع</label>
                <div className="ex-type-btns">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => f("type", t.value)}
                      className={`ex-type-btn ${form.type === t.value ? "active" : ""}`}
                    >
                      {t.labelAr}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ex-field ex-field--full">
                <label>الوصف — عربي</label>
                <textarea value={form.descriptionAr ?? ""} onChange={(e) => f("descriptionAr", e.target.value || null)} className="ex-input ex-textarea" dir="rtl" rows={2} />
              </div>
              <div className="ex-field ex-field--full">
                <label>Description — English</label>
                <textarea value={form.descriptionEn ?? ""} onChange={(e) => f("descriptionEn", e.target.value || null)} className="ex-input ex-textarea" dir="ltr" rows={2} />
              </div>
            </div>

            <div className="ex-modal-footer">
              <button onClick={closeForm} className="ex-btn-cancel">إلغاء</button>
              <button onClick={save} disabled={saving || !form.titleAr} className="ex-btn-save">
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="ex-loading">جاري التحميل...</div>
      ) : items.length === 0 ? (
        <div className="ex-empty">لا توجد إدخالات — أضف معرضاً أو جائزة</div>
      ) : (
        <div className="ex-list">
          {items.map((item) => {
            const typeLabel = TYPES.find((t) => t.value === item.type)?.labelAr ?? item.type;
            return (
              <div key={item.id} className="ex-item">
                <div className="ex-item-main">
                  <span className="ex-item-year">{item.year}{item.month ? `/${item.month}` : ""}</span>
                  <div className="ex-item-info">
                    <div className="ex-item-title">{item.titleAr}</div>
                    {item.locationAr && <div className="ex-item-loc">{item.locationAr}</div>}
                  </div>
                  <span className="ex-item-type">{typeLabel}</span>
                </div>
                <div className="ex-item-actions">
                  <button onClick={() => openEdit(item)} className="ex-action-btn">تعديل</button>
                  <button onClick={() => del(item.id, item.titleAr)} className="ex-action-btn ex-action-btn--danger">حذف</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .ex-admin { max-width: 860px; margin: 0 auto; }
        .ex-admin-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
        .ex-admin-title { font-size: 1.5rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem; }
        .ex-admin-sub { font-size: 0.875rem; color: var(--text-muted); }
        .ex-add-btn { height: 38px; padding: 0 1.25rem; background: var(--text-primary); color: var(--bg-primary); border: none; border-radius: var(--radius-md); font-size: 0.875rem; cursor: pointer; }

        /* Modal */
        .ex-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .ex-modal { background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-md); width: min(640px, 100%); max-height: 90vh; overflow-y: auto; padding: 1.5rem; }
        .ex-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
        .ex-modal-title { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); }
        .ex-modal-close { background: none; border: none; font-size: 1rem; color: var(--text-muted); cursor: pointer; }
        .ex-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; margin-bottom: 1.25rem; }
        .ex-field { display: flex; flex-direction: column; gap: 0.3rem; }
        .ex-field label { font-size: 0.8125rem; color: var(--text-secondary); }
        .ex-field--full { grid-column: 1 / -1; }
        .ex-input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-secondary); color: var(--text-primary); font-size: 0.9rem; font-family: inherit; outline: none; box-sizing: border-box; }
        .ex-input:focus { border-color: var(--text-secondary); }
        .ex-textarea { resize: vertical; min-height: 64px; }
        .ex-type-btns { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .ex-type-btn { padding: 0.3rem 0.875rem; border: 1px solid var(--border); border-radius: 999px; background: transparent; font-size: 0.8125rem; color: var(--text-secondary); cursor: pointer; }
        .ex-type-btn.active { background: var(--text-primary); color: var(--bg-primary); border-color: var(--text-primary); }
        .ex-modal-footer { display: flex; justify-content: flex-start; gap: 0.75rem; }
        .ex-btn-cancel { padding: 0.5rem 1.25rem; background: transparent; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary); font-size: 0.875rem; cursor: pointer; }
        .ex-btn-save { padding: 0.5rem 1.5rem; background: var(--text-primary); color: var(--bg-primary); border: none; border-radius: var(--radius-sm); font-size: 0.875rem; cursor: pointer; }
        .ex-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

        /* List */
        .ex-loading, .ex-empty { text-align: center; color: var(--text-muted); padding: 3rem; }
        .ex-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .ex-item { background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.875rem 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .ex-item-main { display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 0; }
        .ex-item-year { font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); min-width: 3.5rem; flex-shrink: 0; }
        .ex-item-info { flex: 1; min-width: 0; }
        .ex-item-title { font-size: 0.9375rem; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ex-item-loc { font-size: 0.8rem; color: var(--text-muted); }
        .ex-item-type { font-size: 0.7rem; border: 1px solid var(--border); border-radius: 999px; padding: 0.1rem 0.6rem; color: var(--text-muted); white-space: nowrap; flex-shrink: 0; }
        .ex-item-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
        .ex-action-btn { padding: 0.3rem 0.75rem; background: transparent; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.8rem; color: var(--text-secondary); cursor: pointer; }
        .ex-action-btn:hover { border-color: var(--text-secondary); color: var(--text-primary); }
        .ex-action-btn--danger { color: #e53e3e; border-color: #fed7d7; }
        .ex-action-btn--danger:hover { background: #fff5f5; }
        .dark .ex-action-btn--danger { border-color: #742a2a; }
        .dark .ex-action-btn--danger:hover { background: #2d1b1b; }

        @media (max-width: 600px) { .ex-form-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
