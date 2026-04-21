-- CreateTable
CREATE TABLE "Niche" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "labelEs" TEXT NOT NULL,
    "labelEn" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Niche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorNiche" (
    "creatorId" TEXT NOT NULL,
    "nicheId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorNiche_pkey" PRIMARY KEY ("creatorId","nicheId")
);

-- CreateTable
CREATE TABLE "CampaignNiche" (
    "campaignId" TEXT NOT NULL,
    "nicheId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignNiche_pkey" PRIMARY KEY ("campaignId","nicheId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Niche_slug_key" ON "Niche"("slug");

-- CreateIndex
CREATE INDEX "Niche_active_order_idx" ON "Niche"("active", "order");

-- CreateIndex
CREATE INDEX "CreatorNiche_nicheId_idx" ON "CreatorNiche"("nicheId");

-- CreateIndex
CREATE INDEX "CampaignNiche_nicheId_idx" ON "CampaignNiche"("nicheId");

-- AddForeignKey
ALTER TABLE "CreatorNiche" ADD CONSTRAINT "CreatorNiche_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorNiche" ADD CONSTRAINT "CreatorNiche_nicheId_fkey" FOREIGN KEY ("nicheId") REFERENCES "Niche"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignNiche" ADD CONSTRAINT "CampaignNiche_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignNiche" ADD CONSTRAINT "CampaignNiche_nicheId_fkey" FOREIGN KEY ("nicheId") REFERENCES "Niche"("id") ON DELETE CASCADE ON UPDATE CASCADE;
