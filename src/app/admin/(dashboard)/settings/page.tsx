export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import SettingsForm from "@/components/admin/settings/SettingsForm";

export const metadata = {
  title: "الإعدادات العامة — لوحة التحكم",
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  // Fetch current settings (returns null if not yet saved)
  const settings = await db.siteSettings.findUnique({ where: { id: "main" } });

  return (
    <SettingsForm
      initial={{
        // Logo — 4 language-specific slots
        logoLightAr: settings?.logoLightAr ?? null,
        logoDarkAr: settings?.logoDarkAr ?? null,
        logoLightEn: settings?.logoLightEn ?? null,
        logoDarkEn: settings?.logoDarkEn ?? null,
        // Fonts legacy
        fontHeadingUrl: settings?.fontHeadingUrl ?? null,
        fontHeadingName: settings?.fontHeadingName ?? null,
        fontBodyUrl: settings?.fontBodyUrl ?? null,
        fontBodyName: settings?.fontBodyName ?? null,
        // Fonts 4-slot
        fontHeadingArUrl: settings?.fontHeadingArUrl ?? null,
        fontHeadingArName: settings?.fontHeadingArName ?? null,
        fontBodyArUrl: settings?.fontBodyArUrl ?? null,
        fontBodyArName: settings?.fontBodyArName ?? null,
        fontHeadingEnUrl: settings?.fontHeadingEnUrl ?? null,
        fontHeadingEnName: settings?.fontHeadingEnName ?? null,
        fontBodyEnUrl: settings?.fontBodyEnUrl ?? null,
        fontBodyEnName: settings?.fontBodyEnName ?? null,
        // Social
        socialInstagram: settings?.socialInstagram ?? null,
        socialX: settings?.socialX ?? null,
        socialBehance: settings?.socialBehance ?? null,
        socialLinkedin: settings?.socialLinkedin ?? null,
        socialEmail: settings?.socialEmail ?? null,
        // Hero
        heroImageUrl: settings?.heroImageUrl ?? null,
        heroQuoteAr: settings?.heroQuoteAr ?? null,
        heroQuoteEn: settings?.heroQuoteEn ?? null,
        heroQuoteSize: settings?.heroQuoteSize ?? "md",
        heroQuoteLineHeight: settings?.heroQuoteLineHeight ?? "1.5",
        heroQuoteWeight: settings?.heroQuoteWeight ?? "normal",
        // Instagram
        showInstagram: settings?.showInstagram ?? false,
        instagramUsername: settings?.instagramUsername ?? null,
        // SEO
        titleAr: settings?.titleAr ?? null,
        titleEn: settings?.titleEn ?? null,
        descriptionAr: settings?.descriptionAr ?? null,
        descriptionEn: settings?.descriptionEn ?? null,
        // Nav labels
        navPortfolioAr: settings?.navPortfolioAr ?? null,
        navPortfolioEn: settings?.navPortfolioEn ?? null,
        navBlogAr: settings?.navBlogAr ?? null,
        navBlogEn: settings?.navBlogEn ?? null,
        navAcquireAr: settings?.navAcquireAr ?? null,
        navAcquireEn: settings?.navAcquireEn ?? null,
        navAboutAr: settings?.navAboutAr ?? null,
        navAboutEn: settings?.navAboutEn ?? null,
        navContactAr: settings?.navContactAr ?? null,
        navContactEn: settings?.navContactEn ?? null,
        // Nav visibility
        navPortfolioVisible: settings?.navPortfolioVisible ?? true,
        navBlogVisible: settings?.navBlogVisible ?? true,
        navAcquireVisible: settings?.navAcquireVisible ?? true,
        navAboutVisible: settings?.navAboutVisible ?? true,
        navContactVisible: settings?.navContactVisible ?? true,
        // Layout
        layoutMode: settings?.layoutMode ?? "wide",
        // Blog signature
        blogSignatureAr: settings?.blogSignatureAr ?? null,
        blogSignatureEn: settings?.blogSignatureEn ?? null,
        blogSignaturePos: settings?.blogSignaturePos ?? "bottom",
        blogSignatureOn: settings?.blogSignatureOn ?? true,
        // Analytics
        analyticsGa4Id: settings?.analyticsGa4Id ?? null,
        analyticsGtmId: settings?.analyticsGtmId ?? null,
        analyticsMetaPixelId: settings?.analyticsMetaPixelId ?? null,
        analyticsTiktokPixelId: settings?.analyticsTiktokPixelId ?? null,
        analyticsSnapPixelId: settings?.analyticsSnapPixelId ?? null,
      }}
    />
  );
}
