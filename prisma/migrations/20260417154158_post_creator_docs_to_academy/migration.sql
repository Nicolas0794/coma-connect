-- CreateEnum
CREATE TYPE "CreatorType" AS ENUM ('UGC', 'INFLUENCER', 'FILMMAKER', 'PHOTOGRAPHER', 'EDITOR', 'STRATEGIST', 'COPYWRITER', 'DESIGNER', 'MODEL');

-- CreateEnum
CREATE TYPE "ContentFormat" AS ENUM ('REEL', 'TIKTOK_VIDEO', 'PHOTO', 'LONG_VIDEO', 'CAROUSEL', 'LIVE', 'PODCAST', 'BLOG');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('ES', 'EN', 'PT');

-- CreateEnum
CREATE TYPE "CreatorAvailability" AS ENUM ('AVAILABLE', 'LIMITED', 'BUSY', 'CLOSED');

-- CreateEnum
CREATE TYPE "CreatorProfileStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('PUBLIC', 'CLIENTS_ONLY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('PENDING', 'VIEWED', 'QUOTED', 'ACCEPTED', 'REJECTED', 'CONVERTED_TO_CAMPAIGN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "SkillCategory" AS ENUM ('STORYTELLING', 'PRODUCTION', 'EDITING', 'STRATEGY', 'BRAND', 'TECH', 'SOFT');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('MEETUP', 'WORKSHOP', 'PANEL', 'PARTY', 'CONFERENCE', 'WEBINAR');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('REGISTERED', 'WAITLIST', 'CANCELLED', 'ATTENDED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "SpeakerRole" AS ENUM ('SPEAKER', 'PANELIST', 'HOST', 'SPECIAL_GUEST');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('CAMPAIGN_COMPLETED', 'COURSE_COMPLETED', 'EVENT_ATTENDED', 'EVENT_SPEAKER', 'CERTIFICATE_EARNED', 'BADGE_EARNED');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "minFollowers" INTEGER,
ADD COLUMN     "requiredAudienceDesc" TEXT,
ADD COLUMN     "requiredCity" TEXT,
ADD COLUMN     "requiredNiches" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "requiredPlatform" "SocialPlatform";

-- AlterTable
ALTER TABLE "CampaignCreator" ADD COLUMN     "clientFeedback" TEXT,
ADD COLUMN     "clientRating" INTEGER,
ADD COLUMN     "ratedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ContentPiece" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "firstSubmittedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Creator" ADD COLUMN     "artistName" TEXT,
ADD COLUMN     "availability" "CreatorAvailability" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "avgRating" DOUBLE PRECISION,
ADD COLUMN     "baseRateCOP" DECIMAL(14,2),
ADD COLUMN     "baseRateUSD" DECIMAL(10,2),
ADD COLUMN     "comaVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "contentFormats" "ContentFormat"[] DEFAULT ARRAY[]::"ContentFormat"[],
ADD COLUMN     "creatorTypes" "CreatorType"[] DEFAULT ARRAY[]::"CreatorType"[],
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "identityVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "languages" "Language"[] DEFAULT ARRAY[]::"Language"[],
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "ogImageUrl" TEXT,
ADD COLUMN     "profileCompleteness" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "profileStatus" "CreatorProfileStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'PRIVATE',
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "reviewsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "showPricing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "valuePitch" TEXT,
ADD COLUMN     "yearsOfExperience" INTEGER;

-- AlterTable
ALTER TABLE "CreatorSocialProfile" ADD COLUMN     "selfReportedFollowers" INTEGER,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedEngagement" DOUBLE PRECISION,
ADD COLUMN     "verifiedFollowers" INTEGER;

