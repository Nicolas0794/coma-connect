import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { recomputeCreatorRating } from "../src/lib/creator-triggers";

async function main() {
  const creators = await prisma.creator.findMany({
    select: { id: true },
  });
  let touched = 0;
  for (const c of creators) {
    await recomputeCreatorRating(c.id);
    touched += 1;
  }
  console.log(`✓ Recálculo de avgRating/reviewsCount en ${touched} creadores.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
