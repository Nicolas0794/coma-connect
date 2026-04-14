-- CreateTable
CREATE TABLE "CampaignMessage" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignMessage_campaignId_createdAt_idx" ON "CampaignMessage"("campaignId", "createdAt");

-- AddForeignKey
ALTER TABLE "CampaignMessage" ADD CONSTRAINT "CampaignMessage_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignMessage" ADD CONSTRAINT "CampaignMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