-- CreateTable
CREATE TABLE "ClientCreator" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "firstAcceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCollaborationAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignsCount" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,

    CONSTRAINT "ClientCreator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignAttachment" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignSuggestion" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "fromCommunity" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "format" "ContentFormat",
    "priceCOP" DECIMAL(14,2),
    "priceUSD" DECIMAL(10,2),
    "deliveryDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "format" "ContentFormat",
    "brandName" TEXT,
    "clientId" TEXT,
    "contentPieceId" TEXT,
    "externalUrl" TEXT,
    "coverImageUrl" TEXT,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "views" INTEGER,
    "engagement" DOUBLE PRECISION,
    "isVerifiedByComa" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorReview" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "campaignCreatorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "creatorResponse" TEXT,
    "creatorResponseAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "clientId" TEXT,
    "contactEmail" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT,
    "brief" TEXT NOT NULL,
    "budgetCOP" DECIMAL(14,2),
    "deadline" TIMESTAMP(3),
    "status" "InquiryStatus" NOT NULL DEFAULT 'PENDING',
    "campaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "priceCOP" DECIMAL(14,2) NOT NULL,
    "scope" TEXT NOT NULL,
    "deliveryDays" INTEGER,
    "terms" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryMessage" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedCreator" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedCreator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileView" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "viewerId" TEXT,
    "source" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "SkillCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "coverUrl" TEXT,
    "level" "CourseLevel" NOT NULL DEFAULT 'BEGINNER',
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "durationMin" INTEGER,
    "priceCOP" DECIMAL(14,2),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseModule" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CourseModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "videoUrl" TEXT,
    "bodyMd" TEXT,
    "durationMin" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseSkill" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "CourseSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "progressPct" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "certificateUrl" TEXT,
    "skillsEarned" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorSkill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "EventType" NOT NULL DEFAULT 'MEETUP',
    "city" TEXT,
    "venue" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "capacity" INTEGER,
    "coverUrl" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "organizerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSpeaker" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "SpeakerRole" NOT NULL DEFAULT 'SPEAKER',

    CONSTRAINT "EventSpeaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attendedAt" TIMESTAMP(3),

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventTag" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "EventTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AchievementType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "emoji" TEXT,
    "sourceId" TEXT,
    "linkUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientCreator_clientId_lastCollaborationAt_idx" ON "ClientCreator"("clientId", "lastCollaborationAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClientCreator_clientId_creatorId_key" ON "ClientCreator"("clientId", "creatorId");

-- CreateIndex
CREATE INDEX "CampaignAttachment_campaignId_uploadedAt_idx" ON "CampaignAttachment"("campaignId", "uploadedAt");

-- CreateIndex
CREATE INDEX "CampaignSuggestion_campaignId_score_idx" ON "CampaignSuggestion"("campaignId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignSuggestion_campaignId_creatorId_key" ON "CampaignSuggestion"("campaignId", "creatorId");

-- CreateIndex
CREATE INDEX "Service_creatorId_isActive_idx" ON "Service"("creatorId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioItem_contentPieceId_key" ON "PortfolioItem"("contentPieceId");

-- CreateIndex
CREATE INDEX "PortfolioItem_creatorId_order_idx" ON "PortfolioItem"("creatorId", "order");

-- CreateIndex
CREATE INDEX "PortfolioItem_creatorId_isFeatured_idx" ON "PortfolioItem"("creatorId", "isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorReview_campaignCreatorId_key" ON "CreatorReview"("campaignCreatorId");

-- CreateIndex
CREATE INDEX "CreatorReview_creatorId_createdAt_idx" ON "CreatorReview"("creatorId", "createdAt");

-- CreateIndex
CREATE INDEX "CreatorReview_creatorId_rating_idx" ON "CreatorReview"("creatorId", "rating");

-- CreateIndex
CREATE INDEX "Inquiry_creatorId_status_createdAt_idx" ON "Inquiry"("creatorId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Quote_inquiryId_createdAt_idx" ON "Quote"("inquiryId", "createdAt");

-- CreateIndex
CREATE INDEX "InquiryMessage_inquiryId_createdAt_idx" ON "InquiryMessage"("inquiryId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SavedCreator_userId_creatorId_key" ON "SavedCreator"("userId", "creatorId");

-- CreateIndex
CREATE INDEX "ProfileView_creatorId_viewedAt_idx" ON "ProfileView"("creatorId", "viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_slug_key" ON "Skill"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "Course_status_publishedAt_idx" ON "Course"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "CourseModule_courseId_order_idx" ON "CourseModule"("courseId", "order");

-- CreateIndex
CREATE INDEX "Lesson_moduleId_order_idx" ON "Lesson"("moduleId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "CourseSkill_courseId_skillId_key" ON "CourseSkill"("courseId", "skillId");

-- CreateIndex
CREATE INDEX "CourseEnrollment_userId_status_idx" ON "CourseEnrollment"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollment_userId_courseId_key" ON "CourseEnrollment"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_enrollmentId_lessonId_key" ON "LessonProgress"("enrollmentId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_enrollmentId_key" ON "Certificate"("enrollmentId");

-- CreateIndex
CREATE INDEX "Certificate_userId_issuedAt_idx" ON "Certificate"("userId", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorSkill_userId_skillId_key" ON "CreatorSkill"("userId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_status_startAt_idx" ON "Event"("status", "startAt");

-- CreateIndex
CREATE INDEX "Event_city_startAt_idx" ON "Event"("city", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventSpeaker_eventId_userId_key" ON "EventSpeaker"("eventId", "userId");

-- CreateIndex
CREATE INDEX "EventRegistration_userId_status_idx" ON "EventRegistration"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_userId_key" ON "EventRegistration"("eventId", "userId");

-- CreateIndex
CREATE INDEX "EventTag_tag_idx" ON "EventTag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "EventTag_eventId_tag_key" ON "EventTag"("eventId", "tag");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_issuedAt_idx" ON "UserAchievement"("userId", "issuedAt");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_type_idx" ON "UserAchievement"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Creator_slug_key" ON "Creator"("slug");

-- CreateIndex
CREATE INDEX "Creator_profileStatus_profileVisibility_idx" ON "Creator"("profileStatus", "profileVisibility");

-- CreateIndex
CREATE INDEX "Creator_city_country_idx" ON "Creator"("city", "country");

-- AddForeignKey
ALTER TABLE "ClientCreator" ADD CONSTRAINT "ClientCreator_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientCreator" ADD CONSTRAINT "ClientCreator_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignAttachment" ADD CONSTRAINT "CampaignAttachment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignSuggestion" ADD CONSTRAINT "CampaignSuggestion_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignSuggestion" ADD CONSTRAINT "CampaignSuggestion_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_contentPieceId_fkey" FOREIGN KEY ("contentPieceId") REFERENCES "ContentPiece"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorReview" ADD CONSTRAINT "CreatorReview_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorReview" ADD CONSTRAINT "CreatorReview_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorReview" ADD CONSTRAINT "CreatorReview_campaignCreatorId_fkey" FOREIGN KEY ("campaignCreatorId") REFERENCES "CampaignCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryMessage" ADD CONSTRAINT "InquiryMessage_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryMessage" ADD CONSTRAINT "InquiryMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCreator" ADD CONSTRAINT "SavedCreator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCreator" ADD CONSTRAINT "SavedCreator_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSkill" ADD CONSTRAINT "CourseSkill_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSkill" ADD CONSTRAINT "CourseSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "CourseEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "CourseEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorSkill" ADD CONSTRAINT "CreatorSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorSkill" ADD CONSTRAINT "CreatorSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSpeaker" ADD CONSTRAINT "EventSpeaker_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSpeaker" ADD CONSTRAINT "EventSpeaker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTag" ADD CONSTRAINT "EventTag_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

