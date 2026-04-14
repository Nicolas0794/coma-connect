-- AlterTable
ALTER TABLE "Creator" ADD COLUMN     "certBancariaUrl" TEXT,
ADD COLUMN     "docsCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "documentId" TEXT,
ADD COLUMN     "rutUrl" TEXT;
