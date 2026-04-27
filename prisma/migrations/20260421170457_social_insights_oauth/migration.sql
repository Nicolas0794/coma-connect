-- AlterTable
ALTER TABLE "CreatorSocialProfile" ADD COLUMN     "accessToken" TEXT,
ADD COLUMN     "connectedAt" TIMESTAMP(3),
ADD COLUMN     "disconnectedAt" TIMESTAMP(3),
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "tokenScope" TEXT;

-- CreateTable
CREATE TABLE "SocialInsight" (
    "id" TEXT NOT NULL,
    "socialProfileId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "followers" INTEGER,
    "reach30d" INTEGER,
    "impressions30d" INTEGER,
    "profileViews30d" INTEGER,
    "websiteClicks30d" INTEGER,
    "avgEngagementRate" DOUBLE PRECISION,
    "genderFemalePct" DOUBLE PRECISION,
    "genderMalePct" DOUBLE PRECISION,
    "genderOtherPct" DOUBLE PRECISION,
    "age13_17Pct" DOUBLE PRECISION,
    "age18_24Pct" DOUBLE PRECISION,
    "age25_34Pct" DOUBLE PRECISION,
    "age35_44Pct" DOUBLE PRECISION,
    "age45_54Pct" DOUBLE PRECISION,
    "age55PlusPct" DOUBLE PRECISION,
    "topCities" JSONB,
    "topCountries" JSONB,
    "rawPayload" JSONB,

    CONSTRAINT "SocialInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialInsight_socialProfileId_capturedAt_idx" ON "SocialInsight"("socialProfileId", "capturedAt");

-- CreateIndex
CREATE INDEX "CreatorSocialProfile_externalId_idx" ON "CreatorSocialProfile"("externalId");

-- AddForeignKey
ALTER TABLE "SocialInsight" ADD CONSTRAINT "SocialInsight_socialProfileId_fkey" FOREIGN KEY ("socialProfileId") REFERENCES "CreatorSocialProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
