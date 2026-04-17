import { prisma } from "@/lib/prisma";

// Hook: llamar cuando un CampaignCreator pasa a COMPLETED.
// Setea Creator.comaVerifiedAt si todavía es null (primera campaña completada).
export async function syncCreatorVerificationOnComplete(campaignCreatorId: string) {
  const cc = await prisma.campaignCreator.findUnique({
    where: { id: campaignCreatorId },
    select: {
      completedAt: true,
      creator: { select: { id: true, comaVerifiedAt: true } },
    },
  });
  if (!cc || !cc.creator) return;
  if (cc.creator.comaVerifiedAt) return;

  await prisma.creator.update({
    where: { id: cc.creator.id },
    data: { comaVerifiedAt: cc.completedAt ?? new Date() },
  });
}

// Hook: llamar cuando un CampaignCreator recibe rating.
// Upsert de CreatorReview pública para alimentar la reputación del perfil.
export async function upsertPublicReviewFromRating(campaignCreatorId: string) {
  const cc = await prisma.campaignCreator.findUnique({
    where: { id: campaignCreatorId },
    select: {
      id: true,
      creatorId: true,
      clientRating: true,
      clientFeedback: true,
      ratedAt: true,
      campaign: { select: { clientId: true } },
    },
  });
  if (!cc || cc.clientRating == null) return;

  const existing = await prisma.creatorReview.findUnique({
    where: { campaignCreatorId: cc.id },
  });

  if (existing) {
    await prisma.creatorReview.update({
      where: { id: existing.id },
      data: {
        rating: cc.clientRating,
        feedback: cc.clientFeedback,
      },
    });
    return;
  }

  await prisma.creatorReview.create({
    data: {
      creatorId: cc.creatorId,
      clientId: cc.campaign.clientId,
      campaignCreatorId: cc.id,
      rating: cc.clientRating,
      feedback: cc.clientFeedback,
      createdAt: cc.ratedAt ?? new Date(),
    },
  });
}
