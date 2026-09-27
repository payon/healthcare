-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totpSecret" TEXT;

-- AlterTable
ALTER TABLE "ContentSection" ADD COLUMN     "parentKey" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "KioskContent" ADD COLUMN     "ttsFull" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ttsIntro" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);
