"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import ImageUploader, { type UploadedImage } from "@/components/admin/ImageUploader";
import TranslateButton from "@/components/admin/TranslateButton";

// ─── Types ────────────────────────────────────────────────

interface ExperienceItem {
  titleAr: string; titleEn: string;
  orgAr: string;   orgEn: string;
  period: string;
  descAr: string;  descEn: string;
}

interface AchievementItem {
  titleAr: string; titleEn: string;
  year: string;
  descAr: string;  descEn: string;
}

interface InitialData {
  layout: string;
  imageUrl: string | null;
  nameAr: string | null;
  nameEn: string | null;
  bioAr: string | null;
  bioEn: string | null;
  experience: ExperienceItem[];
  achievements: AchievementItem[];
}

// ─── Layout options ────────────────────────────────────────

const LAYOUTS = [
  {
    id: "classic", label: "كلاسيك",
    svg: <svg width="56" height="38" viewBox="0 0 56 38" fill="none">
      <rect x="1" y="1" width="22" height="36" rx="2" fill="currentColor" opacity="0.18" />
      <rect x="28" y="5" width="26" height="5" rx="1" fill="currentColor" opacity="0.45" />
      <rect x="28" y="14" width="20" height="3" rx="1" fill="currentColor" opacity="0.28" />
      <rect x="28" y="20" width="26" height="3" rx="1" fill="currentColor" opacity="0.2" />
    </svg>,
  },
  {
    id: "stacked", label: "مكدس",
    svg: <svg width="56" height="38" viewBox="0 0 56 38" fill="none">
      <rect x="8" y="1" width="40" height="17" rx="2" fill="currentColor" opacity="0.18" />
      <rect x="4" y="22" width="48" height="4" rx="1" fill="currentColor" opacity="0.45" />
      <rect x="8" y="29" width="40" height="3" rx="1" fill="currentColor" opacity="0.22" />
    </svg>,
  },
  {
    id: "portrait", label: "بورتريه",
    svg: <svg width="56" height="38" viewBox="0 0 56 38" fill="none">
      <rect x="1" y="1" width="18" height="36" rx="2" fill="currentColor" opacity="0.18" />
      <rect x="24" y="4" width="30" height="4" rx="1" fill="currentColor" opacity="0.45" />
      <rect x="24" y="12" width="26" height="3" rx="1" fill="currentColor" opacity="0.28" />
      <rect x="24" y="18" width="30" height="3" rx="1" fill="currentColor" opacity="0.2" />
    </svg>,
  },
  {
    id: "minimal", label: "مينيمال",
    svg: <svg width="56" height="38" viewBox="0 0 56 38" fill="none">
      <circle cx="28" cy="10" r="7" fill="currentColor" opacity="0.2" />
      <rect x="8" y="21" width="40" height="4" rx="1" fill="currentColor" opacity="0.45" />
      <rect x="12" y="28" width="32" height="3" rx="1" fill="currentColor" opacity="0.22" />
    </svg>,
  },
];

// ─── Helpers ───────────────────────────────────────────────

function emptyExp(): ExperienceItem {
  return { titleAr: "", titleEn: "", orgAr: "", orgEn: "", period: "", descAr: "", descEn: "" };
}
function emptyAch(): AchievementItem {
  return { titleAr: "", titleEn: "", year: "", descAr: "", descEn: "" };
}

function centerAspectCrop(w: number, h: number, aspect: number): Crop {
  return centerCrop(makeAspectCrop({ unit: "%", width: 90 }, aspect, w, h), w, h);
}

// ─── Crop Modal ────────────────────────────────────────────

