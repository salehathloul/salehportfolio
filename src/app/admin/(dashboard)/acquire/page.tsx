"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TranslateButton from "@/components/admin/TranslateButton";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AcquireSize {
  id: string;
  label: string;
  totalEditions: number;
  soldEditions: number;
}

interface Spec {
  labelAr: string;
  labelEn: string;
  value: string;
}

interface WorkImage {
  id: string;
  url: string;
  order: number;
}

interface AcquireItem {
  id: string;
  isActive: boolean;
  shippingAvailable: boolean;
  scheduledAt?: string | null;
  specs?: Spec[] | null;
  work: {
    id: string;
    code: string;
    titleAr: string;
    titleEn: string;
    imageUrl: string;
    locationAr?: string | null;
    descriptionAr?: string | null;
    descriptionEn?: string | null;
    images?: WorkImage[];
  };
  sizes: AcquireSize[];
}

interface Work {
  id: string;
  code: string;
  titleAr: string;
  imageUrl: string;
}

// ── Sizes sub-panel ───────────────────────────────────────────────────────────

function SizesPanel({ item, onRefresh }: { item: AcquireItem; onRefresh: () => void }) {
  const [label, setLabel] = useState("");
  const [total, setTotal] = useState("");
  const [adding, setAdding] = useState(false);

  async function addSize() {
    if (!label || !total) return;
    setAdding(true);
    await fetch(`/api/acquire/${item.id}/sizes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, totalEditions: Number(total) }),
    });
    setLabel("");
    setTotal("");
    setAdding(false);
    onRefresh();
  }

  async function removeSize(sizeId: string) {
    await fetch(`/api/acquire/${item.id}/sizes/${sizeId}`, { method: "DELETE" });
    onRefresh();
  }

  async function updateSold(sizeId: string, soldEditions: number) {
    await fetch(`/api/acquire/${item.id}/sizes/${sizeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ soldEditions }),
    });
    onRefresh();
  }

  return (
    <div className="sizes-panel">
      {item.sizes.length === 0 && (
        <p className="sizes-empty">لا توجد مقاسات بعد</p>
      )}
      {item.sizes.map((s) => {
        const remaining = s.totalEditions - s.soldEditions;
        return (
          <div key={s.id} className="size-row">
            <span className="size-label">{s.label}</span>
            <span className="size-editions">
              {remaining} / {s.totalEditions} متبقي
            </span>
            <div className="size-sold-ctrl">
              <span className="size-sold-label">مباع:</span>
              <input
                type="number"
                min={0}
                max={s.totalEditions}
                value={s.soldEditions}
                onChange={(e) => updateSold(s.id, Number(e.target.value))}
                className="size-sold-input"
              />
            </div>
            <button
              onClick={() => removeSize(s.id)}
              className="size-delete-btn"
              title="حذف"
            >
              ×
            </button>
          </div>
        );
      })}

      {/* Add new size */}
      <div className="size-add-row">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder='مثال: 50×70 cm'
          className="size-add-label"
          dir="ltr"
        />
        <input
          type="number"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          placeholder="عدد النسخ"
          min={1}
          className="size-add-count"
        />
        <button
          onClick={addSize}
          disabled={adding || !label || !total}
          className="size-add-btn"
        >
          + إضافة
        </button>
      </div>
    </div>
  );
}

// ── Upload New Photo Modal ─────────────────────────────────────────────────────

