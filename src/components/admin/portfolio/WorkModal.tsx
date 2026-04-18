"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import ImageUploader, { type UploadedImage } from "@/components/admin/ImageUploader";
import type { Category } from "./types";

// ─── Schema ───────────────────────────────────────────────

const schema = z.object({
  code: z.string().min(1, "مطلوب").max(20).regex(/^[A-Z]{2}-\d+$/, "الصيغة: XX-000 مثلاً FA-001"),
  titleAr: z.string().min(1, "مطلوب").max(200),
  titleEn: z.string().min(1, "مطلوب").max(200),
  locationAr: z.string().max(200).optional().nullable(),
  locationEn: z.string().max(200).optional().nullable(),
  descriptionAr: z.string().max(2000).optional().nullable(),
  descriptionEn: z.string().max(2000).optional().nullable(),
  imageUrl: z.string().min(1, "الصورة مطلوبة"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  dateTaken: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  mapsUrl: z.string().url().optional().nullable().or(z.literal("").transform(() => null)),
  keywords: z.string().max(500).optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

// ─── Types ────────────────────────────────────────────────

export interface WorkFormData {
  id?: string;
  code?: string;
  titleAr?: string;
  titleEn?: string;
  locationAr?: string | null;
  locationEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  imageUrl?: string;
  width?: number;
  height?: number;
  dateTaken?: string | null;
  categoryId?: string | null;
  categoryIds?: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  lat?: number | null;
  lng?: number | null;
  mapsUrl?: string | null;
  keywords?: string | null;
  scheduledAt?: string | null;
  additionalImages?: string[];
}

export type { Category } from "./types";

interface WorkModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: FormValues & { id?: string; additionalImages: string[] }) => Promise<void>;
  initialData?: WorkFormData | null;
  categories: Category[];
  saving?: boolean;
  error?: string;
}

// ─── Component ────────────────────────────────────────────

export default function WorkModal({
  open,
  onClose,
  onSave,
  initialData,
  categories,
  saving = false,
  error,
}: WorkModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const addImgInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initialData?.id;
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [uploadingExtra, setUploadingExtra] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      titleAr: "",
      titleEn: "",
      locationAr: "",
      locationEn: "",
      descriptionAr: "",
      descriptionEn: "",
      imageUrl: "",
      width: 0,
      height: 0,
      dateTaken: "",
      categoryId: "",
      categoryIds: [],
      isPublished: true,
      isFeatured: false,
      lat: null,
      lng: null,
      mapsUrl: "",
      keywords: "",
      scheduledAt: "",
    },
  });

  // Upload additional images
  const uploadExtra = useCallback(async (files: FileList | null) => {
    if (!files) return;
    setUploadingExtra(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "portfolio");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json() as { url: string };
        urls.push(data.url);
      }
      setAdditionalImages((prev) => [...prev, ...urls]);
    } catch {
      alert("فشل رفع الصورة");
    } finally {
      setUploadingExtra(false);
      if (addImgInputRef.current) addImgInputRef.current.value = "";
    }
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (open) {
      setAdditionalImages(initialData?.additionalImages ?? []);
      reset({
        code: initialData?.code ?? "",
        titleAr: initialData?.titleAr ?? "",
        titleEn: initialData?.titleEn ?? "",
        locationAr: initialData?.locationAr ?? "",
        locationEn: initialData?.locationEn ?? "",
        descriptionAr: initialData?.descriptionAr ?? "",
        descriptionEn: initialData?.descriptionEn ?? "",
        imageUrl: initialData?.imageUrl ?? "",
        width: initialData?.width ?? 0,
        height: initialData?.height ?? 0,
        dateTaken: initialData?.dateTaken
          ? new Date(initialData.dateTaken).toISOString().split("T")[0]
          : "",
        categoryId: initialData?.categoryId ?? "",
        categoryIds: initialData?.categoryIds ?? (initialData?.categoryId ? [initialData.categoryId] : []),
        isPublished: initialData?.isPublished ?? true,
        isFeatured: initialData?.isFeatured ?? false,
        lat: initialData?.lat ?? null,
        lng: initialData?.lng ?? null,
        mapsUrl: initialData?.mapsUrl ?? "",
        keywords: initialData?.keywords ?? "",
        scheduledAt: initialData?.scheduledAt
          ? new Date(initialData.scheduledAt).toISOString().slice(0, 16)
          : "",
      });
    }
  }, [open, initialData, reset]);

  // Close on overlay click
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const imageUrl = watch("imageUrl");

  function handleImageUploaded(img: UploadedImage | null) {
    if (img) {
      setValue("imageUrl", img.url, { shouldValidate: true });
      setValue("width", img.width, { shouldValidate: true });
      setValue("height", img.height, { shouldValidate: true });
    } else {
      setValue("imageUrl", "", { shouldValidate: true });
      setValue("width", 0);
      setValue("height", 0);
    }
  }

  async function onSubmit(values: FormValues) {
    await onSave({ ...values, id: initialData?.id, additionalImages });
  }

  if (!open) return null;

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? "تعديل العمل" : "إضافة عمل جديد"}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="إغلاق">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="modal-body" noValidate>
          <div className="modal-scroll">

            {/* Image */}
            <FormSection title="الصورة">
              <ImageUploader
                value={
                  imageUrl
                    ? { publicId: "", url: imageUrl, width: watch("width"), height: watch("height"),
                        sizes: { thumbnail: imageUrl, medium: imageUrl, large: imageUrl, original: imageUrl } }
                    : null
                }
                onChange={handleImageUploaded}
                folder="portfolio"
                label="رفع صورة العمل"
              />
              {errors.imageUrl && <FieldError>{errors.imageUrl.message}</FieldError>}
            </FormSection>

            {/* Additional Images */}
            <FormSection title="صور إضافية">
              <div className="extra-imgs-grid">
                {additionalImages.map((url, i) => (
                  <div key={i} className="extra-img-item">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="extra-img-thumb" />
                    <button
                      type="button"
                      className="extra-img-del"
                      onClick={() => setAdditionalImages((prev) => prev.filter((_, j) => j !== i))}
                      title="حذف"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="extra-img-add"
                  onClick={() => addImgInputRef.current?.click()}
                  disabled={uploadingExtra}
                >
                  {uploadingExtra ? (
                    <span className="extra-uploading">⏳ جاري الرفع...</span>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      <span>إضافة صورة</span>
                    </>
                  )}
                </button>
              </div>
              <input
                ref={addImgInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => uploadExtra(e.target.files)}
              />
              <p className="extra-imgs-hint">يمكنك إضافة عدة صور لعرضها في الـ Lightbox عند النقر على العمل.</p>
            </FormSection>

            {/* Code + Category */}
            <FormSection title="التصنيف والرقم">
              <div className="grid-2">
                <Field label="رقم العمل" error={errors.code?.message} required>
                  <input
                    {...register("code")}
                    placeholder="FA-001"
                    dir="ltr"
                    className="inp"
                  />
                </Field>
                <Field label="التصنيفات" error={errors.categoryIds?.message}>
                  {categories.length === 0 ? (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>لا توجد تصنيفات — أضف من إدارة التصنيفات</p>
                  ) : (
                    <div className="cat-checks">
                      {categories.map((c) => {
                        const checked = (watch("categoryIds") ?? []).includes(c.id);
                        return (
                          <label key={c.id} className={`cat-check ${checked ? "cat-check--on" : ""}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const current = watch("categoryIds") ?? [];
                                const next = checked
                                  ? current.filter((id) => id !== c.id)
                                  : [...current, c.id];
                                setValue("categoryIds", next, { shouldDirty: true });
                                // Keep categoryId as the first selected (primary)
                                setValue("categoryId", next[0] ?? null, { shouldDirty: true });
                              }}
                              className="sr-only"
                            />
                            {c.nameAr}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </Field>
              </div>
            </FormSection>

            {/* Title */}
            <FormSection title="الاسم">
              <div className="grid-2">
                <Field label="الاسم — عربي" error={errors.titleAr?.message} required>
                  <input {...register("titleAr")} placeholder="اسم العمل بالعربية" dir="rtl" className="inp" />
                </Field>
                <Field label="الاسم — English" error={errors.titleEn?.message} required>
                  <input {...register("titleEn")} placeholder="Work title in English" dir="ltr" className="inp" />
                </Field>
              </div>
            </FormSection>

            {/* Location */}
            <FormSection title="موقع التصوير">
              <div className="grid-2">
                <Field label="الموقع — عربي" error={errors.locationAr?.message}>
                  <input {...register("locationAr")} placeholder="المدينة، البلد" dir="rtl" className="inp" />
                </Field>
                <Field label="الموقع — English" error={errors.locationEn?.message}>
                  <input {...register("locationEn")} placeholder="City, Country" dir="ltr" className="inp" />
                </Field>
              </div>
            </FormSection>

            {/* Map coordinates */}
            <FormSection title="الموقع الجغرافي (خريطة)">
              <div className="grid-2">
                <Field label="خط العرض (Latitude)" error={errors.lat?.message}>
                  <input
                    {...register("lat", { setValueAs: (v: string) => v === "" ? null : Number(v) })}
                    type="number"
                    step="any"
                    placeholder="24.7136"
                    dir="ltr"
                    className="inp"
                  />
                </Field>
                <Field label="خط الطول (Longitude)" error={errors.lng?.message}>
                  <input
                    {...register("lng", { setValueAs: (v: string) => v === "" ? null : Number(v) })}
                    type="number"
                    step="any"
                    placeholder="46.6753"
                    dir="ltr"
                    className="inp"
                  />
                </Field>
              </div>
              <p className="extra-imgs-hint">اختياري — يُستخدم لعرض خريطة OpenStreetMap في صفحة العمل. مثال: الرياض lat=24.7136, lng=46.6753</p>
              <Field label="رابط Google Maps مباشر" error={errors.mapsUrl?.message}>
                <input
                  {...register("mapsUrl")}
                  type="url"
                  placeholder="https://maps.google.com/..."
                  dir="ltr"
                  className="inp"
                />
              </Field>
              <p className="extra-imgs-hint">اختياري — رابط Google Maps يُستخدم كبديل عن الإحداثيات لفتح الموقع مباشرةً</p>
            </FormSection>

            {/* Date */}
            <FormSection title="تاريخ التصوير">
              <Field label="التاريخ" error={errors.dateTaken?.message}>
                <input {...register("dateTaken")} type="date" className="inp inp--date" dir="ltr" />
              </Field>
            </FormSection>

            {/* Description */}
            <FormSection title="الوصف">
              <div className="grid-2">
                <Field label="الوصف — عربي" error={errors.descriptionAr?.message}>
                  <textarea {...register("descriptionAr")} rows={4} placeholder="وصف العمل..." dir="rtl" className="inp inp--area" />
                </Field>
                <Field label="الوصف — English" error={errors.descriptionEn?.message}>
                  <textarea {...register("descriptionEn")} rows={4} placeholder="Work description..." dir="ltr" className="inp inp--area" />
                </Field>
              </div>
            </FormSection>

            {/* Keywords */}
            <FormSection title="كلمات مفتاحية (SEO)">
              <Field
                label="الكلمات المفتاحية"
                hint="مخفية عن الزوار — تُحسّن ظهور الصورة في محركات البحث. افصل بين الكلمات بفاصلة."
                error={errors.keywords?.message}
              >
                <input
                  {...register("keywords")}
                  placeholder="صحراء، رمال، طبيعة، سعودية، desert, sand, nature"
                  className="inp"
                  dir="auto"
                />
              </Field>
            </FormSection>

            {/* Options */}
            <FormSection title="الخيارات">
              <div className="checks-row">
                <label className="check-label">
                  <input type="checkbox" {...register("isPublished")} className="check-input" />
                  <span className="check-text">
                    <span className="check-title">منشور</span>
                    <span className="check-hint">يظهر في المعرض العام</span>
                  </span>
                </label>
                <label className="check-label">
                  <input type="checkbox" {...register("isFeatured")} className="check-input" />
                  <span className="check-text">
                    <span className="check-title">مميز</span>
                    <span className="check-hint">يظهر في الصفحة الرئيسية</span>
                  </span>
                </label>
              </div>
            </FormSection>

            {/* Scheduling */}
            <FormSection title="جدولة النشر">
              <Field
                label="نشر تلقائي في"
                hint="اتركه فارغاً لنشر فوري. إذا حُدِّد وقت، سيُنشر العمل تلقائياً في ذلك الوقت ويُوقف خيار 'منشور' مؤقتاً."
              >
                <input
                  type="datetime-local"
                  {...register("scheduledAt")}
                  className="inp"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </Field>
            </FormSection>

          </div>

          {/* Footer */}
          <div className="modal-footer">
            {error && <span className="modal-error">{error}</span>}
            <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
              إلغاء
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة العمل"}
            </button>
          </div>
        </form>
      </div>

      <ModalStyles />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="form-section">
      <h3 className="form-section-title">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label, error, required, hint, children,
}: { label: string; error?: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label className="field-label">{label}{required && <span className="required">*</span>}</label>
      {hint && <p className="field-hint">{hint}</p>}
      {children}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <span className="field-error">{children}</span>;
}

// ─── Styles ───────────────────────────────────────────────

function ModalStyles() {
  return (
    <style>{`
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: var(--overlay);
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        backdrop-filter: blur(2px);
      }

      .modal {
        background: var(--bg-primary);
        border-radius: var(--radius-lg);
        width: 100%;
        max-width: 780px;
        max-height: 90dvh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--border);
        flex-shrink: 0;
      }

      .modal-title {
        font-size: 1.0625rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      .modal-close {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        color: var(--text-muted);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: background var(--transition-fast);
      }

      .modal-close:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
      }

      .modal-body {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
      }

      .modal-scroll {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .modal-footer {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        border-top: 1px solid var(--border);
        flex-shrink: 0;
        justify-content: flex-end;
      }

      .modal-error {
        flex: 1;
        font-size: 0.875rem;
        color: #e53e3e;
      }

      .form-section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .form-section-title {
        font-size: 0.8125rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-muted);
      }

      .grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      @media (max-width: 560px) {
        .grid-2 { grid-template-columns: 1fr; }
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
      }

      .field-label {
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--text-secondary);
      }

      .required {
        color: #e53e3e;
        margin-right: 2px;
      }

      .field-hint {
        font-size: 0.75rem;
        color: var(--text-subtle);
        margin-bottom: 0.35rem;
        line-height: 1.5;
      }

      .field-error {
        font-size: 0.8125rem;
        color: #e53e3e;
      }

      .inp {
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: 0.9rem;
        outline: none;
        font-family: inherit;
        transition: border-color var(--transition-fast);
      }

      .inp:focus { border-color: var(--text-primary); }
      .inp::placeholder { color: var(--text-subtle); }

      .inp--area {
        resize: vertical;
        min-height: 90px;
      }

      .inp--date {
        color-scheme: light dark;
      }

      /* Multi-category checkboxes */
      .cat-checks {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }

      .cat-check {
        display: inline-flex;
        align-items: center;
        padding: 0.25rem 0.75rem;
        font-size: 0.8125rem;
        border: 1px solid var(--border);
        border-radius: 999px;
        cursor: pointer;
        color: var(--text-muted);
        transition: all var(--transition-fast);
      }

      .cat-check:hover { border-color: var(--text-muted); color: var(--text-primary); }

      .cat-check--on {
        background: var(--text-primary);
        color: var(--bg-primary);
        border-color: var(--text-primary);
      }

      .sr-only {
        position: absolute; width: 1px; height: 1px;
        padding: 0; margin: -1px; overflow: hidden;
        clip: rect(0,0,0,0); white-space: nowrap; border: 0;
      }

      .checks-row {
        display: flex;
        gap: 1.5rem;
        flex-wrap: wrap;
      }

      .check-label {
        display: flex;
        align-items: flex-start;
        gap: 0.625rem;
        cursor: pointer;
      }

      .check-input {
        margin-top: 3px;
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: var(--text-primary);
        flex-shrink: 0;
      }

      .check-text {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }

      .check-title {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      .check-hint {
        font-size: 0.75rem;
        color: var(--text-muted);
      }

      .btn-primary {
        padding: 0.5625rem 1.25rem;
        background: var(--text-primary);
        color: var(--bg-primary);
        border: none;
        border-radius: var(--radius-md);
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: opacity var(--transition-fast);
      }

      .btn-primary:hover:not(:disabled) { opacity: 0.85; }
      .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

      .btn-ghost {
        padding: 0.5625rem 1rem;
        background: transparent;
        color: var(--text-secondary);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        font-size: 0.9rem;
        cursor: pointer;
        transition: background var(--transition-fast);
      }

      .btn-ghost:hover:not(:disabled) {
        background: var(--bg-secondary);
        color: var(--text-primary);
      }

      .btn-ghost:disabled { opacity: 0.6; cursor: not-allowed; }

      /* ── Extra images ── */
      .extra-imgs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
        gap: 0.625rem;
      }

      .extra-img-item {
        position: relative;
        aspect-ratio: 1;
        border-radius: var(--radius-md);
        overflow: hidden;
        background: var(--bg-tertiary);
        border: 1px solid var(--border);
      }

      .extra-img-thumb {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .extra-img-del {
        position: absolute;
        top: 3px;
        right: 3px;
        width: 20px;
        height: 20px;
        border: none;
        border-radius: 50%;
        background: rgba(0,0,0,0.65);
        color: #fff;
        font-size: 1rem;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        opacity: 0;
        transition: opacity var(--transition-fast);
      }

      .extra-img-item:hover .extra-img-del { opacity: 1; }

      .extra-img-add {
        aspect-ratio: 1;
        border: 1.5px dashed var(--border);
        border-radius: var(--radius-md);
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.3rem;
        font-size: 0.75rem;
        font-family: inherit;
        transition: border-color var(--transition-fast), color var(--transition-fast);
      }

      .extra-img-add:hover:not(:disabled) {
        border-color: var(--text-muted);
        color: var(--text-secondary);
      }

      .extra-img-add:disabled { opacity: 0.6; cursor: not-allowed; }

      .extra-uploading {
        font-size: 0.75rem;
      }

      .extra-imgs-hint {
        font-size: 0.75rem;
        color: var(--text-subtle);
        margin-top: 0.25rem;
      }
    `}</style>
  );
}