function CropModal({
  srcUrl,
  aspect,
  onDone,
  onCancel,
}: {
  srcUrl: string;
  aspect: number;
  onDone: (croppedDataUrl: string) => void;
  onCancel: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    setCrop(centerAspectCrop(w, h, aspect));
  }

  function applyCrop() {
    const img = imgRef.current;
    if (!img || !crop) return;

    const canvas = document.createElement("canvas");
    const scaleX = img.naturalWidth  / img.width;
    const scaleY = img.naturalHeight / img.height;

    // crop is in % when unit="%"
    const cropPx = crop.unit === "%" ? {
      x: (crop.x / 100) * img.width,
      y: (crop.y / 100) * img.height,
      width:  (crop.width  / 100) * img.width,
      height: (crop.height / 100) * img.height,
    } : crop;

    canvas.width  = cropPx.width  * scaleX;
    canvas.height = cropPx.height * scaleY;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      img,
      cropPx.x * scaleX, cropPx.y * scaleY,
      cropPx.width * scaleX, cropPx.height * scaleY,
      0, 0, canvas.width, canvas.height
    );
    onDone(canvas.toDataURL("image/jpeg", 0.92));
  }

  return (
    <div className="crop-overlay" onClick={onCancel}>
      <div className="crop-box" onClick={(e) => e.stopPropagation()}>
        <div className="crop-header">
          <span>اقتصاص الصورة</span>
          <button type="button" className="crop-close" onClick={onCancel}>×</button>
        </div>
        <div className="crop-area">
          <ReactCrop crop={crop} onChange={setCrop} aspect={aspect} keepSelection>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={srcUrl}
              alt="crop"
              onLoad={onImageLoad}
              style={{ maxWidth: "100%", maxHeight: "60vh", display: "block" }}
            />
          </ReactCrop>
        </div>
        <div className="crop-footer">
          <button type="button" className="ae-save-btn" onClick={applyCrop}>تطبيق الاقتصاص</button>
        </div>
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────

export default function AboutEditor({ initial }: { initial: InitialData }) {
  const [layout,       setLayout]       = useState(initial.layout ?? "classic");
  const [imageUrl,     setImageUrl]     = useState<string>(initial.imageUrl ?? "");
  const [nameAr,       setNameAr]       = useState(initial.nameAr ?? "");
  const [nameEn,       setNameEn]       = useState(initial.nameEn ?? "");
  const [bioAr,        setBioAr]        = useState(initial.bioAr ?? "");
  const [bioEn,        setBioEn]        = useState(initial.bioEn ?? "");
  const [experience,   setExperience]   = useState<ExperienceItem[]>(initial.experience ?? []);
  const [achievements, setAchievements] = useState<AchievementItem[]>(initial.achievements ?? []);

  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [errMsg,  setErrMsg]  = useState<string | null>(null);

  // Crop state
  const [cropSrc,  setCropSrc]  = useState<string | null>(null);
  const [cropUploading, setCropUploading] = useState(false);
  const cropAspect = layout === "portrait" ? 2 / 3 : layout === "stacked" ? 16 / 9 : 3 / 4;

  // ── Save ──────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setErrMsg(null);
    try {
      const res = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layout,
          imageUrl: imageUrl || null,
          nameAr: nameAr || null,
          nameEn: nameEn || null,
          bioAr:  bioAr  || null,
          bioEn:  bioEn  || null,
          experience,
          achievements,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrMsg(res.status === 401 ? "__auth__" : (data?.error ?? `خطأ ${res.status}`));
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setErrMsg("تعذّر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  // ── Crop apply → upload ───────────────────────────────────

  const applyCroppedImage = useCallback(async (dataUrl: string) => {
    setCropSrc(null);
    setCropUploading(true);
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "about");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) setImageUrl(data.url);
    } finally {
      setCropUploading(false);
    }
  }, []);

  // ── Experience helpers ────────────────────────────────────

  function addExp()    { setExperience(p => [...p, emptyExp()]); }
  function removeExp(i: number) { setExperience(p => p.filter((_, x) => x !== i)); }
  function setExp<K extends keyof ExperienceItem>(i: number, k: K, v: string) {
    setExperience(p => p.map((item, x) => x === i ? { ...item, [k]: v } : item));
  }

  // ── Achievement helpers ───────────────────────────────────

  function addAch()    { setAchievements(p => [...p, emptyAch()]); }
  function removeAch(i: number) { setAchievements(p => p.filter((_, x) => x !== i)); }
  function setAch<K extends keyof AchievementItem>(i: number, k: K, v: string) {
    setAchievements(p => p.map((item, x) => x === i ? { ...item, [k]: v } : item));
  }

  // ── Image uploader value ──────────────────────────────────

  const uploaderValue: UploadedImage | null = imageUrl
    ? { publicId: "", url: imageUrl, width: 0, height: 0,
        sizes: { thumbnail: imageUrl, medium: imageUrl, large: imageUrl, original: imageUrl } }
    : null;

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="ae-root" dir="rtl">

      {/* ── Header ── */}
      <div className="ae-header">
        <div>
          <h1 className="ae-title">صفحة عني</h1>
          <p className="ae-sub">تحرير المحتوى والتخطيط</p>
        </div>
        <div className="ae-hdr-actions">
          {saved  && <span className="ae-ok">✓ تم الحفظ</span>}
          {errMsg && <ErrMsg msg={errMsg} />}
          <button className="ae-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="ae-body">

        {/* ── 1. Layout ── */}
        <div className="ae-section">
          <h2 className="ae-section-title">تخطيط الصفحة</h2>
          <div className="ae-layouts">
            {LAYOUTS.map(l => (
              <button key={l.id} type="button"
                className={`ae-layout-btn ${layout === l.id ? "ae-layout-btn--on" : ""}`}
                onClick={() => setLayout(l.id)}
              >
                <div className="ae-layout-svg">{l.svg}</div>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 2. Photo + Crop ── */}
        {layout !== "minimal" && (
          <div className="ae-section">
            <h2 className="ae-section-title">الصورة الشخصية</h2>
            <div className="ae-photo-row">
              <ImageUploader
                folder="about"
                value={uploaderValue}
                onChange={img => setImageUrl(img?.url ?? "")}
                label="رفع صورة"
                aspectHint={layout === "portrait" ? "2:3" : layout === "stacked" ? "16:9" : "3:4"}
              />

              {/* Crop button — only shows when there's an image */}
              {imageUrl && (
                <button
                  type="button"
                  className="ae-crop-btn"
                  onClick={() => setCropSrc(imageUrl)}
                  disabled={cropUploading}
                >
                  {cropUploading ? (
                    <span className="ae-crop-spin" />
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                        <path d="M6 2v14a2 2 0 002 2h14"/>
                        <path d="M18 22V8a2 2 0 00-2-2H2"/>
                      </svg>
                      اقتصاص الصورة
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Preview of current image */}
            {imageUrl && (
              <div className="ae-photo-preview">
                <Image src={imageUrl} alt="preview" fill className="ae-photo-img" sizes="180px" />
              </div>
            )}
          </div>
        )}

        {/* ── 3. Name ── */}
        <div className="ae-section">
          <h2 className="ae-section-title">الاسم</h2>
          <div className="ae-row2">
            <div className="ae-field">
              <div className="ae-label-row">
                <label className="ae-label">بالعربية</label>
              </div>
              <input className="ae-input" dir="rtl" value={nameAr} onChange={e => setNameAr(e.target.value)} placeholder="صالح الهذلول" />
            </div>
            <div className="ae-field">
              <div className="ae-label-row">
                <label className="ae-label">English</label>
                <TranslateButton text={nameAr} from="ar" to="en" onResult={v => setNameEn(v)} />
              </div>
              <input className="ae-input" dir="ltr" value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="Saleh Alhuthloul" />
            </div>
          </div>
        </div>

        {/* ── 4. Bio ── */}
        <div className="ae-section">
          <h2 className="ae-section-title">النبذة التعريفية</h2>
          <div className="ae-row2">
            <div className="ae-field">
              <label className="ae-label">بالعربية</label>
              <textarea className="ae-textarea" dir="rtl" rows={5} value={bioAr} onChange={e => setBioAr(e.target.value)} placeholder="اكتب نبذة بالعربية..." />
            </div>
            <div className="ae-field">
              <div className="ae-label-row">
                <label className="ae-label">English</label>
                <TranslateButton text={bioAr} from="ar" to="en" onResult={v => setBioEn(v)} />
              </div>
              <textarea className="ae-textarea" dir="ltr" rows={5} value={bioEn} onChange={e => setBioEn(e.target.value)} placeholder="Write a bio in English..." />
            </div>
          </div>
        </div>

        {/* ── 5. Experience ── */}
        <div className="ae-section">
          <div className="ae-section-hdr">
            <h2 className="ae-section-title" style={{ borderBottom: "none", paddingBottom: 0 }}>التجارب والمشاريع</h2>
            <button type="button" className="ae-add-btn" onClick={addExp}>+ إضافة</button>
          </div>
          {experience.length === 0 && <p className="ae-empty">لا توجد تجارب بعد</p>}
          {experience.map((item, i) => (
            <div key={i} className="ae-card">
              <div className="ae-card-hdr">
                <span className="ae-card-num">#{i + 1}</span>
                <button type="button" className="ae-rm-btn" onClick={() => removeExp(i)}>حذف</button>
              </div>
              <div className="ae-row2">
                <div className="ae-field">
                  <label className="ae-label">المسمى — عربي</label>
                  <input className="ae-input" dir="rtl" value={item.titleAr} onChange={e => setExp(i,"titleAr",e.target.value)} placeholder="مصور فوتوغرافي" />
                </div>
                <div className="ae-field">
                  <div className="ae-label-row">
                    <label className="ae-label">Title — English</label>
                    <TranslateButton text={item.titleAr} from="ar" to="en" onResult={v => setExp(i,"titleEn",v)} />
                  </div>
                  <input className="ae-input" dir="ltr" value={item.titleEn} onChange={e => setExp(i,"titleEn",e.target.value)} placeholder="Photographer" />
                </div>
              </div>
              <div className="ae-row2">
                <div className="ae-field">
                  <label className="ae-label">الجهة — عربي</label>
                  <input className="ae-input" dir="rtl" value={item.orgAr} onChange={e => setExp(i,"orgAr",e.target.value)} placeholder="الاستوديو الشخصي" />
                </div>
                <div className="ae-field">
                  <div className="ae-label-row">
                    <label className="ae-label">Organisation — English</label>
                    <TranslateButton text={item.orgAr} from="ar" to="en" onResult={v => setExp(i,"orgEn",v)} />
                  </div>
                  <input className="ae-input" dir="ltr" value={item.orgEn} onChange={e => setExp(i,"orgEn",e.target.value)} placeholder="Personal Studio" />
                </div>
              </div>
              <div className="ae-field" style={{ maxWidth: 280 }}>
                <label className="ae-label">الفترة الزمنية</label>
                <input className="ae-input" dir="ltr" value={item.period} onChange={e => setExp(i,"period",e.target.value)} placeholder="2020 – الآن" />
              </div>
              <div className="ae-row2">
                <div className="ae-field">
                  <label className="ae-label">الوصف — عربي</label>
                  <textarea className="ae-textarea" dir="rtl" rows={3} value={item.descAr} onChange={e => setExp(i,"descAr",e.target.value)} />
                </div>
                <div className="ae-field">
                  <div className="ae-label-row">
                    <label className="ae-label">Description — English</label>
                    <TranslateButton text={item.descAr} from="ar" to="en" onResult={v => setExp(i,"descEn",v)} />
                  </div>
                  <textarea className="ae-textarea" dir="ltr" rows={3} value={item.descEn} onChange={e => setExp(i,"descEn",e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── 6. Achievements ── */}
        <div className="ae-section">
          <div className="ae-section-hdr">
            <h2 className="ae-section-title" style={{ borderBottom: "none", paddingBottom: 0 }}>الإنجازات</h2>
            <button type="button" className="ae-add-btn" onClick={addAch}>+ إضافة</button>
          </div>
          {achievements.length === 0 && <p className="ae-empty">لا توجد إنجازات بعد</p>}
          {achievements.map((item, i) => (
            <div key={i} className="ae-card">
              <div className="ae-card-hdr">
                <span className="ae-card-num">#{i + 1}</span>
                <button type="button" className="ae-rm-btn" onClick={() => removeAch(i)}>حذف</button>
              </div>
              <div className="ae-row2">
                <div className="ae-field">
                  <label className="ae-label">العنوان — عربي</label>
                  <input className="ae-input" dir="rtl" value={item.titleAr} onChange={e => setAch(i,"titleAr",e.target.value)} placeholder="جائزة التميز" />
                </div>
                <div className="ae-field">
                  <div className="ae-label-row">
                    <label className="ae-label">Title — English</label>
                    <TranslateButton text={item.titleAr} from="ar" to="en" onResult={v => setAch(i,"titleEn",v)} />
                  </div>
                  <input className="ae-input" dir="ltr" value={item.titleEn} onChange={e => setAch(i,"titleEn",e.target.value)} placeholder="Excellence Award" />
                </div>
              </div>
              <div className="ae-field" style={{ maxWidth: 200 }}>
                <label className="ae-label">السنة</label>
                <input className="ae-input" dir="ltr" value={item.year} onChange={e => setAch(i,"year",e.target.value)} placeholder="2024" />
              </div>
              <div className="ae-row2">
                <div className="ae-field">
                  <label className="ae-label">الوصف — عربي</label>
                  <textarea className="ae-textarea" dir="rtl" rows={3} value={item.descAr} onChange={e => setAch(i,"descAr",e.target.value)} />
                </div>
                <div className="ae-field">
                  <div className="ae-label-row">
                    <label className="ae-label">Description — English</label>
                    <TranslateButton text={item.descAr} from="ar" to="en" onResult={v => setAch(i,"descEn",v)} />
                  </div>
                  <textarea className="ae-textarea" dir="ltr" rows={3} value={item.descEn} onChange={e => setAch(i,"descEn",e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom save */}
        <div className="ae-footer">
          {saved  && <span className="ae-ok">✓ تم الحفظ</span>}
          {errMsg && <ErrMsg msg={errMsg} />}
          <button className="ae-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </div>

      {/* ── Crop modal ── */}
      {cropSrc && (
        <CropModal
          srcUrl={cropSrc}
          aspect={cropAspect}
          onDone={applyCroppedImage}
          onCancel={() => setCropSrc(null)}
        />
      )}

      <AeStyles />
    </div>
  );
}

// ─── Error message ────────────────────────────────────────

function ErrMsg({ msg }: { msg: string }) {
  if (msg === "__auth__") {
    return (
      <span className="ae-err">
        انتهت جلستك —{" "}
        <a href="/admin/login" className="ae-err-link">أعد تسجيل الدخول</a>
      </span>
    );
  }
  return <span className="ae-err">{msg}</span>;
}

// ─── Styles ───────────────────────────────────────────────

function AeStyles() {
  return (
    <style>{`
      .ae-root { display: flex; flex-direction: column; min-height: 100%; }

      .ae-header {
        position: sticky; top: 0; z-index: 20;
        background: var(--bg-primary);
        border-bottom: 1px solid var(--border);
        padding: 0.875rem 1.5rem;
        display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      }
      .ae-title { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin: 0; }
      .ae-sub   { font-size: 0.8125rem; color: var(--text-muted); margin: 0; }
      .ae-hdr-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; justify-content: flex-end; }

      .ae-body { padding: 2rem 1.5rem; display: flex; flex-direction: column; gap: 2.5rem; max-width: 860px; }

      .ae-section { display: flex; flex-direction: column; gap: 1rem; }
      .ae-section-hdr { display: flex; align-items: center; justify-content: space-between; }
      .ae-section-title {
        font-size: 0.9375rem; font-weight: 600; color: var(--text-primary);
        margin: 0; padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--border-subtle); width: 100%;
      }
      .ae-empty {
        font-size: 0.875rem; color: var(--text-muted); text-align: center;
        padding: 2rem; border: 1px dashed var(--border); border-radius: var(--radius-lg);
        background: var(--bg-secondary); margin: 0;
      }

      /* Layout buttons */
      .ae-layouts { display: grid; grid-template-columns: repeat(4,1fr); gap: 0.75rem; }
      @media (max-width: 640px) { .ae-layouts { grid-template-columns: repeat(2,1fr); } }
      .ae-layout-btn {
        display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
        padding: 0.875rem 0.625rem;
        background: var(--bg-secondary); border: 2px solid var(--border);
        border-radius: var(--radius-lg); cursor: pointer; color: var(--text-secondary);
        font-size: 0.8rem;
        transition: border-color var(--transition-fast), background var(--transition-fast);
      }
      .ae-layout-btn:hover { border-color: var(--text-muted); background: var(--bg-tertiary); }
      .ae-layout-btn--on { border-color: var(--text-primary); background: var(--bg-tertiary); color: var(--text-primary); font-weight: 600; }
      .ae-layout-svg { display: flex; }

      /* Photo area */
      .ae-photo-row { display: flex; align-items: flex-end; gap: 1rem; flex-wrap: wrap; }
      .ae-photo-preview {
        position: relative; width: 120px; height: 120px;
        border-radius: var(--radius-md); overflow: hidden;
        border: 1px solid var(--border);
        background: var(--bg-secondary); flex-shrink: 0;
      }
      .ae-photo-img { object-fit: cover; }
      .ae-crop-btn {
        display: inline-flex; align-items: center; gap: 0.4rem;
        padding: 0.45rem 0.875rem;
        border: 1px solid var(--border); border-radius: var(--radius-md);
        background: var(--bg-secondary); color: var(--text-secondary);
        font-size: 0.8125rem; cursor: pointer;
        transition: all var(--transition-fast);
      }
      .ae-crop-btn:hover { background: var(--bg-tertiary); color: var(--text-primary); border-color: var(--text-muted); }
      .ae-crop-spin {
        display: inline-block; width: 12px; height: 12px;
        border: 1.5px solid currentColor; border-top-color: transparent;
        border-radius: 50%; animation: ae-spin 0.7s linear infinite;
      }
      @keyframes ae-spin { to { transform: rotate(360deg); } }

      /* Fields */
      .ae-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
      @media (max-width: 640px) { .ae-row2 { grid-template-columns: 1fr; } }
      .ae-field { display: flex; flex-direction: column; gap: 0.35rem; }
      .ae-label-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
      .ae-label { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); }
      .ae-input, .ae-textarea {
        width: 100%; padding: 0.5rem 0.75rem;
        border: 1px solid var(--border); border-radius: var(--radius-md);
        background: var(--bg-primary); color: var(--text-primary);
        font-size: 0.875rem; font-family: inherit;
        transition: border-color var(--transition-fast);
        box-sizing: border-box;
      }
      .ae-input:focus, .ae-textarea:focus { outline: none; border-color: var(--text-muted); }
      .ae-textarea { resize: vertical; }

      /* Cards */
      .ae-card {
        background: var(--bg-secondary); border: 1px solid var(--border);
        border-radius: var(--radius-lg); padding: 1.25rem;
        display: flex; flex-direction: column; gap: 1rem;
      }
      .ae-card-hdr { display: flex; align-items: center; justify-content: space-between; }
      .ae-card-num { font-size: 0.8125rem; color: var(--text-muted); font-weight: 600; }
      .ae-rm-btn {
        padding: 0.25rem 0.625rem; border: 1px solid var(--border); border-radius: var(--radius-md);
        background: transparent; color: var(--text-muted);
        font-size: 0.75rem; cursor: pointer;
        transition: color var(--transition-fast), background var(--transition-fast);
      }
      .ae-rm-btn:hover { color: #ef4444; background: #fff0f0; border-color: #ef4444; }

      /* Buttons */
      .ae-save-btn {
        padding: 0.5rem 1.25rem; background: var(--text-primary); color: var(--bg-primary);
        border: none; border-radius: var(--radius-md);
        font-size: 0.875rem; font-weight: 500; cursor: pointer;
        transition: opacity var(--transition-fast); white-space: nowrap;
      }
      .ae-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .ae-save-btn:not(:disabled):hover { opacity: 0.85; }
      .ae-add-btn {
        padding: 0.35rem 0.875rem; border: 1px solid var(--border); border-radius: var(--radius-md);
        background: transparent; color: var(--text-secondary);
        font-size: 0.8125rem; cursor: pointer; white-space: nowrap;
        transition: background var(--transition-fast);
      }
      .ae-add-btn:hover { background: var(--bg-secondary); color: var(--text-primary); }

      .ae-ok  { font-size: 0.8125rem; font-weight: 500; color: #22c55e; }
      .ae-err { font-size: 0.8125rem; color: #ef4444; }
      .ae-err-link { color: #ef4444; text-decoration: underline; cursor: pointer; }

      .ae-footer {
        display: flex; align-items: center; gap: 0.75rem;
        padding-top: 1rem; border-top: 1px solid var(--border); flex-wrap: wrap;
      }

      /* ── Crop modal ── */
      .crop-overlay {
        position: fixed; inset: 0; z-index: 200;
        background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center; padding: 1rem;
      }
      .crop-box {
        background: var(--bg-primary); border-radius: var(--radius-lg);
        width: 100%; max-width: 700px; overflow: hidden;
        display: flex; flex-direction: column;
      }
      .crop-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 0.875rem 1.25rem;
        border-bottom: 1px solid var(--border);
        font-size: 0.9375rem; font-weight: 600; color: var(--text-primary);
      }
      .crop-close {
        width: 28px; height: 28px; border: 1px solid var(--border);
        border-radius: 50%; background: transparent; color: var(--text-muted);
        font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center;
      }
      .crop-area { padding: 1.25rem; display: flex; justify-content: center; overflow: auto; }
      .crop-footer {
        padding: 0.875rem 1.25rem; border-top: 1px solid var(--border);
        display: flex; justify-content: flex-end;
      }
    `}</style>
  );
}
