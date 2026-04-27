-- CreateEnum
CREATE TYPE "BrandLeadStatus" AS ENUM ('PENDING', 'CONTACTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "BrandLead" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "website" TEXT,
    "industry" TEXT,
    "message" TEXT,
    "source" TEXT,
    "status" "BrandLeadStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrandLead_status_createdAt_idx" ON "BrandLead"("status", "createdAt");

-- CreateIndex
CREATE INDEX "BrandLead_contactEmail_idx" ON "BrandLead"("contactEmail");
