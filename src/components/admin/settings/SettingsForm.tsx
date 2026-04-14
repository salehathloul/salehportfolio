"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import LogoUploader from "@/components/admin/LogoUploader";
import FontLibraryField from "@/components/admin/FontLibraryField";
import ImageUploader, { type UploadedImage } from "@/components/admin/ImageUploader";

// ─── Schema ───────────────────────────────────────────────

const schema = z.object({
  // Logo — language-specific only (4 slots)
  logoLightAr: z.string().optional().nullable(),
  logoDarkAr: z.string().optional().nullable(),
  logoLightEn: z.string().optional().nullable(),
  logoDarkEn: z.string().optional().nullable(),
  // Fonts (legacy 2-slot)
  fontHeadingUrl: z.string().optional().nullable(),
  fontHeadingName: z.string().optional().nullable(),
  fontBodyUrl: z.string().optional().nullable(),
  fontBodyName: z.string().optional().nullable(),
  // Fonts (4-slot: AR/EN × heading/body)
  fontHeadingArUrl: z.string().optional().nullable(),
  fontHeadingArName: z.string().optional().nullable(),
  fontBodyArUrl: z.string().optional().nullable(),
  fontBodyArName: z.string().optional().nullable(),
  fontHeadingEnUrl: z.string().optional().nullable(),
  fontHeadingEnName: z.string().optional().nullable(),
  fontBodyEnUrl: z.string().optional().nullable(),
  fontBodyEnName: z.string().optional().nullable(),
  // Social
  socialInstagram: z.string().optional().nullable(),
  socialX: z.string().optional().nullable(),
  socialBehance: z.string().optional().nullable(),
  socialLinkedin: z.string().optional().nullable(),
  socialEmail: z.email().optional().nullable().or(z.literal("").transform(() => null)),
  // Hero
  heroImageUrl: z.string().optional().nullable(),
  heroQuoteAr: z.string().max(500).optional().nullable(),
  heroQuoteEn: z.string().max(500).optional().nullable(),
  heroQuoteSize: z.enum(["xs", "sm", "md", "lg", "xl"]).optional(),
  heroQuoteLineHeight: z.string().optional().nullable(),
  heroQuoteWeight: z.enum(["normal", "medium", "semibold", "bold"]).optional(),
  // Instagram section
  showInstagram: z.boolean().optional(),
  instagramUsername: z.string().max(60).optional().nullable(),
  // SEO
  titleAr: z.string().max(100).optional().nullable(),
  titleEn: z.string().max(100).optional().nullable(),
  descriptionAr: z.string().max(300).optional().nullable(),
  descriptionEn: z.string().max(300).optional().nullable(),
  seoImageUrl: z.string().optional().nullable(),
  // Nav labels
  navPortfolioAr: z.string().max(40).optional().nullable(),
  navPortfolioEn: z.string().max(40).optional().nullable(),
  navBlogAr: z.string().max(40).optional().nullable(),
  navBlogEn: z.string().max(40).optional().nullable(),
  navAcquireAr: z.string().max(40).optional().nullable(),
  navAcquireEn: z.string().max(40).optional().nullable(),
  navAboutAr: z.string().max(40).optional().nullable(),
  navAboutEn: z.string().max(40).optional().nullable(),
  navContactAr: z.string().max(40).optional().nullable(),
  navContactEn: z.string().max(40).optional().nullable(),
  // Layout mode
  layoutMode: z.enum(["wide", "centered"]).optional(),
  // Nav visibility
  navPortfolioVisible: z.boolean().optional(),
  navBlogVisible: z.boolean().optional(),
  navAcquireVisible: z.boolean().optional(),
  navAboutVisible: z.boolean().optional(),
  navContactVisible: z.boolean().optional(),
  // Blog signature
  blogSignatureAr: z.string().max(600).optional().nullable(),
  blogSignatureEn: z.string().max(600).optional().nullable(),
  blogSignaturePos: z.enum(["top", "bottom"]).optional(),
  blogSignatureOn: z.boolean().optional(),
  // Analytics & Marketing
  analyticsGa4Id: z.string().max(30).optional().nullable(),
  analyticsGtmId: z.string().max(20).optional().nullable(),
  analyticsMetaPixelId: z.string().max(25).optional().nullable(),
  analyticsTiktokPixelId: z.string().max(25).optional().nullable(),
  analyticsSnapPixelId: z.string().max(25).optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

// ─── Types ────────────────────────────────────────────────

interface InitialSettings {
  logoLightAr?: string | null;
  logoDarkAr?: string | null;
  logoLightEn?: string | null;
  logoDarkEn?: string | null;
  fontHeadingUrl?: string | null;
  fontHeadingName?: string | null;
  fontBodyUrl?: string | null;
  fontBodyName?: string | null;
  socialInstagram?: string | null;
  socialX?: string | null;
  socialBehance?: string | null;
  socialLinkedin?: string | null;
  socialEmail?: string | null;
  heroImageUrl?: string | null;
  heroQuoteAr?: string | null;
  heroQuoteEn?: string | null;
  heroQuoteSize?: string | null;
  heroQuoteLineHeight?: string | null;
  heroQuoteWeight?: string | null;
  showInstagram?: boolean | null;
  instagramUsername?: string | null;
  fontHeadingArUrl?: string | null;
  fontHeadingArName?: string | null;
  fontBodyArUrl?: string | null;
  fontBodyArName?: string | null;
  fontHeadingEnUrl?: string | null;
  fontHeadingEnName?: string | null;
  fontBodyEnUrl?: string | null;
  fontBodyEnName?: string | null;
  titleAr?: string | null;
  titleEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  navPortfolioAr?: string | null;
  navPortfolioEn?: string | null;
  navBlogAr?: string | null;
  navBlogEn?: string | null;
  navAcquireAr?: string | null;
  navAcquireEn?: string | null;
  navAboutAr?: string | null;
  navAboutEn?: string | null;
  navContactAr?: string | null;
  navContactEn?: string | null;
  navPortfolioVisible?: boolean | null;
  navBlogVisible?: boolean | null;
  navAcquireVisible?: boolean | null;
  navAboutVisible?: boolean | null;
  navContactVisible?: boolean | null;
  layoutMode?: string | null;
  blogSignatureAr?: string | null;
  blogSignatureEn?: string | null;
  blogSignaturePos?: string | null;
  blogSignatureOn?: boolean | null;
  analyticsGa4Id?: string | null;
  analyticsGtmId?: string | null;
  analyticsMetaPixelId?: string | null;
  analyticsTiktokPixelId?: string | null;
  analyticsSnapPixelId?: string | null;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

// ─── Component ────────────────────────────────────────────

export default function SettingsForm({ initial }: { initial: InitialSettings }) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Hero image crop state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({ unit: "%", x: 0, y: 0, width: 100, height: 56.25 });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const cropImgRef = useRef<HTMLImageElement>(null);
  const [cropUploading, setCropUploading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        logoLightAr: initial.logoLightAr ?? null,
        logoDarkAr: initial.logoDarkAr ?? null,
        logoLightEn: initial.logoLightEn ?? null,
        logoDarkEn: initial.logoDarkEn ?? null,
        fontHeadingUrl: initial.fontHeadingUrl ?? null,
        fontHeadingName: initial.fontHeadingName ?? null,
        fontBodyUrl: initial.fontBodyUrl ?? null,
        fontBodyName: initial.fontBodyName ?? null,
        socialInstagram: initial.socialInstagram ?? "",
        socialX: initial.socialX ?? "",
        socialBehance: initial.socialBehance ?? "",
        socialLinkedin: initial.socialLinkedin ?? "",
        socialEmail: initial.socialEmail ?? "",
        heroImageUrl: initial.heroImageUrl ?? null,
        heroQuoteAr: initial.heroQuoteAr ?? "",
        heroQuoteEn: initial.heroQuoteEn ?? "",
        heroQuoteSize: (initial.heroQuoteSize as "xs" | "sm" | "md" | "lg" | "xl") ?? "md",
        heroQuoteLineHeight: initial.heroQuoteLineHeight ?? "1.5",
        heroQuoteWeight: (initial.heroQuoteWeight as "normal" | "medium" | "semibold" | "bold") ?? "normal",
        showInstagram: initial.showInstagram ?? false,
        instagramUsername: initial.instagramUsername ?? "",
        fontHeadingArUrl: initial.fontHeadingArUrl ?? null,
        fontHeadingArName: initial.fontHeadingArName ?? "",
        fontBodyArUrl: initial.fontBodyArUrl ?? null,
        fontBodyArName: initial.fontBodyArName ?? "",
        fontHeadingEnUrl: initial.fontHeadingEnUrl ?? null,
        fontHeadingEnName: initial.fontHeadingEnName ?? "",
        fontBodyEnUrl: initial.fontBodyEnUrl ?? null,
        fontBodyEnName: initial.fontBodyEnName ?? "",
        titleAr: initial.titleAr ?? "",
        titleEn: initial.titleEn ?? "",
        descriptionAr: initial.descriptionAr ?? "",
        descriptionEn: initial.descriptionEn ?? "",
        seoImageUrl: null,
        navPortfolioAr: initial.navPortfolioAr ?? "",
        navPortfolioEn: initial.navPortfolioEn ?? "",
        navBlogAr: initial.navBlogAr ?? "",
        navBlogEn: initial.navBlogEn ?? "",
        navAcquireAr: initial.navAcquireAr ?? "",
        navAcquireEn: initial.navAcquireEn ?? "",
        navAboutAr: initial.navAboutAr ?? "",
        navAboutEn: initial.navAboutEn ?? "",
        navContactAr: initial.navContactAr ?? "",
        navContactEn: initial.navContactEn ?? "",
        navPortfolioVisible: initial.navPortfolioVisible ?? true,
        navBlogVisible: initial.navBlogVisible ?? true,
        navAcquireVisible: initial.navAcquireVisible ?? true,
        navAboutVisible: initial.navAboutVisible ?? true,
        navContactVisible: initial.navContactVisible ?? true,
        layoutMode: (initial.layoutMode as "wide" | "centered") ?? "wide",
        blogSignatureAr: initial.blogSignatureAr ?? "",
        blogSignatureEn: initial.blogSignatureEn ?? "",
        blogSignaturePos: (initial.blogSignaturePos as "top" | "bottom") ?? "bottom",
        blogSignatureOn: initial.blogSignatureOn ?? true,
        analyticsGa4Id: initial.analyticsGa4Id ?? "",
        analyticsGtmId: initial.analyticsGtmId ?? "",
        analyticsMetaPixelId: initial.analyticsMetaPixelId ?? "",
        analyticsTiktokPixelId: initial.analyticsTiktokPixelId ?? "",
        analyticsSnapPixelId: initial.analyticsSnapPixelId ?? "",
      },
    });

  // Watched image fields
  const logoLightAr = watch("logoLightAr");
  const logoDarkAr = watch("logoDarkAr");
  const logoLightEn = watch("logoLightEn");
  const logoDarkEn = watch("logoDarkEn");
  const heroImageUrl = watch("heroImageUrl");
  const fontHeadingArUrl = watch("fontHeadingArUrl");
  const fontHeadingArName = watch("fontHeadingArName");
  const fontBodyArUrl = watch("fontBodyArUrl");
  const fontBodyArName = watch("fontBodyArName");
  const fontHeadingEnUrl = watch("fontHeadingEnUrl");
  const fontHeadingEnName = watch("fontHeadingEnName");
  const fontBodyEnUrl = watch("fontBodyEnUrl");
  const fontBodyEnName = watch("fontBodyEnName");

  // ── Submit ───────────────────────────────────────────────

  async function onSubmit(values: FormValues) {
    setSaveStatus("saving");
    setSaveError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      setSaveError(null);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch(err) {
      const msg = err instanceof Error
        ? err.message
        : (typeof err === "string" ? err : JSON.stringify(err) ?? "خطأ في الحفظ");
      setSaveError(msg);
      setSaveStatus("error");
      setTimeout(() => { setSaveStatus("idle"); setSaveError(null); }, 5000);
    }
  }

  // ── Helpers ──────────────────────────────────────────────

  function heroImageChange(img: UploadedImage | null) {
    setValue("heroImageUrl", img?.url ?? null, { shouldDirty: true });
  }

  const applyHeroCrop = useCallback(async () => {
    if (!cropImgRef.current || !completedCrop) return;
    setCropUploading(true);
    const canvas = document.createElement("canvas");
    const scaleX = cropImgRef.current.naturalWidth / cropImgRef.current.width;
    const scaleY = cropImgRef.current.naturalHeight / cropImgRef.current.height;
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
      cropImgRef.current,
      completedCrop.x * scaleX, completedCrop.y * scaleY,
      completedCrop.width * scaleX, completedCrop.height * scaleY,
      0, 0, canvas.width, canvas.height
    );
    canvas.toBlob(async (blob) => {
      if (!blob) { setCropUploading(false); return; }
      const fd = new FormData();
      fd.append("file", blob, "hero-crop.jpg");
      fd.append("folder", "hero");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setValue("heroImageUrl", data.url, { shouldDirty: true });
      }
      setCropUploading(false);
      setCropSrc(null);
    }, "image/jpeg", 0.92);
  }, [completedCrop, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="settings-form" noValidate>

      {/* ── Sticky header ── */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">الإعدادات العامة</h1>
          <p className="settings-subtitle">تحكم في مظهر الموقع ومعلوماته</p>
        </div>
        <div>
          <SaveButton status={saveStatus} />
          <SaveErrorMsg error={saveError} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          ٠. تخطيط الموقع
      ═══════════════════════════════════════════════ */}
      <Section title="تخطيط الموقع" description="اختر كيف يُعرض المحتوى — الخلفيات وصور الغلاف تبقى ممتدة في كلا الحالتين">
        <div className="layout-mode-cards">
          {(["wide", "centered"] as const).map((mode) => {
            const active = watch("layoutMode") === mode;
            return (
              <button
                key={mode}
                type="button"
                className={`layout-card ${active ? "layout-card--active" : ""}`}
                onClick={() => setValue("layoutMode", mode, { shouldDirty: true })}
              >
                {/* Mini preview diagram */}
                <div className="layout-preview">
                  {mode === "wide" ? (
                    /* Wide: content fills full width */
                    <svg viewBox="0 0 120 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="layout-svg">
                      {/* Background */}
                      <rect width="120" height="72" rx="4" fill="var(--bg-tertiary)"/>
                      {/* Header bar full width */}
                      <rect x="0" y="0" width="120" height="10" rx="0" fill="var(--border)"/>
                      {/* Content rows full width */}
                      <rect x="8" y="17" width="104" height="6" rx="2" fill="var(--border)"/>
                      <rect x="8" y="27" width="80" height="4" rx="2" fill="var(--border)" opacity="0.6"/>
                      {/* Image grid full width */}
                      <rect x="8" y="37" width="32" height="22" rx="2" fill="var(--border)" opacity="0.7"/>
                      <rect x="44" y="37" width="32" height="22" rx="2" fill="var(--border)" opacity="0.7"/>
                      <rect x="80" y="37" width="32" height="22" rx="2" fill="var(--border)" opacity="0.7"/>
                    </svg>
                  ) : (
                    /* Centered: content has side margins */
                    <svg viewBox="0 0 120 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="layout-svg">
                      {/* Background */}
                      <rect width="120" height="72" rx="4" fill="var(--bg-tertiary)"/>
                      {/* Header full width */}
                      <rect x="0" y="0" width="120" height="10" rx="0" fill="var(--border)"/>
                      {/* Side margin indicators */}
                      <rect x="0" y="10" width="14" height="62" fill="var(--bg-secondary)" opacity="0.8"/>
                      <rect x="106" y="10" width="14" height="62" fill="var(--bg-secondary)" opacity="0.8"/>
                      {/* Content rows centered */}
                      <rect x="17" y="17" width="86" height="6" rx="2" fill="var(--border)"/>
                      <rect x="17" y="27" width="62" height="4" rx="2" fill="var(--border)" opacity="0.6"/>
                      {/* Image grid centered */}
                      <rect x="17" y="37" width="25" height="22" rx="2" fill="var(--border)" opacity="0.7"/>
                      <rect x="47" y="37" width="25" height="22" rx="2" fill="var(--border)" opacity="0.7"/>
                      <rect x="78" y="37" width="25" height="22" rx="2" fill="var(--border)" opacity="0.7"/>
                    </svg>
                  )}
                </div>

                <div className="layout-card-info">
                  <span className="layout-card-name">
                    {mode === "wide" ? "ممتد" : "محصور بالوسط"}
                  </span>
                  <span className="layout-card-desc">
                    {mode === "wide"
                      ? "المحتوى يمتد لكامل عرض الشاشة — الوضع الحالي"
                      : "المحتوى محصور في 1280px مع هوامش جانبية على الشاشات الكبيرة"}
                  </span>
                </div>

                {active && (
                  <span className="layout-card-check">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════
          ١. الشعار
      ═══════════════════════════════════════════════ */}
      <Section title="الشعار" description="شعارات مخصصة لكل لغة — استخدم PNG للشفافية">
        {/* Arabic-specific logos */}
        <p className="font-group-label" style={{ marginBottom: "0.75rem" }}>شعار النسخة العربية</p>
        <div className="logo-row">
          <div className="logo-col">
            <p className="field-label">عربي فاتح</p>
            <p className="field-hint">للخلفيات الداكنة</p>
            <LogoUploader
              value={logoLightAr}
              onChange={(url) => setValue("logoLightAr", url, { shouldDirty: true })}
              label="رفع"
              theme="light"
            />
          </div>
          <div className="logo-col">
            <p className="field-label">عربي داكن</p>
            <p className="field-hint">للخلفيات الفاتحة</p>
            <LogoUploader
              value={logoDarkAr}
              onChange={(url) => setValue("logoDarkAr", url, { shouldDirty: true })}
              label="رفع"
              theme="dark"
            />
          </div>
        </div>

        <div className="divider" style={{ margin: "1.25rem 0" }} />

        {/* English-specific logos */}
        <p className="font-group-label" style={{ marginBottom: "0.75rem" }}>شعار النسخة الإنجليزية</p>
        <div className="logo-row">
          <div className="logo-col">
            <p className="field-label">إنجليزي فاتح</p>
            <p className="field-hint">للخلفيات الداكنة</p>
            <LogoUploader
              value={logoLightEn}
              onChange={(url) => setValue("logoLightEn", url, { shouldDirty: true })}
              label="رفع"
              theme="light"
            />
          </div>
          <div className="logo-col">
            <p className="field-label">إنجليزي داكن</p>
            <p className="field-hint">للخلفيات الفاتحة</p>
            <LogoUploader
              value={logoDarkEn}
              onChange={(url) => setValue("logoDarkEn", url, { shouldDirty: true })}
              label="رفع"
              theme="dark"
            />
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════
          ٢. الخطوط
      ═══════════════════════════════════════════════ */}
      <Section title="الخطوط" description="اختر من مكتبة الخطوط أو ارفع خطاً جديداً — كل خط مرفوع يُحفظ في المكتبة">
        <div className="fields-stack">
          <p className="font-group-label">العربية</p>
          <div className="fields-grid-2">
            <FontLibraryField
              label="خط العناوين العربية"
              fontName={fontHeadingArName}
              fontUrl={fontHeadingArUrl}
              onSelect={(name, url) => {
                setValue("fontHeadingArName", name, { shouldDirty: true });
                setValue("fontHeadingArUrl", url, { shouldDirty: true });
              }}
              onClear={() => {
                setValue("fontHeadingArName", "", { shouldDirty: true });
                setValue("fontHeadingArUrl", null, { shouldDirty: true });
              }}
            />
            <FontLibraryField
              label="خط نصوص العربية"
              fontName={fontBodyArName}
              fontUrl={fontBodyArUrl}
              onSelect={(name, url) => {
                setValue("fontBodyArName", name, { shouldDirty: true });
                setValue("fontBodyArUrl", url, { shouldDirty: true });
              }}
              onClear={() => {
                setValue("fontBodyArName", "", { shouldDirty: true });
                setValue("fontBodyArUrl", null, { shouldDirty: true });
              }}
            />
          </div>
          <Divider />
          <p className="font-group-label">English</p>
          <div className="fields-grid-2">
            <FontLibraryField
              label="English Headings Font"
              fontName={fontHeadingEnName}
              fontUrl={fontHeadingEnUrl}
              onSelect={(name, url) => {
                setValue("fontHeadingEnName", name, { shouldDirty: true });
                setValue("fontHeadingEnUrl", url, { shouldDirty: true });
              }}
              onClear={() => {
                setValue("fontHeadingEnName", "", { shouldDirty: true });
                setValue("fontHeadingEnUrl", null, { shouldDirty: true });
              }}
            />
            <FontLibraryField
              label="English Body Font"
              fontName={fontBodyEnName}
              fontUrl={fontBodyEnUrl}
              onSelect={(name, url) => {
                setValue("fontBodyEnName", name, { shouldDirty: true });
                setValue("fontBodyEnUrl", url, { shouldDirty: true });
              }}
              onClear={() => {
                setValue("fontBodyEnName", "", { shouldDirty: true });
                setValue("fontBodyEnUrl", null, { shouldDirty: true });
              }}
            />
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════
          ٣. وسائل التواصل
      ═══════════════════════════════════════════════ */}
      <Section title="وسائل التواصل" description="تظهر في الهيدر والفوتر">
        <div className="fields-grid-2">
          <Field label="Instagram" error={errors.socialInstagram?.message}>
            <input
              {...register("socialInstagram")}
              placeholder="https://instagram.com/username"
              dir="ltr"
              className="text-input"
            />
          </Field>
          <Field label="X (Twitter)" error={errors.socialX?.message}>
            <input
              {...register("socialX")}
              placeholder="https://x.com/username"
              dir="ltr"
              className="text-input"
            />
          </Field>
          <Field label="Behance" error={errors.socialBehance?.message}>
            <input
              {...register("socialBehance")}
              placeholder="https://behance.net/username"
              dir="ltr"
              className="text-input"
            />
          </Field>
          <Field label="LinkedIn" error={errors.socialLinkedin?.message}>
            <input
              {...register("socialLinkedin")}
              placeholder="https://linkedin.com/in/username"
              dir="ltr"
              className="text-input"
            />
          </Field>
          <Field label="البريد الإلكتروني" error={errors.socialEmail?.message}>
            <input
              {...register("socialEmail")}
              type="email"
              placeholder="contact@example.com"
              dir="ltr"
              className="text-input"
            />
          </Field>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════
          ٤. الصفحة الرئيسية
      ═══════════════════════════════════════════════ */}
      <Section title="الصفحة الرئيسية" description="صورة الغلاف والعبارة الرئيسية">
        <div className="fields-stack">
          <Field label="صورة الغلاف (Hero)">
            <p className="field-hint" style={{ marginBottom: "0.5rem" }}>
              المقاس المثالي: <strong>1920 × 1080 بكسل</strong> — نسبة 16:9 أو أعرض
            </p>
            <ImageUploader
              value={
                heroImageUrl
                  ? {
                      publicId: "",
                      url: heroImageUrl,
                      width: 0,
                      height: 0,
                      sizes: {
                        thumbnail: heroImageUrl,
                        medium: heroImageUrl,
                        large: heroImageUrl,
                        original: heroImageUrl,
                      },
                    }
                  : null
              }
              onChange={heroImageChange}
              folder="hero"
              label="رفع صورة الغلاف"
              aspectHint="1920 × 1080 px"
            />
            {heroImageUrl && (
              <button
                type="button"
                className="crop-trigger-btn"
                onClick={() => { setCropSrc(heroImageUrl); setCrop({ unit: "%", x: 0, y: 0, width: 100, height: 56.25 }); setCompletedCrop(null); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginInlineEnd: "0.35rem" }}>
                  <path d="M6 2v14a2 2 0 002 2h14" /><path d="M18 22V8a2 2 0 00-2-2H2" />
                </svg>
                اقتصاص الصورة
              </button>
            )}
          </Field>

          <div className="fields-grid-2">
            <Field label="العبارة — عربي" error={errors.heroQuoteAr?.message}>
              <textarea
                {...register("heroQuoteAr")}
                rows={4}
                placeholder={"عبارة تعبّر عن رؤيتك...\nيمكنك كتابة سطرين أو أكثر"}
                className="text-input text-area"
                dir="rtl"
              />
              <span className="field-hint" style={{ marginTop: "0.2rem" }}>
                يمكنك الضغط على Enter لإضافة سطر جديد
              </span>
              <CharCount value={watch("heroQuoteAr") ?? ""} max={500} />
            </Field>
            <Field label="العبارة — English" error={errors.heroQuoteEn?.message}>
              <textarea
                {...register("heroQuoteEn")}
                rows={4}
                placeholder={"A phrase that expresses your vision...\nYou can write multiple lines"}
                className="text-input text-area"
                dir="ltr"
              />
              <span className="field-hint" style={{ marginTop: "0.2rem" }}>
                Press Enter to add a new line
              </span>
              <CharCount value={watch("heroQuoteEn") ?? ""} max={500} />
            </Field>
          </div>

          {/* Live hero preview — image + quote overlay */}
          {(watch("heroQuoteAr") || watch("heroQuoteEn") || heroImageUrl) && (
            <div className="hero-preview-wrap">
              <p className="quote-preview-label">معاينة الغلاف</p>
              <div className="hero-preview">
                {heroImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={heroImageUrl} alt="" className="hero-preview-img" />
                ) : (
                  <div className="hero-preview-placeholder" />
                )}
                <div className="hero-preview-overlay" />
                {(watch("heroQuoteAr") || watch("heroQuoteEn")) && (
                  <div
                    className="hero-preview-quote"
                    style={{
                      fontSize: { xs: "0.6rem", sm: "0.72rem", md: "0.88rem", lg: "1.05rem", xl: "1.3rem" }[watch("heroQuoteSize") ?? "md"],
                      lineHeight: watch("heroQuoteLineHeight") ?? "1.5",
                      fontWeight: { normal: 300, medium: 500, semibold: 600, bold: 700 }[watch("heroQuoteWeight") ?? "normal"],
                      fontFamily: "var(--font-heading)",
                    }}
                    dir="rtl"
                  >
                    {watch("heroQuoteAr") || watch("heroQuoteEn")}
                  </div>
                )}
              </div>
              {!heroImageUrl && (
                <p className="field-hint" style={{ marginTop: "0.25rem" }}>
                  ارفع صورة الغلاف أعلاه لترى المعاينة الكاملة
                </p>
              )}
            </div>
          )}

          {/* Quote line-height slider */}
          <Field label="تباعد أسطر العبارة">
            <div className="lh-row">
              <span className="lh-preview" style={{ lineHeight: watch("heroQuoteLineHeight") ?? "1.5" }}>
                أ
              </span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                className="lh-slider"
                value={watch("heroQuoteLineHeight") ?? "1.5"}
                onChange={(e) => setValue("heroQuoteLineHeight", e.target.value, { shouldDirty: true })}
              />
              <span className="lh-value">{parseFloat(watch("heroQuoteLineHeight") ?? "1.5").toFixed(1)}</span>
            </div>
          </Field>

          {/* Quote size selector */}
          <Field label="حجم خط العبارة" error={errors.heroQuoteSize?.message}>
            <div className="quote-size-row">
              {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => {
                const labels: Record<string, string> = { xs: "صغير جداً", sm: "صغير", md: "متوسط", lg: "كبير", xl: "كبير جداً" };
                const isActive = watch("heroQuoteSize") === s;
                return (
                  <button key={s} type="button"
                    onClick={() => setValue("heroQuoteSize", s, { shouldDirty: true })}
                    className={`size-chip ${isActive ? "size-chip--active" : ""}`}
                  >{labels[s]}</button>
                );
              })}
            </div>
          </Field>

          {/* Quote weight selector */}
          <Field label="وزن الخط (Bold)">
            <div className="quote-size-row">
              {(["normal", "medium", "semibold", "bold"] as const).map((w) => {
                const labels: Record<string, string> = { normal: "عادي", medium: "متوسط", semibold: "شبه غامق", bold: "غامق" };
                const weights: Record<string, number> = { normal: 400, medium: 500, semibold: 600, bold: 700 };
                const isActive = watch("heroQuoteWeight") === w;
                return (
                  <button key={w} type="button"
                    onClick={() => setValue("heroQuoteWeight", w, { shouldDirty: true })}
                    className={`size-chip ${isActive ? "size-chip--active" : ""}`}
                    style={{ fontWeight: weights[w] }}
                  >{labels[w]}</button>
                );
              })}
            </div>
          </Field>
        </div>
      </Section>

      {/* ── Hero crop modal ── */}
      {cropSrc && (
        <div className="modal-overlay" onClick={() => setCropSrc(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "1rem", fontWeight: 500 }}>اقتصاص صورة الغلاف</h3>
              <button onClick={() => setCropSrc(null)} className="modal-close-btn">×</button>
            </div>
            <div style={{ padding: "1rem", overflow: "auto" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                اسحب لتحديد منطقة الاقتصاص. النسبة الافتراضية 16:9 مناسبة للغلاف.
              </p>
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={16 / 9}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img ref={cropImgRef} src={cropSrc} alt="crop" style={{ maxWidth: "100%", display: "block" }} />
              </ReactCrop>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", padding: "0.75rem 1rem", borderTop: "1px solid var(--border)" }}>
              <button type="button" onClick={() => setCropSrc(null)} className="btn-outline">إلغاء</button>
              <button type="button" onClick={applyHeroCrop} disabled={cropUploading || !completedCrop} className="btn-primary">
                {cropUploading ? "جاري الرفع..." : "تطبيق الاقتصاص"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          ٥. إنستغرام
      ═══════════════════════════════════════════════ */}
      <Section title="قسم إنستغرام" description="يظهر أسفل آخر الأعمال في الصفحة الرئيسية">
        <div className="fields-stack">
          {/* Toggle */}
          <div className="toggle-row">
            <div>
              <p className="field-label">إظهار قسم إنستغرام</p>
              <p className="field-hint">فعّل لعرض قسم متابعة حسابك أسفل الصفحة الرئيسية</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                {...register("showInstagram")}
                className="toggle-input"
              />
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </label>
          </div>

          {watch("showInstagram") && (
            <Field label="اسم الحساب (username)" error={errors.instagramUsername?.message}>
              <input
                {...register("instagramUsername")}
                placeholder="@salehathloul"
                dir="ltr"
                className="text-input"
              />
              <span className="field-hint">
                يُستخدم لبناء رابط الحساب تلقائياً إذا لم تُدخل رابطاً في &quot;وسائل التواصل&quot;
              </span>
            </Field>
          )}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════
          ٦. SEO
      ═══════════════════════════════════════════════ */}
      <Section
        title="SEO"
        description="يؤثر على ظهور الموقع في محركات البحث ومعاينات المشاركة"
      >
        <div className="fields-stack">
          <div className="fields-grid-2">
            <Field label="عنوان الموقع — عربي" error={errors.titleAr?.message}>
              <input
                {...register("titleAr")}
                placeholder="صالح الهذلول — مصور فوتوغرافي"
                dir="rtl"
                className="text-input"
              />
              <CharCount value={watch("titleAr") ?? ""} max={100} />
            </Field>
            <Field label="عنوان الموقع — English" error={errors.titleEn?.message}>
              <input
                {...register("titleEn")}
                placeholder="Saleh Alhuthloul — Photographer"
                dir="ltr"
                className="text-input"
              />
              <CharCount value={watch("titleEn") ?? ""} max={100} />
            </Field>
          </div>

          <div className="fields-grid-2">
            <Field label="وصف الموقع — عربي" error={errors.descriptionAr?.message}>
              <textarea
                {...register("descriptionAr")}
                rows={3}
                placeholder="وصف مختصر..."
                dir="rtl"
                className="text-input text-area"
              />
              <CharCount value={watch("descriptionAr") ?? ""} max={300} />
            </Field>
            <Field label="وصف الموقع — English" error={errors.descriptionEn?.message}>
              <textarea
                {...register("descriptionEn")}
                rows={3}
                placeholder="A brief description..."
                dir="ltr"
                className="text-input text-area"
              />
              <CharCount value={watch("descriptionEn") ?? ""} max={300} />
            </Field>
          </div>

          <Field label="صورة المشاركة (OG Image)">
            <ImageUploader
              value={null}
              onChange={(img) =>
                setValue("seoImageUrl", img?.url ?? null, { shouldDirty: true })
              }
              folder="og"
              label="رفع صورة المشاركة"
              aspectHint="1200×630 px"
            />
          </Field>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════
          ٧. أسماء أقسام التنقل
      ═══════════════════════════════════════════════ */}
      <Section title="أقسام التنقل" description="تحكم في إظهار وأسماء صفحات القائمة — يمكنك إخفاء أي قسم">
        <div className="fields-stack">
          {([
            { arKey: "navPortfolioAr" as const, enKey: "navPortfolioEn" as const, visKey: "navPortfolioVisible" as const, defaultAr: "المعرض",  defaultEn: "Portfolio", pageHref: "/ar/portfolio" },
            { arKey: "navBlogAr"      as const, enKey: "navBlogEn"      as const, visKey: "navBlogVisible"      as const, defaultAr: "المدونة", defaultEn: "Blog",      pageHref: "/ar/blog" },
            { arKey: "navAcquireAr"   as const, enKey: "navAcquireEn"   as const, visKey: "navAcquireVisible"   as const, defaultAr: "اقتناء",  defaultEn: "Acquire",   pageHref: "/ar/acquire" },
            { arKey: "navAboutAr"     as const, enKey: "navAboutEn"     as const, visKey: "navAboutVisible"     as const, defaultAr: "عني",     defaultEn: "About",     pageHref: "/ar/about" },
            { arKey: "navContactAr"   as const, enKey: "navContactEn"   as const, visKey: "navContactVisible"   as const, defaultAr: "التواصل", defaultEn: "Contact",   pageHref: "/ar/contact" },
          ] as const).map(({ arKey, enKey, visKey, defaultAr, defaultEn, pageHref }) => {
            const isVisible = watch(visKey) !== false;
            return (
              <div key={arKey} className={`nav-section-row ${!isVisible ? "nav-section-row--hidden" : ""}`}>
                {/* Visibility toggle + preview link */}
                <div className="nav-section-top">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <label className="toggle-switch" style={{ transform: "scale(0.85)" }}>
                      <input type="checkbox" {...register(visKey)} className="toggle-input" />
                      <span className="toggle-track"><span className="toggle-thumb" /></span>
                    </label>
                    <span className="field-label" style={{ opacity: isVisible ? 1 : 0.45 }}>{defaultAr}</span>
                  </div>
                  <a href={pageHref} target="_blank" rel="noopener noreferrer" className="nav-preview-link">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    عرض
                  </a>
                </div>
                {isVisible && (
                  <div className="fields-grid-2" style={{ marginTop: "0.5rem" }}>
                    <Field label="الاسم عربي">
                      <input {...register(arKey)} placeholder={defaultAr} dir="rtl" className="text-input" />
                    </Field>
                    <Field label="Name EN">
                      <input {...register(enKey)} placeholder={defaultEn} dir="ltr" className="text-input" />
                    </Field>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════
          ٨. توقيع التدوينات
      ═══════════════════════════════════════════════ */}
      <Section title="توقيع التدوينات" description="يُضاف تلقائياً لكل تدوينة — يمكنك إطفاؤه لتدوينة معينة من محرر المدونة">
        <div className="fields-stack">
          {/* Global toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
            <label className="toggle-switch" style={{ transform: "scale(0.85)" }}>
              <input type="checkbox" {...register("blogSignatureOn")} className="toggle-input" />
              <span className="toggle-track"><span className="toggle-thumb" /></span>
            </label>
            <span className="field-label" style={{ fontSize: "0.875rem" }}>
              {watch("blogSignatureOn") ? "التوقيع مفعّل على كل التدوينات" : "التوقيع مطفأ"}
            </span>
          </div>

          {/* Position */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
            <span className="field-label" style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>مكان التوقيع:</span>
            <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer", fontSize: "0.875rem" }}>
              <input type="radio" value="top" {...register("blogSignaturePos")} />
              أعلى التدوينة
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer", fontSize: "0.875rem" }}>
              <input type="radio" value="bottom" {...register("blogSignaturePos")} />
              أسفل التدوينة
            </label>
          </div>

          {/* Signature text */}
          <div className="fields-grid-2">
            <div>
              <label className="field-label">نص التوقيع — عربي</label>
              <textarea
                {...register("blogSignatureAr")}
                rows={3}
                placeholder="مثال: صالح الهذلول — مصور فوتوغرافي"
                dir="rtl"
                className="text-input text-area"
              />
            </div>
            <div>
              <label className="field-label">نص التوقيع — English</label>
              <textarea
                {...register("blogSignatureEn")}
                rows={3}
                placeholder="e.g. Saleh Alhuthloul — Photographer"
                dir="ltr"
                className="text-input text-area"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Per-page SEO ─── */}
      <PerPageSeoSection register={register} />

      {/* ─── Analytics & Marketing ─── */}
      <Section title="التتبع والتسويق">
        <div className="fields-grid">
          <div className="field-group">
            <label className="field-label">Google Analytics 4 <span className="field-hint">G-XXXXXXXXXX</span></label>
            <input {...register("analyticsGa4Id")} placeholder="G-XXXXXXXXXX" className="text-input" dir="ltr" />
          </div>
          <div className="field-group">
            <label className="field-label">Google Tag Manager <span className="field-hint">GTM-XXXXXXX</span></label>
            <input {...register("analyticsGtmId")} placeholder="GTM-XXXXXXX" className="text-input" dir="ltr" />
          </div>
          <div className="field-group">
            <label className="field-label">Meta (Facebook) Pixel ID</label>
            <input {...register("analyticsMetaPixelId")} placeholder="1234567890123456" className="text-input" dir="ltr" />
          </div>
          <div className="field-group">
            <label className="field-label">TikTok Pixel ID</label>
            <input {...register("analyticsTiktokPixelId")} placeholder="XXXXXXXXXXXXXXXXXX" className="text-input" dir="ltr" />
          </div>
          <div className="field-group">
            <label className="field-label">Snap Pixel ID</label>
            <input {...register("analyticsSnapPixelId")} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="text-input" dir="ltr" />
          </div>
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
          أدخل المعرّفات فقط — السكريبت يُحقن تلقائياً في كل صفحات الموقع.
        </p>
      </Section>

      {/* Bottom save */}
      <div className="settings-footer">
        <div>
          <SaveButton status={saveStatus} />
          <SaveErrorMsg error={saveError} />
        </div>
      </div>

      <FormStyles />
    </form>
  );
}

// ─── Per-Page SEO Section ─────────────────────────────────

const SEO_PAGES = [
  { key: "portfolio", labelAr: "المعرض",     labelEn: "Portfolio" },
  { key: "blog",      labelAr: "المدونة",     labelEn: "Blog" },
  { key: "acquire",   labelAr: "الاقتناء",   labelEn: "Acquire" },
  { key: "about",     labelAr: "عني",         labelEn: "About" },
  { key: "contact",   labelAr: "تواصل",      labelEn: "Contact" },
  { key: "exhibitions",labelAr: "المعارض",   labelEn: "Exhibitions" },
] as const;

type SeoPageKey = (typeof SEO_PAGES)[number]["key"];

interface PageSeoData {
  titleAr?: string;
  titleEn?: string;
  descAr?: string;
  descEn?: string;
}

function PerPageSeoSection({ register: _r }: { register: ReturnType<typeof import("react-hook-form").useForm>["register"] }) {
  const [data, setData] = useState<Record<SeoPageKey, PageSeoData>>(() => {
    const defaults: Record<string, PageSeoData> = {};
    SEO_PAGES.forEach((p) => { defaults[p.key] = {}; });
    return defaults as Record<SeoPageKey, PageSeoData>;
  });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then((s) => {
      if (s?.pageSeoJson) {
        try {
          const parsed = JSON.parse(s.pageSeoJson);
          setData((prev) => ({ ...prev, ...parsed }));
        } catch { /* ignore */ }
      }
      setLoaded(true);
    });
  }, []);

  function update(pageKey: SeoPageKey, field: keyof PageSeoData, value: string) {
    setData((prev) => ({ ...prev, [pageKey]: { ...prev[pageKey], [field]: value } }));
  }

  async function saveSeo() {
    setSaving(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageSeoJson: JSON.stringify(data) }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  }

  if (!loaded) return null;

  return (
    <Section title="SEO — كل صفحة على حدة">
      <div className="pageseo-grid">
        {SEO_PAGES.map((page) => (
          <div key={page.key} className="pageseo-card">
            <div className="pageseo-card-header">
              <span className="pageseo-page-label">{page.labelAr}</span>
              <span className="pageseo-page-label-en">{page.labelEn}</span>
            </div>
            <div className="pageseo-fields">
              <input
                value={data[page.key]?.titleAr ?? ""}
                onChange={(e) => update(page.key, "titleAr", e.target.value)}
                placeholder="العنوان — عربي"
                className="text-input text-input--sm"
                dir="rtl"
              />
              <input
                value={data[page.key]?.titleEn ?? ""}
                onChange={(e) => update(page.key, "titleEn", e.target.value)}
                placeholder="Title — English"
                className="text-input text-input--sm"
                dir="ltr"
              />
              <input
                value={data[page.key]?.descAr ?? ""}
                onChange={(e) => update(page.key, "descAr", e.target.value)}
                placeholder="الوصف — عربي (160 حرف)"
                className="text-input text-input--sm"
                dir="rtl"
                maxLength={160}
              />
              <input
                value={data[page.key]?.descEn ?? ""}
                onChange={(e) => update(page.key, "descEn", e.target.value)}
                placeholder="Description — English (160 chars)"
                className="text-input text-input--sm"
                dir="ltr"
                maxLength={160}
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "1rem" }}>
        <button
          type="button"
          onClick={saveSeo}
          disabled={saving}
          className="pageseo-save-btn"
        >
          {saving ? "جاري الحفظ..." : saved ? "✓ تم الحفظ" : "حفظ SEO الصفحات"}
        </button>
      </div>
      <style>{`
        .pageseo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
        .pageseo-card { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 1rem; }
        .pageseo-card-header { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.75rem; }
        .pageseo-page-label { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
        .pageseo-page-label-en { font-size: 0.75rem; color: var(--text-muted); }
        .pageseo-fields { display: flex; flex-direction: column; gap: 0.5rem; }
        .text-input--sm { font-size: 0.8125rem !important; padding: 0.4rem 0.75rem !important; height: auto !important; }
        .pageseo-save-btn { height: 36px; padding: 0 1.25rem; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary); font-size: 0.875rem; cursor: pointer; transition: all 150ms; }
        .pageseo-save-btn:hover:not(:disabled) { border-color: var(--text-secondary); color: var(--text-primary); }
        .pageseo-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </Section>
  );
}

// ─── Sub-components ───────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="settings-section">
      <div className="section-head">
        <h2 className="section-title">{title}</h2>
        {description && <p className="section-desc">{description}</p>}
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const warn = len > max * 0.85;
  return (
    <span className={`char-count ${warn ? "char-count--warn" : ""} ${len > max ? "char-count--over" : ""}`}>
      {len}/{max}
    </span>
  );
}

function Divider() {
  return <div className="divider" />;
}

function SaveButton({ status }: { status: SaveStatus }) {
  const labels: Record<SaveStatus, string> = {
    idle: "حفظ التغييرات",
    saving: "جاري الحفظ...",
    saved: "✓ تم الحفظ",
    error: "فشل الحفظ — أعد المحاولة",
  };
  return (
    <button
      type="submit"
      disabled={status === "saving"}
      className={`save-btn ${status === "saved" ? "save-btn--saved" : ""} ${status === "error" ? "save-btn--error" : ""}`}
    >
      {labels[status]}
    </button>
  );
}

function SaveErrorMsg({ error }: { error: string | null }) {
  if (!error) return null;
  const isAuth = error.includes("Unauthorized") || error.includes("401");
  return (
    <p style={{ color: "#ef4444", fontSize: "0.8rem", marginTop: "0.25rem" }}>
      {isAuth ? "انتهت جلستك — " : ""}
      <a href="/admin/login" style={{ color: "inherit", textDecoration: "underline" }}>
        {isAuth ? "أعد تسجيل الدخول" : error}
      </a>
    </p>
  );
}

// ─── Styles ───────────────────────────────────────────────

function FormStyles() {
  return (
    <style>{`
      .settings-form {
        max-width: 900px;
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      /* Sticky header */
      .settings-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--border);
        margin-bottom: 0;
        position: sticky;
        top: 0;
        background: var(--bg-secondary);
        z-index: 10;
        padding-top: 0.5rem;
      }

      .settings-title {
        font-size: 1.375rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      .settings-subtitle {
        font-size: 0.875rem;
        color: var(--text-muted);
        margin-top: 0.2rem;
      }

      /* Sections */
      .settings-section {
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 2rem;
        padding: 2rem 0;
        border-bottom: 1px solid var(--border-subtle);
      }

      @media (max-width: 768px) {
        .settings-section {
          grid-template-columns: 1fr;
          gap: 1rem;
        }
      }

      .section-head {
        padding-top: 0.25rem;
      }

      .section-title {
        font-size: 1rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      .section-desc {
        font-size: 0.8125rem;
        color: var(--text-muted);
        margin-top: 0.375rem;
        line-height: 1.5;
      }

      .section-body {
        display: flex;
        flex-direction: column;
      }

      /* Fields */
      .fields-stack {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .fields-grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.25rem;
      }

      @media (max-width: 600px) {
        .fields-grid-2 {
          grid-template-columns: 1fr;
        }
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      .field-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
      }

      .field-hint {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-top: -0.125rem;
        margin-bottom: 0.375rem;
      }

      .field-error {
        font-size: 0.8125rem;
        color: #e53e3e;
      }

      /* Inputs */
      .text-input {
        width: 100%;
        padding: 0.5625rem 0.75rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: 0.9375rem;
        transition: border-color var(--transition-fast);
        outline: none;
        font-family: inherit;
      }

      .text-input:focus {
        border-color: var(--text-primary);
      }

      .text-input::placeholder {
        color: var(--text-subtle);
      }

      .text-area {
        resize: vertical;
        min-height: 80px;
      }

      /* Char count */
      .char-count {
        font-size: 0.75rem;
        color: var(--text-subtle);
        text-align: left;
        direction: ltr;
      }

      .char-count--warn {
        color: var(--text-muted);
      }

      .char-count--over {
        color: #e53e3e;
        font-weight: 500;
      }

      /* Logo row */
      .logo-row {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
      }

      .logo-col {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      /* Divider */
      .divider {
        height: 1px;
        background: var(--border-subtle);
      }

      /* Save button */
      .save-btn {
        padding: 0.625rem 1.5rem;
        background: var(--text-primary);
        color: var(--bg-primary);
        border: none;
        border-radius: var(--radius-md);
        font-size: 0.9375rem;
        font-weight: 500;
        cursor: pointer;
        transition: opacity var(--transition-fast), background var(--transition-fast);
        white-space: nowrap;
      }

      .save-btn:hover:not(:disabled) {
        opacity: 0.85;
      }

      .save-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .save-btn--saved {
        background: #276749;
        opacity: 1 !important;
      }

      .save-btn--error {
        background: #c53030;
        opacity: 1 !important;
      }

      /* Footer */
      .settings-footer {
        padding-top: 1.5rem;
        display: flex;
        justify-content: flex-end;
      }

      /* ── Font group label ── */
      .font-group-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-muted);
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      /* ── Line-height slider ── */
      .lh-row {
        display: flex;
        align-items: center;
        gap: 0.875rem;
      }

      .lh-preview {
        font-family: var(--font-heading);
        font-size: 1.5rem;
        color: var(--text-primary);
        width: 32px;
        text-align: center;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .lh-slider {
        flex: 1;
        height: 4px;
        accent-color: var(--text-primary);
        cursor: pointer;
      }

      .lh-value {
        font-size: 0.8125rem;
        color: var(--text-secondary);
        width: 28px;
        text-align: center;
        flex-shrink: 0;
      }

      /* ── Quote size chips ── */
      .quote-size-row {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .size-chip {
        padding: 0.375rem 0.875rem;
        border: 1px solid var(--border);
        border-radius: 999px;
        background: var(--bg-primary);
        color: var(--text-secondary);
        font-size: 0.8125rem;
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .size-chip:hover {
        border-color: var(--text-secondary);
        color: var(--text-primary);
      }

      .size-chip--active {
        background: var(--text-primary);
        color: var(--bg-primary);
        border-color: var(--text-primary);
      }

      /* ── Toggle switch ── */
      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      .toggle-switch {
        position: relative;
        display: inline-block;
        cursor: pointer;
        flex-shrink: 0;
      }

      .toggle-input {
        opacity: 0;
        width: 0;
        height: 0;
        position: absolute;
      }

      .toggle-track {
        display: flex;
        align-items: center;
        width: 44px;
        height: 24px;
        background: var(--border);
        border-radius: 999px;
        transition: background var(--transition-fast);
        padding: 2px;
      }

      .toggle-input:checked + .toggle-track {
        background: var(--text-primary);
      }

      .toggle-thumb {
        width: 20px;
        height: 20px;
        background: var(--bg-primary);
        border-radius: 50%;
        transition: transform var(--transition-fast);
        flex-shrink: 0;
      }

      .toggle-input:checked + .toggle-track .toggle-thumb {
        transform: translateX(20px);
      }

      [dir="rtl"] .toggle-input:checked + .toggle-track .toggle-thumb {
        transform: translateX(-20px);
      }

      /* ── Hero live preview ── */
      .hero-preview-wrap {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      .quote-preview-label {
        font-size: 0.7rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .hero-preview {
        position: relative;
        aspect-ratio: 16/9;
        border-radius: var(--radius-md);
        overflow: hidden;
        background: var(--bg-tertiary);
        border: 1px solid var(--border);
      }

      .hero-preview-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .hero-preview-placeholder {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      }

      .hero-preview-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.42);
      }

      .hero-preview-quote {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        padding: 6% 7%;
        padding-bottom: 16%;
        color: #ffffff;
        white-space: pre-line;
        transition: all 0.2s ease;
        text-shadow: 0 1px 8px rgba(0,0,0,0.4);
      }

      /* ── Hero crop trigger ── */
      .crop-trigger-btn {
        display: inline-flex;
        align-items: center;
        margin-top: 0.5rem;
        padding: 0.375rem 0.875rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: transparent;
        color: var(--text-secondary);
        font-size: 0.8125rem;
        cursor: pointer;
        transition: border-color var(--transition-fast), color var(--transition-fast);
      }

      .crop-trigger-btn:hover {
        border-color: var(--text-primary);
        color: var(--text-primary);
      }

      /* ── Nav section rows ── */
      .nav-section-row {
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: 0.75rem 1rem;
        transition: opacity var(--transition-fast);
      }

      .nav-section-row--hidden {
        opacity: 0.5;
      }

      .nav-section-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .nav-preview-link {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.75rem;
        color: var(--text-muted);
        text-decoration: none;
        padding: 0.2rem 0.5rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        transition: color var(--transition-fast), border-color var(--transition-fast);
      }

      .nav-preview-link:hover {
        color: var(--text-primary);
        border-color: var(--text-primary);
      }

      /* ── Crop modal ── */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
        padding: 1rem;
      }

      .modal-box {
        background: var(--bg-primary);
        border-radius: var(--radius-lg);
        width: 100%;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--border);
      }

      .modal-close-btn {
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 1.25rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .modal-close-btn:hover { background: var(--bg-secondary); }

      .btn-outline {
        padding: 0.5rem 1rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: transparent;
        color: var(--text-secondary);
        font-size: 0.875rem;
        cursor: pointer;
        transition: border-color var(--transition-fast);
      }

      .btn-outline:hover { border-color: var(--text-primary); color: var(--text-primary); }

      .btn-primary {
        padding: 0.5rem 1.25rem;
        border: none;
        border-radius: var(--radius-md);
        background: var(--text-primary);
        color: var(--bg-primary);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: opacity var(--transition-fast);
      }

      .btn-primary:hover:not(:disabled) { opacity: 0.85; }
      .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

      /* ── Layout mode cards ── */
      .layout-mode-cards {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.875rem;
      }

      @media (max-width: 540px) {
        .layout-mode-cards { grid-template-columns: 1fr; }
      }

      .layout-card {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem;
        border: 1.5px solid var(--border);
        border-radius: var(--radius-lg);
        background: transparent;
        cursor: pointer;
        text-align: right;
        transition: border-color var(--transition-fast), background var(--transition-fast);
        position: relative;
        font-family: inherit;
      }

      .layout-card:hover {
        border-color: var(--text-muted);
        background: var(--bg-secondary);
      }

      .layout-card--active {
        border-color: var(--text-primary);
        background: var(--bg-secondary);
      }

      .layout-preview {
        width: 100%;
        border-radius: var(--radius-md);
        overflow: hidden;
        border: 1px solid var(--border-subtle);
      }

      .layout-svg {
        width: 100%;
        height: auto;
        display: block;
      }

      .layout-card-info {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }

      .layout-card-name {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      .layout-card-desc {
        font-size: 0.775rem;
        color: var(--text-muted);
        line-height: 1.5;
      }

      .layout-card-check {
        position: absolute;
        top: 0.75rem;
        left: 0.75rem;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--text-primary);
        color: var(--bg-primary);
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `}</style>
  );
}
