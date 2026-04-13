-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'main',
    "logoLight" TEXT,
    "logoDark" TEXT,
    "titleAr" TEXT,
    "titleEn" TEXT,
    "descriptionAr" TEXT,
    "descriptionEn" TEXT,
    "socialInstagram" TEXT,
    "socialX" TEXT,
    "socialBehance" TEXT,
    "socialLinkedin" TEXT,
    "socialEmail" TEXT,
    "heroImageUrl" TEXT,
    "heroQuoteAr" TEXT,
    "heroQuoteEn" TEXT,
    "fontHeadingUrl" TEXT,
    "fontBodyUrl" TEXT,
    "fontHeadingName" TEXT,
    "fontBodyName" TEXT,
    "portfolioLayouts" TEXT DEFAULT 'grid,masonry,scattered',
    "portfolioDefaultLayout" TEXT DEFAULT 'masonry',
    "heroQuoteSize" TEXT DEFAULT 'md',
    "showInstagram" BOOLEAN NOT NULL DEFAULT false,
    "instagramUsername" TEXT,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("descriptionAr", "descriptionEn", "fontBodyName", "fontBodyUrl", "fontHeadingName", "fontHeadingUrl", "heroImageUrl", "heroQuoteAr", "heroQuoteEn", "id", "logoDark", "logoLight", "portfolioDefaultLayout", "portfolioLayouts", "socialBehance", "socialEmail", "socialInstagram", "socialLinkedin", "socialX", "titleAr", "titleEn", "updatedAt") SELECT "descriptionAr", "descriptionEn", "fontBodyName", "fontBodyUrl", "fontHeadingName", "fontHeadingUrl", "heroImageUrl", "heroQuoteAr", "heroQuoteEn", "id", "logoDark", "logoLight", "portfolioDefaultLayout", "portfolioLayouts", "socialBehance", "socialEmail", "socialInstagram", "socialLinkedin", "socialX", "titleAr", "titleEn", "updatedAt" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
