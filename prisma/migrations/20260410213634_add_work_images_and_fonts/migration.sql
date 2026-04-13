-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "fontBodyArName" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "fontBodyArUrl" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "fontBodyEnName" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "fontBodyEnUrl" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "fontHeadingArName" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "fontHeadingArUrl" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "fontHeadingEnName" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "fontHeadingEnUrl" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "heroQuoteLineHeight" TEXT DEFAULT '1.5';

-- CreateTable
CREATE TABLE "WorkImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "WorkImage_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
