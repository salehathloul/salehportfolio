-- CreateTable
CREATE TABLE "About" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'main',
    "layout" TEXT NOT NULL DEFAULT 'classic',
    "imageUrl" TEXT,
    "nameAr" TEXT,
    "nameEn" TEXT,
    "bioAr" TEXT,
    "bioEn" TEXT,
    "experience" JSONB,
    "achievements" JSONB,
    "updatedAt" DATETIME NOT NULL
);
