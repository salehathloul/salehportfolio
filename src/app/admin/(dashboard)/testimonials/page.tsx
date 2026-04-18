"use client";

import { useCallback, useEffect, useState } from "react";

interface Testimonial {
  id: string;
  nameAr: string;
  nameEn: string | null;
  roleAr: string | null;
  roleEn: string | null;
  textAr: string;
  textEn: string | null;
  imageUrl: string | null;
  isVisible: boolean;
  order: number;
  createdAt: string;
}

const EMPTY_FORM = {
  nameAr: "",
  nameEn: "",
  roleAr: "",
  roleEn: "",
  textAr: "",
  textEn: "",
  imageUrl: "",
  isVisible: true,
  order: 0,
};

type FormState = typeof EMPTY_FORM;

function TestimonialForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: FormState;
  onSave: (data: FormState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);

  function set(key: keyof FormState, value: string | boolean | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    background: "var(--bg-secondary)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text-primary)",
    fontSize: 14,
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    color: "var(--text-secondary)",
    marginBottom: 4,
  };

  const rowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  };

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 20,
        marginBottom: 24,
      }}
    >
      <div style={{ display: "grid", gap: 14 }}>
        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>الاسم (AR) *</label>
            <input style={fieldStyle} value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} placeholder="الاسم بالعربية" />
          </div>
          <div>
            <label style={labelStyle}>Name (EN)</label>
            <input style={fieldStyle} value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} placeholder="Name in English" />
          </div>
        </div>
        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>المنصب / الدور (AR)</label>
            <input style={fieldStyle} value={form.roleAr} onChange={(e) => set("roleAr", e.target.value)} placeholder="مثال: مجمّع أعمال فنية" />
          </div>
          <div>
            <label style={labelStyle}>Role (EN)</label>
            <input style={fieldStyle} value={form.roleEn} onChange={(e) => set("roleEn", e.target.value)} placeholder="e.g. Art Collector" />
          </div>
        </div>
        <div>
          <label style={labelStyle}>الشهادة (AR) *</label>
          <textarea
            style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }}
            value={form.textAr}
            onChange={(e) => set("textAr", e.target.value)}
            placeholder="نص الشهادة بالعربية"
            dir="rtl"
          />
        </div>
        <div>
          <label style={labelStyle}>Testimonial (EN)</label>
          <textarea
            style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }}
            value={form.textEn}
            onChange={(e) => set("textEn", e.target.value)}
            placeholder="Testimonial text in English"
          />
        </div>
        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>رابط الصورة (اختياري)</label>
            <input style={fieldStyle} value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label style={labelStyle}>الترتيب</label>
            <input
              style={fieldStyle}
              type="number"
              value={form.order}
              onChange={(e) => set("order", parseInt(e.target.value) || 0)}
              min={0}
            />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            id="isVisible"
            type="checkbox"
            checked={form.isVisible}
            onChange={(e) => set("isVisible", e.target.checked)}
            style={{ width: 16, height: 16, cursor: "pointer" }}
          />
          <label htmlFor="isVisible" style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>
            مرئي على الموقع
          </label>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 20px",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            إلغاء
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.nameAr.trim() || !form.textAr.trim()}
            style={{
              padding: "8px 20px",
              background: "var(--accent, #a87c4f)",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: 14,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/testimonials");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(data: FormState) {
    setSaving(true);
    await fetch("/api/admin/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setShowAdd(false);
    load();
  }

  async function handleEdit(id: string, data: FormState) {
    setSaving(true);
    await fetch(`/api/admin/testimonials/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setEditId(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذه الشهادة؟")) return;
    setDeletingId(id);
    await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    setDeletingId(null);
    load();
  }

  async function toggleVisible(item: Testimonial) {
    await fetch(`/api/admin/testimonials/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, isVisible: !item.isVisible }),
    });
    load();
  }

  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }} dir="rtl">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>الشهادات والتزكيات</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>إدارة شهادات المقتنين والمتابعين</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditId(null); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 18px",
            background: "var(--accent, #a87c4f)",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + إضافة شهادة
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <TestimonialForm
          initial={EMPTY_FORM}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
          saving={saving}
        />
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: 60 }}>جاري التحميل...</div>
      ) : items.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "var(--text-secondary)",
            padding: 60,
            border: "2px dashed var(--border)",
            borderRadius: 12,
          }}
        >
          لا توجد شهادات بعد. أضف أول شهادة!
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((item) =>
            editId === item.id ? (
              <TestimonialForm
                key={item.id}
                initial={{
                  nameAr: item.nameAr,
                  nameEn: item.nameEn ?? "",
                  roleAr: item.roleAr ?? "",
                  roleEn: item.roleEn ?? "",
                  textAr: item.textAr,
                  textEn: item.textEn ?? "",
                  imageUrl: item.imageUrl ?? "",
                  isVisible: item.isVisible,
                  order: item.order,
                }}
                onSave={(data) => handleEdit(item.id, data)}
                onCancel={() => setEditId(null)}
                saving={saving}
              />
            ) : (
              <div
                key={item.id}
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "16px 20px",
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: 16,
                  alignItems: "start",
                  opacity: item.isVisible ? 1 : 0.55,
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "var(--border)",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt={item.nameAr} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {item.nameAr.charAt(0)}
                    </div>
                  )}
                </div>
                {/* Content */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>{item.nameAr}</span>
                    {item.nameEn && <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>({item.nameEn})</span>}
                    {item.roleAr && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 20,
                          background: "var(--border)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {item.roleAr}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-secondary)",
                      margin: 0,
                      lineHeight: 1.6,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                    dir="rtl"
                  >
                    {item.textAr}
                  </p>
                  <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-secondary)" }}>
                    ترتيب: {item.order}
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    onClick={() => toggleVisible(item)}
                    title={item.isVisible ? "إخفاء" : "إظهار"}
                    style={{
                      padding: "6px 10px",
                      background: "transparent",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 14,
                      color: item.isVisible ? "#10b981" : "var(--text-secondary)",
                    }}
                  >
                    {item.isVisible ? "●" : "○"}
                  </button>
                  <button
                    onClick={() => { setEditId(item.id); setShowAdd(false); }}
                    style={{
                      padding: "6px 14px",
                      background: "transparent",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 13,
                      color: "var(--text-primary)",
                    }}
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    style={{
                      padding: "6px 14px",
                      background: "transparent",
                      border: "1px solid #ef4444",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 13,
                      color: "#ef4444",
                    }}
                  >
                    {deletingId === item.id ? "..." : "حذف"}
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
