-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CREATOR';

-- CreateTable
CREATE TABLE "InvitedEmail" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "invitedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "InvitedEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvitedEmail_email_key" ON "InvitedEmail"("email");

-- CreateIndex
CREATE INDEX "InvitedEmail_role_idx" ON "InvitedEmail"("role");