function UploadModal({
  onCreated,
  onClose,
}: {
  onCreated: () => void;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploadedWidth, setUploadedWidth] = useState(0);
  const [uploadedHeight, setUploadedHeight] = useState(0);
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [locationAr, setLocationAr] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [sizes, setSizes] = useState([{ label: "", total: "" }]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "acquire");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "فشل الرفع"); setUploading(false); return; }
    setPreview(data.url);
    setUploadedUrl(data.url);
    setUploadedWidth(data.width);
    setUploadedHeight(data.height);
    setUploading(false);
  }

  function addSize() { setSizes((s) => [...s, { label: "", total: "" }]); }
  function updateSize(i: number, key: "label" | "total", val: string) {
    setSizes((s) => s.map((row, idx) => idx === i ? { ...row, [key]: val } : row));
  }
  function removeSize(i: number) { setSizes((s) => s.filter((_, idx) => idx !== i)); }

  async function handleSave() {
    if (!uploadedUrl || !titleAr) { setError("ارفع صورة وأدخل الاسم العربي"); return; }
    setSaving(true);
    const res = await fetch("/api/acquire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl: uploadedUrl,
        width: uploadedWidth,
        height: uploadedHeight,
        titleAr,
        titleEn: titleEn || titleAr,
        locationAr: locationAr || undefined,
        descriptionAr: descriptionAr || undefined,
        descriptionEn: descriptionEn || undefined,
        customCode: customCode || undefined,
        initialSizes: sizes.filter((s) => s.label && s.total).map((s) => ({
          label: s.label,
          totalEditions: Number(s.total),
        })),
      }),
    });
    if (!res.ok) { setError("فشل الحفظ"); setSaving(false); return; }
    onCreated();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-upload" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>رفع صورة جديدة للاقتناء</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="modal-body">
          {/* Image drop zone */}
          <div
            className={`upload-zone ${uploading ? "uploading" : ""} ${preview ? "has-preview" : ""}`}
            onClick={() => !preview && fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="upload-preview" />
            ) : uploading ? (
              <span className="upload-spinner" />
            ) : (
              <span className="upload-placeholder">اسحب صورة هنا أو انقر للاختيار</span>
            )}
            {preview && (
              <button className="upload-change-btn" onClick={(e) => { e.stopPropagation(); setPreview(null); setUploadedUrl(""); fileInputRef.current?.click(); }}>
                تغيير
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

          {/* Fields */}
          <div className="upload-fields">
            <div className="upload-row-2">
              <div className="upload-field">
                <label>الاسم بالعربي *</label>
                <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} placeholder="اسم العمل" dir="rtl" />
              </div>
              <div className="upload-field">
                <label>الاسم بالإنجليزي</label>
                <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="Work title" dir="ltr" />
              </div>
            </div>
            <div className="upload-row-2">
              <div className="upload-field">
                <label>الكود / الرقم</label>
                <input value={customCode} onChange={(e) => setCustomCode(e.target.value)} placeholder="مثال: FA-021" dir="ltr" />
              </div>
              <div className="upload-field">
                <label>الموقع</label>
                <input value={locationAr} onChange={(e) => setLocationAr(e.target.value)} placeholder="مثال: المملكة العربية السعودية" dir="rtl" />
              </div>
            </div>
            <div className="upload-field">
              <label>الوصف بالعربي</label>
              <textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} placeholder="وصف العمل..." dir="rtl" rows={2} className="upload-textarea" />
            </div>
            <div className="upload-field">
              <label>الوصف بالإنجليزي</label>
              <textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} placeholder="Work description..." dir="ltr" rows={2} className="upload-textarea" />
            </div>

            {/* Sizes */}
            <div className="upload-field">
              <label>المقاسات المتاحة</label>
              {sizes.map((s, i) => (
                <div key={i} className="size-input-row">
                  <input value={s.label} onChange={(e) => updateSize(i, "label", e.target.value)} placeholder='مثال: 50×70 cm' dir="ltr" className="size-input-label" />
                  <input value={s.total} onChange={(e) => updateSize(i, "total", e.target.value)} placeholder="عدد النسخ" type="number" min={1} className="size-input-count" />
                  {sizes.length > 1 && (
                    <button type="button" onClick={() => removeSize(i)} className="size-input-remove">×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addSize} className="size-input-add">+ إضافة مقاس</button>
            </div>
          </div>

          {error && <p className="upload-error">{error}</p>}

          <div className="modal-footer">
            <button onClick={onClose} className="btn-outline">إلغاء</button>
            <button onClick={handleSave} disabled={saving || !uploadedUrl || !titleAr} className="btn-primary">
              {saving ? "جاري الحفظ..." : "حفظ وإضافة"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Work selector modal ───────────────────────────────────────────────────────

function WorkSelectorModal({
  existingWorkIds,
  onSelect,
  onClose,
}: {
  existingWorkIds: Set<string>;
  onSelect: (workId: string) => void;
  onClose: () => void;
}) {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portfolio/works?published=true")
      .then((r) => r.json())
      .then((data) => { setWorks(data); setLoading(false); });
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>اختيار من المعرض</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        {loading ? (
          <p className="modal-loading">جاري التحميل...</p>
        ) : works.filter((w) => !existingWorkIds.has(w.id)).length === 0 ? (
          <p className="modal-loading">لا توجد أعمال متاحة</p>
        ) : (
          <div className="work-grid">
            {works
              .filter((w) => !existingWorkIds.has(w.id))
              .map((w) => (
                <button key={w.id} onClick={() => onSelect(w.id)} className="work-pick-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={w.imageUrl} alt="" />
                  <div className="work-pick-info">
                    <span className="work-pick-code">{w.code}</span>
                    <span className="work-pick-title">{w.titleAr}</span>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Edit Item Modal ───────────────────────────────────────────────────────────

function EditItemModal({
  item,
  onSaved,
  onClose,
}: {
  item: AcquireItem;
  onSaved: () => void;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extraFileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>(item.work.imageUrl);
  const [imageUrl, setImageUrl] = useState(item.work.imageUrl);
  const [uploading, setUploading] = useState(false);
  const [extraUploading, setExtraUploading] = useState(false);
  const [titleAr, setTitleAr] = useState(item.work.titleAr);
  const [titleEn, setTitleEn] = useState(item.work.titleEn ?? "");
  const [locationAr, setLocationAr] = useState(item.work.locationAr ?? "");
  const [descriptionAr, setDescriptionAr] = useState(item.work.descriptionAr ?? "");
  const [descriptionEn, setDescriptionEn] = useState(item.work.descriptionEn ?? "");
  const [specs, setSpecs] = useState<Spec[]>(
    Array.isArray((item as AcquireItem & { specs?: Spec[] }).specs)
      ? (item as AcquireItem & { specs?: Spec[] }).specs!
      : []
  );
  const [extraImages, setExtraImages] = useState<WorkImage[]>(item.work.images ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addSpec() { setSpecs(p => [...p, { labelAr: "", labelEn: "", value: "" }]); }
  function removeSpec(i: number) { setSpecs(p => p.filter((_, x) => x !== i)); }
  function setSpec(i: number, k: keyof Spec, v: string) {
    setSpecs(p => p.map((s, x) => x === i ? { ...s, [k]: v } : s));
  }

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "acquire");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "فشل الرفع"); setUploading(false); return; }
    setPreview(data.url);
    setImageUrl(data.url);
    setUploading(false);
  }

  async function handleExtraFile(file: File) {
    setExtraUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "acquire");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) { setExtraUploading(false); return; }
    const imgRes = await fetch(`/api/portfolio/works/${item.work.id}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: data.url }),
    });
    if (imgRes.ok) {
      const created = await imgRes.json();
      setExtraImages(prev => [...prev, created]);
    }
    setExtraUploading(false);
  }

  async function deleteExtraImage(imageId: string) {
    await fetch(`/api/portfolio/works/${item.work.id}/images/${imageId}`, { method: "DELETE" });
    setExtraImages(prev => prev.filter(img => img.id !== imageId));
  }

  async function handleSave() {
    if (!titleAr) { setError("الاسم العربي مطلوب"); return; }
    setSaving(true);
    setError("");
    const res = await fetch(`/api/portfolio/works/${item.work.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl,
        titleAr,
        titleEn: titleEn || titleAr,
        locationAr: locationAr || null,
        descriptionAr: descriptionAr || null,
        descriptionEn: descriptionEn || null,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(typeof d.error === "string" ? d.error : "فشل الحفظ");
      setSaving(false);
      return;
    }
    await fetch(`/api/acquire/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specs }),
    });
    onSaved();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-upload" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>تعديل عمل الاقتناء</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="modal-body">
          {/* Image */}
          <div
            className={`upload-zone ${uploading ? "uploading" : ""} has-preview`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            {uploading ? (
              <span className="upload-spinner" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="upload-preview" />
            )}
            <button
              className="upload-change-btn"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              type="button"
            >
              تغيير الصورة
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          {/* Fields */}
          <div className="upload-fields">
            <div className="upload-row-2">
              <div className="upload-field">
                <label>الاسم بالعربي *</label>
                <input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} dir="rtl" />
              </div>
              <div className="upload-field">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label>الاسم بالإنجليزي</label>
                  <TranslateButton text={titleAr} from="ar" to="en" onResult={v => setTitleEn(v)} />
                </div>
                <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} dir="ltr" />
              </div>
            </div>
            <div className="upload-field">
              <label>الموقع</label>
              <input value={locationAr} onChange={(e) => setLocationAr(e.target.value)} placeholder="مثال: المملكة العربية السعودية" dir="rtl" />
            </div>
            <div className="upload-field">
              <label>الوصف بالعربي</label>
              <textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} dir="rtl" rows={2} className="upload-textarea" />
            </div>
            <div className="upload-field">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label>الوصف بالإنجليزي</label>
                <TranslateButton text={descriptionAr} from="ar" to="en" onResult={v => setDescriptionEn(v)} />
              </div>
              <textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} dir="ltr" rows={2} className="upload-textarea" />
            </div>

            {/* Specs */}
            <div className="upload-field">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <label>المواصفات التقنية</label>
                <button type="button" onClick={addSpec} style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "transparent", cursor: "pointer", color: "var(--text-muted)" }}>+ إضافة</button>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0 0 0.5rem" }}>مثال: خامة الورق → Fine Art Rag 310gsm</p>
              {specs.map((spec, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.4rem", marginBottom: "0.4rem", alignItems: "center" }}>
                  <input value={spec.labelAr} onChange={e => setSpec(i, "labelAr", e.target.value)} placeholder="التسمية عربي" dir="rtl" style={{ padding: "0.375rem 0.5rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.8125rem" }} />
                  <input value={spec.labelEn} onChange={e => setSpec(i, "labelEn", e.target.value)} placeholder="Label EN" dir="ltr" style={{ padding: "0.375rem 0.5rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.8125rem" }} />
                  <input value={spec.value} onChange={e => setSpec(i, "value", e.target.value)} placeholder="القيمة / Value" dir="ltr" style={{ padding: "0.375rem 0.5rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.8125rem" }} />
                  <button type="button" onClick={() => removeSpec(i)} style={{ width: "24px", height: "24px", border: "1px solid var(--border)", borderRadius: "50%", background: "transparent", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
              ))}
            </div>
          </div>

            {/* Extra images gallery */}
            <div className="upload-field">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <label>صور إضافية للعمل</label>
                <button
                  type="button"
                  onClick={() => extraFileRef.current?.click()}
                  disabled={extraUploading}
                  style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", background: "transparent", cursor: "pointer", color: "var(--text-muted)" }}
                >
                  {extraUploading ? "جاري الرفع..." : "+ إضافة صورة"}
                </button>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0 0 0.5rem" }}>
                تُعرض كمعرض صور للزوار في صفحة الاقتناء
              </p>
              <input
                ref={extraFileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleExtraFile(f); e.target.value = ""; }}
              />
              {extraImages.length === 0 ? (
                <div
                  onClick={() => extraFileRef.current?.click()}
                  style={{ border: "2px dashed var(--border)", borderRadius: "var(--radius-sm)", padding: "1.25rem", textAlign: "center", cursor: "pointer", color: "var(--text-subtle)", fontSize: "0.8rem", background: "var(--bg-secondary)", transition: "border-color 150ms" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--text-muted)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  {extraUploading ? "جاري الرفع..." : "+ اضغط لإضافة صور إضافية"}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
                  {extraImages.map((img) => (
                    <div key={img.id} style={{ position: "relative", aspectRatio: "1", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--border)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      <button
                        type="button"
                        onClick={() => deleteExtraImage(img.id)}
                        style={{ position: "absolute", top: "0.25rem", right: "0.25rem", width: "20px", height: "20px", border: "none", borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff", cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >×</button>
                    </div>
                  ))}
                  <div
                    onClick={() => extraFileRef.current?.click()}
                    style={{ aspectRatio: "1", borderRadius: "var(--radius-sm)", border: "2px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-subtle)", fontSize: "1.25rem", background: "var(--bg-secondary)", transition: "border-color 150ms" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--text-muted)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                  >+</div>
                </div>
              )}
            </div>

          {error && <p className="upload-error">{error}</p>}

          <div className="modal-footer">
            <button onClick={onClose} className="btn-outline">إلغاء</button>
            <button onClick={handleSave} disabled={saving || uploading} className="btn-primary">
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────


export default function AcquireAdminPage() {
  const [items, setItems] = useState<AcquireItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSelector, setShowSelector] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<AcquireItem | null>(null);

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/acquire");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function addWork(workId: string) {
    setShowSelector(false);
    await fetch("/api/acquire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workId }),
    });
    fetchItems();
  }

  async function toggleActive(item: AcquireItem) {
    await fetch(`/api/acquire/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive, scheduledAt: null }),
    });
    fetchItems();
  }

  async function scheduleItem(item: AcquireItem, scheduledAt: string) {
    await fetch(`/api/acquire/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: scheduledAt || null }),
    });
    fetchItems();
  }

  async function toggleShipping(item: AcquireItem) {
    await fetch(`/api/acquire/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shippingAvailable: !item.shippingAvailable }),
    });
    fetchItems();
  }

  async function removeItem(id: string) {
    if (!confirm("إزالة هذا العمل من الاقتناء؟")) return;
    await fetch(`/api/acquire/${id}`, { method: "DELETE" });
    fetchItems();
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const existingWorkIds = new Set(items.map((i) => i.work.id));

  return (
    <div className="acquire-page">
      <div className="acquire-header">
        <div>
          <h1 className="acquire-title">الاقتناء</h1>
          <p className="acquire-subtitle">{items.length} عمل متاح</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => setShowUploadModal(true)} className="btn-primary">
            + رفع صورة جديدة
          </button>
          <button onClick={() => setShowSelector(true)} className="btn-outline">
            من المعرض
          </button>
        </div>
      </div>

      {loading ? (
        <div className="acquire-loading">جاري التحميل...</div>
      ) : items.length === 0 ? (
        <div className="acquire-empty">لا توجد أعمال متاحة للاقتناء بعد</div>
      ) : (
        <div className="acquire-list">
          {items.map((item) => {
            const isOpen = expanded.has(item.id);
            const totalRemaining = item.sizes.reduce(
              (sum, s) => sum + (s.totalEditions - s.soldEditions),
              0
            );
            return (
              <div key={item.id} className={`acquire-card ${!item.isActive ? "inactive" : ""}`}>
                {/* Card header */}
                <div className="acquire-card-header">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.work.imageUrl} alt="" className="acquire-card-img" />
                  <div className="acquire-card-info">
                    <div className="acquire-card-top">
                      <span className="acquire-card-code">{item.work.code}</span>
                      <span
                        className={`acquire-badge ${item.scheduledAt ? "scheduled" : item.isActive ? "active" : "inactive"}`}
                      >
                        {item.scheduledAt
                          ? `🕐 ${new Date(item.scheduledAt).toLocaleDateString("ar-SA")}`
                          : item.isActive ? "متاح" : "موقوف"}
                      </span>
                    </div>
                    <h3 className="acquire-card-title">{item.work.titleAr}</h3>
                    <div className="acquire-card-stats">
                      <span>{item.sizes.length} مقاس</span>
                      <span>·</span>
                      <span>{totalRemaining} نسخة متبقية</span>
                    </div>
                  </div>
                  <div className="acquire-card-actions">
                    <button
                      onClick={() => toggleActive(item)}
                      className="btn-outline btn-sm"
                      title={item.isActive ? "إيقاف" : "تفعيل"}
                    >
                      {item.isActive ? "إيقاف" : "تفعيل"}
                    </button>
                    {/* Inline schedule picker */}
                    {!item.isActive && (
                      <input
                        type="datetime-local"
                        className="aq-schedule-input"
                        defaultValue={item.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0,16) : ""}
                        min={new Date().toISOString().slice(0, 16)}
                        title="جدولة التفعيل التلقائي"
                        onChange={(e) => scheduleItem(item, e.target.value)}
                      />
                    )}
                    <button
                      onClick={() => toggleShipping(item)}
                      className={`btn-outline btn-sm ${item.shippingAvailable ? "btn-shipping--on" : ""}`}
                      title={item.shippingAvailable ? "إيقاف التوصيل" : "تفعيل التوصيل"}
                    >
                      {item.shippingAvailable ? "📦 توصيل" : "توصيل"}
                    </button>
                    <button
                      onClick={() => setEditingItem(item)}
                      className="btn-outline btn-sm"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="btn-outline btn-sm"
                    >
                      {isOpen ? "إخفاء" : "المقاسات"}
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="btn-danger btn-sm"
                    >
                      حذف
                    </button>
                  </div>
                </div>

                {/* Sizes panel */}
                {isOpen && (
                  <SizesPanel item={item} onRefresh={fetchItems} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {showUploadModal && (
        <UploadModal
          onCreated={() => { setShowUploadModal(false); fetchItems(); }}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {showSelector && (
        <WorkSelectorModal
          existingWorkIds={existingWorkIds}
          onSelect={addWork}
          onClose={() => setShowSelector(false)}
        />
      )}

      {editingItem && (
        <EditItemModal
          item={editingItem}
          onSaved={() => { setEditingItem(null); fetchItems(); }}
          onClose={() => setEditingItem(null)}
        />
      )}

      <style>{`
        .acquire-page { max-width: 900px; margin: 0 auto; }

        .acquire-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap;
        }
        .acquire-title { font-size: 1.5rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem; }
        .acquire-subtitle { font-size: 0.875rem; color: var(--text-muted); }

        .acquire-loading, .acquire-empty {
          text-align: center; color: var(--text-muted);
          padding: 3rem 1rem; font-size: 0.9375rem;
        }

        .acquire-list { display: flex; flex-direction: column; gap: 0.75rem; }

        .acquire-card {
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: border-color var(--transition-fast);
        }
        .acquire-card.inactive { opacity: 0.65; }

        .acquire-card-header {
          display: grid;
          grid-template-columns: auto 1fr;
          grid-template-rows: auto auto;
          grid-template-areas:
            "img info"
            "img actions";
          gap: 0.5rem 1rem;
          padding: 1rem;
          align-items: start;
        }
        .acquire-card-img {
          grid-area: img;
          width: 72px; height: 72px; object-fit: cover;
          border-radius: var(--radius-sm);
          align-self: center;
        }
        .acquire-card-info {
          grid-area: info;
          min-width: 0;
        }
        .acquire-card-top { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
        .acquire-card-code { font-size: 0.75rem; color: var(--text-muted); font-family: monospace; }
        .acquire-badge {
          font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.5rem;
          border-radius: 999px; text-transform: uppercase; letter-spacing: 0.04em;
        }
        .acquire-badge.active { background: #d1fae5; color: #065f46; }
        .acquire-badge.inactive { background: var(--bg-secondary); color: var(--text-muted); }
        .acquire-badge.scheduled { background: #ede9fe; color: #5b21b6; }
        .dark .acquire-badge.active { background: #064e3b; color: #6ee7b7; }
        .dark .acquire-badge.scheduled { background: #2e1065; color: #c4b5fd; }

        .aq-schedule-input {
          padding: 0.25rem 0.5rem; font-size: 0.72rem;
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          background: var(--bg-primary); color: var(--text-primary);
          cursor: pointer; min-width: 0; max-width: 160px;
        }
        .acquire-card-title { font-size: 1rem; font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem; }
        .acquire-card-stats { font-size: 0.8125rem; color: var(--text-muted); display: flex; gap: 0.375rem; }
        .acquire-card-actions {
          grid-area: actions;
          display: flex; gap: 0.375rem; flex-wrap: wrap;
          align-items: center;
        }

        /* Sizes panel */
        .sizes-panel {
          border-top: 1px solid var(--border);
          padding: 1rem;
          background: var(--bg-secondary);
          display: flex; flex-direction: column; gap: 0.5rem;
        }
        .sizes-empty { font-size: 0.875rem; color: var(--text-subtle); text-align: center; padding: 0.5rem 0; }

        .size-row {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
        }
        .size-label { flex: 1; font-size: 0.9rem; font-weight: 500; direction: ltr; }
        .size-editions { font-size: 0.8125rem; color: var(--text-muted); white-space: nowrap; }
        .size-sold-ctrl { display: flex; align-items: center; gap: 0.375rem; }
        .size-sold-label { font-size: 0.75rem; color: var(--text-subtle); }
        .size-sold-input {
          width: 52px; height: 28px; padding: 0 0.375rem;
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          background: var(--bg-secondary); color: var(--text-primary);
          font-size: 0.8125rem; text-align: center; outline: none;
        }
        .size-delete-btn {
          width: 24px; height: 24px; border: none; background: transparent;
          color: var(--text-subtle); cursor: pointer; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
        }
        .size-delete-btn:hover { background: #fee2e2; color: #e53e3e; }

        .size-add-row {
          display: flex; gap: 0.5rem; align-items: center; margin-top: 0.25rem;
        }
        .size-add-label {
          flex: 1; height: 34px; padding: 0 0.625rem;
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          background: var(--bg-primary); color: var(--text-primary);
          font-size: 0.875rem; outline: none;
        }
        .size-add-label:focus { border-color: var(--text-primary); }
        .size-add-count {
          width: 90px; height: 34px; padding: 0 0.5rem;
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          background: var(--bg-primary); color: var(--text-primary);
          font-size: 0.875rem; outline: none;
        }
        .size-add-count:focus { border-color: var(--text-primary); }
        .size-add-btn {
          height: 34px; padding: 0 0.875rem;
          background: var(--text-primary); color: var(--bg-primary);
          border: none; border-radius: var(--radius-sm);
          font-size: 0.8125rem; font-weight: 500; cursor: pointer; white-space: nowrap;
        }
        .size-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Upload modal */
        .modal-upload { max-width: 520px; }
        .modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; max-height: calc(80vh - 60px); }
        .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding-top: 0.5rem; }

        .upload-zone {
          width: 100%; height: 200px; border: 2px dashed var(--border);
          border-radius: var(--radius-md); display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 0.5rem;
          cursor: pointer; overflow: hidden; position: relative;
          transition: border-color var(--transition-fast), background var(--transition-fast);
          background: var(--bg-secondary);
        }
        .upload-zone:hover:not(.has-preview) {
          border-color: var(--text-secondary);
          background: var(--bg-tertiary);
        }
        .upload-zone.uploading { cursor: default; }
        .upload-placeholder {
          font-size: 0.875rem; color: var(--text-muted);
          display: flex; flex-direction: column; align-items: center; gap: 0.4rem;
        }
        .upload-placeholder::before {
          content: "";
          display: block;
          width: 36px; height: 36px;
          border: 2px dashed var(--border);
          border-radius: var(--radius-sm);
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236b6b6b' stroke-width='1.5' stroke-linecap='round'%3E%3Cpath d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/%3E%3Cpolyline points='17 8 12 3 7 8'/%3E%3Cline x1='12' y1='3' x2='12' y2='15'/%3E%3C/svg%3E") center/20px no-repeat;
        }
        .upload-preview { width: 100%; height: 100%; object-fit: cover; }
        .upload-change-btn {
          position: absolute; bottom: 0.5rem; right: 0.5rem;
          padding: 0.3rem 0.875rem; background: rgba(0,0,0,0.65); color: #fff;
          border: none; border-radius: var(--radius-sm); font-size: 0.75rem; cursor: pointer;
          transition: background 150ms;
        }
        .upload-change-btn:hover { background: rgba(0,0,0,0.85); }
        .upload-spinner {
          width: 28px; height: 28px; border: 2px solid var(--border);
          border-top-color: var(--text-primary); border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .upload-fields { display: flex; flex-direction: column; gap: 0.75rem; }
        .upload-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .upload-field { display: flex; flex-direction: column; gap: 0.35rem; }
        .upload-field label { font-size: 0.78rem; color: var(--text-secondary); }
        .upload-field input, .upload-textarea {
          padding: 0 0.75rem;
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          background: var(--bg-secondary); color: var(--text-primary);
          font-size: 0.875rem; font-family: inherit; outline: none;
        }
        .upload-field input { height: 38px; }
        .upload-field input:focus, .upload-textarea:focus { border-color: var(--text-primary); }
        .upload-textarea { padding: 0.5rem 0.75rem; resize: vertical; }

        .size-input-row { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.4rem; }
        .size-input-label { flex: 1; height: 34px; padding: 0 0.625rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-primary); color: var(--text-primary); font-size: 0.8125rem; outline: none; }
        .size-input-label:focus { border-color: var(--text-primary); }
        .size-input-count { width: 90px; height: 34px; padding: 0 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-primary); color: var(--text-primary); font-size: 0.8125rem; outline: none; }
        .size-input-count:focus { border-color: var(--text-primary); }
        .size-input-remove { width: 28px; height: 28px; border: none; background: transparent; color: var(--text-muted); cursor: pointer; font-size: 1.1rem; border-radius: 50%; }
        .size-input-remove:hover { background: #fee2e2; color: #e53e3e; }
        .size-input-add { background: transparent; border: 1px dashed var(--border); border-radius: var(--radius-sm); padding: 0.3rem 0.875rem; font-size: 0.8rem; color: var(--text-muted); cursor: pointer; width: 100%; margin-top: 0.25rem; }
        .size-input-add:hover { border-color: var(--text-primary); color: var(--text-primary); }
        .upload-error { font-size: 0.8125rem; color: #dc2626; }

        /* Work selector modal */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 50; padding: 1rem;
        }
        .modal-box {
          background: var(--bg-primary); border-radius: var(--radius-lg);
          width: 100%; max-width: 640px; max-height: 80vh;
          overflow: hidden; display: flex; flex-direction: column;
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.25rem; border-bottom: 1px solid var(--border);
        }
        .modal-header h3 { font-size: 1rem; font-weight: 500; color: var(--text-primary); }
        .modal-close {
          width: 28px; height: 28px; border: none; background: transparent;
          color: var(--text-muted); cursor: pointer; font-size: 1.25rem;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
        }
        .modal-close:hover { background: var(--bg-secondary); }
        .modal-loading { padding: 2rem; text-align: center; color: var(--text-muted); }
        .work-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem; padding: 1rem; overflow-y: auto;
        }
        .work-pick-card {
          border: 1px solid var(--border); border-radius: var(--radius-md);
          overflow: hidden; cursor: pointer; background: transparent;
          text-align: right; transition: border-color var(--transition-fast);
          padding: 0;
        }
        .work-pick-card:hover { border-color: var(--text-primary); }
        .work-pick-card img { width: 100%; height: 100px; object-fit: cover; display: block; }
        .work-pick-info { padding: 0.5rem; }
        .work-pick-code { font-size: 0.7rem; color: var(--text-muted); display: block; }
        .work-pick-title { font-size: 0.8125rem; color: var(--text-primary); font-weight: 500; display: block; }

        /* Shared buttons */
        .btn-primary {
          padding: 0.5rem 1.25rem; background: var(--text-primary); color: var(--bg-primary);
          border: none; border-radius: var(--radius-md);
          font-size: 0.875rem; font-weight: 500; cursor: pointer; white-space: nowrap;
          transition: opacity var(--transition-fast);
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.85; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-outline {
          padding: 0.375rem 0.875rem;
          background: transparent; color: var(--text-secondary);
          border: 1px solid var(--border); border-radius: var(--radius-md);
          font-size: 0.8125rem; cursor: pointer;
          transition: border-color var(--transition-fast), color var(--transition-fast);
        }
        .btn-outline:hover { border-color: var(--text-secondary); color: var(--text-primary); }

        .btn-danger {
          padding: 0.375rem 0.875rem;
          background: transparent; color: #e53e3e;
          border: 1px solid #fed7d7; border-radius: var(--radius-md);
          font-size: 0.8125rem; cursor: pointer;
          transition: background var(--transition-fast);
        }
        .btn-danger:hover { background: #fff5f5; }
        .dark .btn-danger { border-color: #742a2a; }
        .dark .btn-danger:hover { background: #2d1b1b; }

        .btn-sm { padding: 0.25rem 0.625rem; font-size: 0.75rem; }
      `}</style>
    </div>
  );
}
