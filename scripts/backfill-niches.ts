/**
 * Backfill de MEJORA-10: normaliza Creator.niches y Campaign.requiredNiches
 * (String[] libre) al nuevo modelo Niche + junctions.
 *
 * Uso:
 *   pnpm tsx scripts/backfill-niches.ts
 *
 * Idempotente: se puede correr varias veces sin duplicar.
 *
 * Pasos:
 *   1. Siembra los nichos canónicos (NICHES constante).
 *   2. Lee todos los Creator con niches no-vacíos. Para cada uno:
 *      - slugify cada valor
 *      - ensureNicheBySlug (crea Niche si no existe, con label derivado)
 *      - upsert CreatorNiche
 *   3. Mismo proceso para Campaign.requiredNiches.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { slugifyNiche, titleCaseNiche } from "../src/lib/niches";
import {
  ensureNicheBySlug,
  seedCanonicalNiches,
} from "../src/lib/niches-db";

async function main() {
  console.log("[backfill-niches] seeding canonical niches...");
  await seedCanonicalNiches();

  // Creators
  const creators = await prisma.creator.findMany({
    where: { niches: { isEmpty: false } },
    select: { id: true, niches: true, fullName: true },
  });

  console.log(`[backfill-niches] procesando ${creators.length} creadores...`);
  let creatorLinks = 0;
  for (const c of creators) {
    const slugs = [...new Set(c.niches.map(slugifyNiche).filter(Boolean))];
    for (const slug of slugs) {
      const nicheId = await ensureNicheBySlug(slug, titleCaseNiche(slug));
      const result = await prisma.creatorNiche.upsert({
        where: { creatorId_nicheId: { creatorId: c.id, nicheId } },
        create: { creatorId: c.id, nicheId },
        update: {},
      });
      if (result) creatorLinks += 1;
    }
  }
  console.log(`[backfill-niches]   → ${creatorLinks} CreatorNiche escritos`);

  // Campaigns
  const campaigns = await prisma.campaign.findMany({
    where: { requiredNiches: { isEmpty: false } },
    select: { id: true, requiredNiches: true, name: true },
  });

  console.log(`[backfill-niches] procesando ${campaigns.length} campañas...`);
  let campaignLinks = 0;
  for (const camp of campaigns) {
    const slugs = [
      ...new Set(camp.requiredNiches.map(slugifyNiche).filter(Boolean)),
    ];
    for (const slug of slugs) {
      const nicheId = await ensureNicheBySlug(slug, titleCaseNiche(slug));
      await prisma.campaignNiche.upsert({
        where: { campaignId_nicheId: { campaignId: camp.id, nicheId } },
        create: { campaignId: camp.id, nicheId },
        update: {},
      });
      campaignLinks += 1;
    }
  }
  console.log(`[backfill-niches]   → ${campaignLinks} CampaignNiche escritos`);

  const totalNiches = await prisma.niche.count();
  console.log(`[backfill-niches] total Niche en DB: ${totalNiches}`);
  console.log("[backfill-niches] ✅ listo");
}

main()
  .catch((err) => {
    console.error("[backfill-niches] error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
