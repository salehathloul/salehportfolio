export type Locale = "ar" | "en";

export interface LocalizedString {
  ar: string;
  en: string;
}

// ─── Work ────────────────────────────────────────────────

export type GridLayout = "grid" | "masonry" | "scattered";

export interface WorkWithCategory {
  id: string;
  code: string;
  titleAr: string;
  titleEn: string;
  locationAr: string | null;
  locationEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  imageUrl: string;
  width: number;
  height: number;
  dateTaken: Date | null;
  categoryId: string | null;
  order: number;
  isPublished: boolean;
  isFeatured: boolean;
  category: {
    id: string;
    nameAr: string;
    nameEn: string;
    slug: string;
  } | null;
}

// ─── Blog ────────────────────────────────────────────────

export type BlogStatus = "draft" | "published" | "hidden";

export interface BlogPostSummary {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  coverImage: string | null;
  status: BlogStatus;
  publishedAt: Date | null;
  createdAt: Date;
}

// ─── Orders ──────────────────────────────────────────────

export type OrderStatus = "new" | "reviewing" | "accepted" | "rejected" | "completed";

// ─── Contact ─────────────────────────────────────────────

export type ContactCategory =
  | "collaboration"
  | "inquiry"
  | "acquisition"
  | "media"
  | "other";

export type MessageStatus = "new" | "replied" | "closed";

// ─── Site Settings ───────────────────────────────────────

export interface SiteSettings {
  id: string;
  logoLight: string | null;
  logoDark: string | null;
  titleAr: string | null;
  titleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  socialInstagram: string | null;
  socialX: string | null;
  socialBehance: string | null;
  socialLinkedin: string | null;
  socialEmail: string | null;
  heroImageUrl: string | null;
  heroQuoteAr: string | null;
  heroQuoteEn: string | null;
  fontHeadingUrl: string | null;
  fontBodyUrl: string | null;
  fontHeadingName: string | null;
  fontBodyName: string | null;
}
