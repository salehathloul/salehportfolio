"use client";

import { useCallback, useEffect, useState } from "react";

interface CollectedBy {
  id: string;
  nameAr: string;
  nameEn: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  isVisible: boolean;
  order: number;
  createdAt: string;
}

const EMPTY_FORM = {
  nameAr: "",
  nameEn: "",
  logoUrl: "",
  websiteUrl: "",
  isVisible: true,
  order: 0,
};

type FormState = typeof EMPTY_FORM;

function CollectedByForm({
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
        <div>
          <label style={labelStyle}>رابط الشعار / الصورة</label>
          <input style={fieldStyle} value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label style={labelStyle}>رابط الموقع الإلكتروني</label>
          <input style={fieldStyle} value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label style={labelStyle}>الترتيب</label>
          <input
            style={{ ...fieldStyle, maxWidth: 120 }}
            type="number"
            value={form.order}
            onChange={(e) => set("order", parseInt(e.target.value) || 0)}
            min={0}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            id="cbIsVisible"
            type="checkbox"
            checked={form.isVisible}
            onChange={(e) => set("isVisible", e.target.checked)}
            style={{ width: 16, height: 16, cursor: "pointer" }}
          />
          <label htmlFor="cbIsVisible" style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>
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
            disabled={saving || !form.nameAr.trim()}
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

export default function CollectedByPage() {
  const [items, setItems] = useState<CollectedBy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/collected-by");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(data: FormState) {
    setSaving(true);
    await fetch("/api/admin/collected-by", {
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
    await fetch(`/api/admin/collected-by/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setEditId(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا المقتني؟")) return;
    setDeletingId(id);
    await fetch(`/api/admin/collected-by/${id}`, { method: "DELETE" });
    setDeletingId(null);
    load();
  }

  async function toggleVisible(item: CollectedBy) {
    await fetch(`/api/admin/collected-by/${item.id}`, {
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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>المقتنون والمجموعات</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>إدارة قائمة المقتنين والمجموعات الفنية التي تحتضن الأعمال</p>
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
          + إضافة مقتنٍ
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <CollectedByForm
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
          لا يوجد مقتنون بعد. أضف أول مقتنٍ!
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((item) =>
            editId === item.id ? (
              <CollectedByForm
                key={item.id}
                initial={{
                  nameAr: item.nameAr,
                  nameEn: item.nameEn ?? "",
                  logoUrl: item.logoUrl ?? "",
                  websiteUrl: item.websiteUrl ?? "",
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
                  alignItems: "center",
                  opacity: item.isVisible ? 1 : 0.55,
                }}
              >
                {/* Logo */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 8,
                    background: "var(--border)",
                    overflow: "hidden",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.logoUrl} alt={item.nameAr} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} />
                  ) : (
                    <span style={{ fontSize: 22, color: "var(--text-secondary)" }}>{item.nameAr.charAt(0)}</span>
                  )}
                </div>
                {/* Content */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>{item.nameAr}</span>
                    {item.nameEn && <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>({item.nameEn})</span>}
                  </div>
                  {item.websiteUrl && (
                    <a
                      href={item.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, color: "var(--accent, #a87c4f)", textDecoration: "none" }}
                    >
                      {item.websiteUrl}
                    </a>
                  )}
                  <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-secondary)" }}>
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
