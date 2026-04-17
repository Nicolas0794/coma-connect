import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import {
  generateUniqueSlug,
  recomputeCreatorCompleteness,
} from "../src/lib/creator-profile";

async function main() {
  const creators = await prisma.creator.findMany({
    select: { id: true, fullName: true, artistName: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`→ Procesando ${creators.length} creadores…`);

  let slugged = 0;
  for (const creator of creators) {
    if (creator.slug) continue;
    const source = creator.artistName || creator.fullName;
    const slug = await generateUniqueSlug(source, creator.id);
    await prisma.creator.update({
      where: { id: creator.id },
      data: { slug },
    });
    slugged += 1;
  }
  console.log(`✓ Slugs generados: ${slugged}`);

  let completenessUpdated = 0;
  for (const creator of creators) {
    await recomputeCreatorCompleteness(creator.id);
    completenessUpdated += 1;
  }
  console.log(`✓ Completeness recalculado: ${completenessUpdated}`);

  const verified = await prisma.creator.findMany({
    where: {
      comaVerifiedAt: null,
      campaignCreators: { some: { status: "COMPLETED" } },
    },
    select: {
      id: true,
      campaignCreators: {
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "asc" },
        take: 1,
        select: { completedAt: true },
      },
    },
  });

  for (const creator of verified) {
    const firstCompleted = creator.campaignCreators[0]?.completedAt;
    await prisma.creator.update({
      where: { id: creator.id },
      data: { comaVerifiedAt: firstCompleted ?? new Date() },
    });
  }
  console.log(`✓ comaVerifiedAt seteado en ${verified.length} creadores`);

  const rated = await prisma.campaignCreator.findMany({
    where: {
      clientRating: { not: null },
      review: null,
    },
    select: {
      id: true,
      creatorId: true,
      clientRating: true,
      clientFeedback: true,
      ratedAt: true,
      campaign: { select: { clientId: true } },
    },
  });

  let reviewsCreated = 0;
  for (const cc of rated) {
    if (!cc.clientRating) continue;
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
    reviewsCreated += 1;
  }
  console.log(`✓ CreatorReview creados: ${reviewsCreated}`);

  console.log("\n✅ Backfill completo.");
  console.log("Todos los creadores quedan en profileStatus=DRAFT y visibility=PRIVATE (default).");
  console.log("Para publicar un perfil: update profileStatus=PUBLISHED y profileVisibility=PUBLIC desde admin.");
}

main()
  .catch((err) => {
    console.error("Error en backfill:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
